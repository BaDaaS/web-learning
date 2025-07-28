/**
 * Worker Pipeline Implementation
 *
 * This example demonstrates how to create a multi-stage processing pipeline
 * using workers connected via MessagePorts for efficient data flow.
 */

// Pipeline stage configuration
interface PipelineStageConfig {
  workerScript: string;
  maxConcurrency?: number;
  bufferSize?: number;
}

// Pipeline with MessagePorts connecting multiple workers
class WorkerPipeline {
  private stages: Worker[] = [];
  private channels: MessageChannel[] = [];
  private pendingRequests = new Map<string, (result: any) => void>();

  constructor(stageConfigs: PipelineStageConfig[]) {
    this.initializePipeline(stageConfigs);
  }

  private initializePipeline(stageConfigs: PipelineStageConfig[]) {
    // Create workers for each stage
    for (let i = 0; i < stageConfigs.length; i++) {
      this.stages[i] = new Worker(stageConfigs[i].workerScript);

      // Connect stages with MessageChannels
      if (i < stageConfigs.length - 1) {
        this.channels[i] = new MessageChannel();

        // Connect current worker output to next worker input
        this.stages[i].postMessage(
          {
            type: 'connect_output',
            port: this.channels[i].port1,
            stageIndex: i,
          },
          [this.channels[i].port1]
        );

        this.stages[i + 1].postMessage(
          {
            type: 'connect_input',
            port: this.channels[i].port2,
            stageIndex: i + 1,
          },
          [this.channels[i].port2]
        );
      }
    }

    // Set up result handling from final stage
    this.setupResultHandling();
  }

  private setupResultHandling() {
    const finalStage = this.stages[this.stages.length - 1];

    finalStage.onmessage = ({ data }) => {
      if (data.type === 'result' && data.requestId) {
        const resolver = this.pendingRequests.get(data.requestId);
        if (resolver) {
          resolver(data.result);
          this.pendingRequests.delete(data.requestId);
        }
      }
    };
  }

  async process(data: any): Promise<any> {
    const requestId = `req_${Date.now()}_${Math.random()}`;

    return new Promise((resolve) => {
      this.pendingRequests.set(requestId, resolve);

      // Send to first stage
      this.stages[0].postMessage({
        type: 'process',
        data,
        requestId,
        timestamp: Date.now(),
      });
    });
  }

  // Process multiple items concurrently
  async processBatch(items: any[]): Promise<any[]> {
    const promises = items.map(item => this.process(item));
    return Promise.all(promises);
  }

  // Clean up resources
  terminate() {
    for (const worker of this.stages) {
      worker.terminate();
    }
    this.stages = [];
    this.channels = [];
    this.pendingRequests.clear();
  }
}

// Advanced pipeline with backpressure and monitoring
class ManagedWorkerPipeline {
  private pipeline: WorkerPipeline;
  private metrics = {
    processed: 0,
    errors: 0,
    averageLatency: 0,
    throughput: 0,
  };
  private processingTimes: number[] = [];
  private startTime = Date.now();

  constructor(stageConfigs: PipelineStageConfig[]) {
    this.pipeline = new WorkerPipeline(stageConfigs);
  }

  async processWithMetrics(data: any): Promise<any> {
    const startTime = Date.now();

    try {
      const result = await this.pipeline.process(data);

      // Record successful processing
      const processingTime = Date.now() - startTime;
      this.recordProcessingMetrics(processingTime, true);

      return result;
    } catch (error) {
      this.recordProcessingMetrics(Date.now() - startTime, false);
      throw error;
    }
  }

  private recordProcessingMetrics(processingTime: number, success: boolean) {
    if (success) {
      this.metrics.processed++;
      this.processingTimes.push(processingTime);

      // Keep only last 100 measurements
      if (this.processingTimes.length > 100) {
        this.processingTimes.shift();
      }

      // Update average latency
      this.metrics.averageLatency =
        this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
    } else {
      this.metrics.errors++;
    }

    // Update throughput (items per second)
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    this.metrics.throughput = this.metrics.processed / elapsedSeconds;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  terminate() {
    this.pipeline.terminate();
  }
}

// Stream processing pipeline for continuous data
class StreamingPipeline {
  private pipeline: WorkerPipeline;
  private isProcessing = false;
  private inputQueue: any[] = [];
  private maxQueueSize = 1000;

  constructor(stageConfigs: PipelineStageConfig[]) {
    this.pipeline = new WorkerPipeline(stageConfigs);
  }

  // Add item to processing stream
  enqueue(item: any): boolean {
    if (this.inputQueue.length >= this.maxQueueSize) {
      return false; // Queue full
    }

    this.inputQueue.push(item);

    if (!this.isProcessing) {
      this.startProcessing();
    }

    return true;
  }

  private async startProcessing() {
    this.isProcessing = true;

    while (this.inputQueue.length > 0) {
      const batch = this.inputQueue.splice(0, 10); // Process in batches

      try {
        await this.pipeline.processBatch(batch);
      } catch (error) {
        console.error('Batch processing error:', error);
      }
    }

    this.isProcessing = false;
  }

  getQueueStatus() {
    return {
      queueSize: this.inputQueue.length,
      maxQueueSize: this.maxQueueSize,
      isProcessing: this.isProcessing,
      utilization: this.inputQueue.length / this.maxQueueSize,
    };
  }

  terminate() {
    this.pipeline.terminate();
    this.inputQueue = [];
  }
}

// Example worker stage implementation (would be in separate file)
class PipelineWorkerStage {
  private inputPort: MessagePort | null = null;
  private outputPort: MessagePort | null = null;
  private stageIndex = 0;

  constructor() {
    this.setupMessageHandling();
  }

  private setupMessageHandling() {
    // Mock self for demonstration
    const self = globalThis as any;

    self.onmessage = ({ data }: MessageEvent) => {
      switch (data.type) {
        case 'connect_input':
          this.inputPort = data.port;
          this.stageIndex = data.stageIndex;
          if (this.inputPort) {
            this.inputPort.onmessage = ({ data }) => this.processMessage(data);
          }
          break;

        case 'connect_output':
          this.outputPort = data.port;
          break;

        case 'process':
          // First stage receives directly
          this.processMessage(data);
          break;
      }
    };
  }

  private async processMessage(data: any) {
    try {
      // Simulate processing work
      const processed = await this.processData(data.data);

      const result = {
        ...data,
        data: processed,
        processedBy: this.stageIndex,
        processedAt: Date.now(),
      };

      if (this.outputPort) {
        // Send to next stage
        this.outputPort.postMessage(result);
      } else {
        // Final stage - send result back to main thread
        (globalThis as any).postMessage({
          type: 'result',
          result: processed,
          requestId: data.requestId,
        });
      }
    } catch (error) {
      (globalThis as any).postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : String(error),
        requestId: data.requestId,
      });
    }
  }

  private async processData(data: any): Promise<any> {
    // Simulate different processing stages
    switch (this.stageIndex) {
      case 0:
        // Parse/validate
        return { ...data, validated: true };
      case 1:
        // Transform
        return { ...data, transformed: Date.now() };
      case 2:
        // Enrich
        return { ...data, enriched: 'additional-data' };
      default:
        return data;
    }
  }
}

export {
  WorkerPipeline,
  ManagedWorkerPipeline,
  StreamingPipeline,
  PipelineWorkerStage,
  type PipelineStageConfig,
};