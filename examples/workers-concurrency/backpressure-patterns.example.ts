/**
 * Backpressure Control Patterns
 *
 * This example demonstrates how to implement backpressure mechanisms
 * to prevent overwhelming workers with too much data at once.
 */

// Credit-based flow control for managing outstanding operations
class BackpressureController {
  private credits = 10; // Max outstanding operations
  private pendingWork: Array<() => void> = [];

  async processWithBackpressure<T>(
    data: T,
    processor: (data: T) => Promise<void>
  ): Promise<void> {
    return new Promise((resolve) => {
      const work = async () => {
        this.credits--;
        try {
          await processor(data);
        } finally {
          this.credits++;
          this.processNext();
          resolve();
        }
      };

      if (this.credits > 0) {
        work();
      } else {
        this.pendingWork.push(work);
      }
    });
  }

  private processNext(): void {
    if (this.credits > 0 && this.pendingWork.length > 0) {
      const work = this.pendingWork.shift()!;
      work();
    }
  }

  // Get current status for monitoring
  getStatus() {
    return {
      availableCredits: this.credits,
      pendingWorkCount: this.pendingWork.length,
    };
  }
}

// Bounded queue implementation for managing message flow
class BoundedMessageQueue<T> {
  private queue: T[] = [];
  private waitingConsumers: Array<(value: T) => void> = [];
  private waitingProducers: Array<() => void> = [];

  constructor(private maxSize: number) {}

  async put(item: T): Promise<void> {
    if (this.waitingConsumers.length > 0) {
      // Direct handoff to waiting consumer
      const consumer = this.waitingConsumers.shift()!;
      consumer(item);
      return;
    }

    if (this.queue.length >= this.maxSize) {
      // Queue is full, wait for space
      await new Promise<void>((resolve) => {
        this.waitingProducers.push(resolve);
      });
    }

    this.queue.push(item);
  }

  async take(): Promise<T> {
    if (this.queue.length > 0) {
      const item = this.queue.shift()!;

      // Notify waiting producer
      if (this.waitingProducers.length > 0) {
        const producer = this.waitingProducers.shift()!;
        producer();
      }

      return item;
    }

    // Queue is empty, wait for item
    return new Promise<T>((resolve) => {
      this.waitingConsumers.push(resolve);
    });
  }

  // Get queue status for monitoring
  getStatus() {
    return {
      queueSize: this.queue.length,
      maxSize: this.maxSize,
      waitingConsumers: this.waitingConsumers.length,
      waitingProducers: this.waitingProducers.length,
      utilization: this.queue.length / this.maxSize,
    };
  }
}

// Example usage combining both patterns
class WorkerBackpressureManager {
  private worker: Worker;
  private controller: BackpressureController;
  private messageQueue: BoundedMessageQueue<any>;

  constructor(workerScript: string, maxConcurrency = 10, maxQueueSize = 100) {
    this.worker = new Worker(workerScript);
    this.controller = new BackpressureController();
    this.messageQueue = new BoundedMessageQueue(maxQueueSize);

    this.setupWorkerCommunication();
  }

  private setupWorkerCommunication() {
    this.worker.onmessage = ({ data }) => {
      if (data.type === 'processed') {
        // Processing complete, this will free up credits
        console.log('Worker completed task:', data.result);
      }
    };
  }

  async processData(data: any): Promise<void> {
    // First, add to bounded queue (may block if full)
    await this.messageQueue.put(data);

    // Then process with backpressure control
    await this.controller.processWithBackpressure(data, async (item) => {
      this.worker.postMessage({
        type: 'process',
        data: item,
        timestamp: Date.now(),
      });
    });
  }

  // Monitor system health
  getSystemStatus() {
    return {
      controller: this.controller.getStatus(),
      queue: this.messageQueue.getStatus(),
    };
  }
}

// Adaptive backpressure based on worker performance
class AdaptiveBackpressureController {
  private credits: number;
  private maxCredits: number;
  private minCredits = 1;
  private processingTimes: number[] = [];
  private maxSamples = 10;

  constructor(initialCredits = 10) {
    this.credits = initialCredits;
    this.maxCredits = initialCredits;
  }

  async processWithAdaptiveBackpressure<T>(
    data: T,
    processor: (data: T) => Promise<void>
  ): Promise<void> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const work = async () => {
        this.credits--;
        try {
          await processor(data);

          // Record processing time
          const processingTime = Date.now() - startTime;
          this.recordProcessingTime(processingTime);
          this.adjustCredits();
        } finally {
          this.credits++;
          resolve();
        }
      };

      if (this.credits > 0) {
        work();
      } else {
        // Could implement a priority queue here
        setTimeout(work, 10); // Simple retry
      }
    });
  }

  private recordProcessingTime(time: number) {
    this.processingTimes.push(time);
    if (this.processingTimes.length > this.maxSamples) {
      this.processingTimes.shift();
    }
  }

  private adjustCredits() {
    if (this.processingTimes.length < this.maxSamples) return;

    const avgTime =
      this.processingTimes.reduce((a, b) => a + b, 0) /
      this.processingTimes.length;

    // If processing is fast, increase credits
    if (avgTime < 100 && this.maxCredits < 20) {
      this.maxCredits++;
    }
    // If processing is slow, decrease credits
    else if (avgTime > 500 && this.maxCredits > this.minCredits) {
      this.maxCredits--;
    }

    // Reset credits to new maximum if currently idle
    if (this.credits === this.maxCredits - 1) {
      this.credits = this.maxCredits;
    }
  }
}

export {
  BackpressureController,
  BoundedMessageQueue,
  WorkerBackpressureManager,
  AdaptiveBackpressureController,
};
