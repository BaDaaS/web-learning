/**
 * Worker Pool Implementation for Managing Concurrent Tasks
 *
 * This example demonstrates a robust worker pool that can handle
 * multiple concurrent tasks with proper load balancing and error handling.
 */

interface Task<T = any> {
  id: string;
  data: T;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface WorkerPoolOptions {
  workerScript: string;
  maxWorkers?: number;
  taskTimeout?: number;
  maxRetries?: number;
}

interface WorkerInstance {
  worker: Worker;
  busy: boolean;
  currentTask: Task | null;
  tasksCompleted: number;
}

export class WorkerPool {
  private workers: WorkerInstance[] = [];
  private taskQueue: Task[] = [];
  private maxWorkers: number;
  private taskTimeout: number;
  private maxRetries: number;
  private workerScript: string;
  private isDestroyed: boolean = false;

  constructor(options: WorkerPoolOptions) {
    this.workerScript = options.workerScript;
    this.maxWorkers = options.maxWorkers || navigator.hardwareConcurrency || 4;
    this.taskTimeout = options.taskTimeout || 30000; // 30 seconds
    this.maxRetries = options.maxRetries || 3;

    // Initialize workers
    this.initializeWorkers();
  }

  /**
   * Execute a task using the worker pool
   */
  async execute<T, R>(data: T): Promise<R> {
    if (this.isDestroyed) {
      throw new Error('Worker pool has been destroyed');
    }

    return new Promise<R>((resolve, reject) => {
      const task: Task<T> = {
        id: this.generateTaskId(),
        data,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.taskQueue.push(task);
      this.processQueue();
    });
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const busyWorkers = this.workers.filter((w) => w.busy).length;
    const totalTasksCompleted = this.workers.reduce(
      (sum, w) => sum + w.tasksCompleted,
      0
    );

    return {
      totalWorkers: this.workers.length,
      busyWorkers,
      availableWorkers: this.workers.length - busyWorkers,
      queueLength: this.taskQueue.length,
      totalTasksCompleted,
    };
  }

  /**
   * Terminate all workers and clean up resources
   */
  destroy(): void {
    this.isDestroyed = true;

    // Reject all queued tasks
    this.taskQueue.forEach((task) => {
      task.reject(new Error('Worker pool destroyed'));
    });
    this.taskQueue = [];

    // Terminate all workers
    this.workers.forEach((workerInstance) => {
      if (workerInstance.currentTask) {
        workerInstance.currentTask.reject(new Error('Worker terminated'));
      }
      workerInstance.worker.terminate();
    });
    this.workers = [];
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker();
    }
  }

  private createWorker(): void {
    const worker = new Worker(this.workerScript);
    const workerInstance: WorkerInstance = {
      worker,
      busy: false,
      currentTask: null,
      tasksCompleted: 0,
    };

    worker.addEventListener('message', (event) => {
      this.handleWorkerMessage(workerInstance, event);
    });

    worker.addEventListener('error', (error) => {
      this.handleWorkerError(workerInstance, error);
    });

    this.workers.push(workerInstance);
  }

  private handleWorkerMessage(
    workerInstance: WorkerInstance,
    event: MessageEvent
  ): void {
    const { taskId, result, error } = event.data;
    const task = workerInstance.currentTask;

    if (!task || task.id !== taskId) {
      console.warn('Received message for unknown task:', taskId);
      return;
    }

    // Mark worker as available
    workerInstance.busy = false;
    workerInstance.currentTask = null;
    workerInstance.tasksCompleted++;

    if (error) {
      task.reject(new Error(error));
    } else {
      task.resolve(result);
    }

    // Process next task in queue
    this.processQueue();
  }

  private handleWorkerError(
    workerInstance: WorkerInstance,
    error: ErrorEvent
  ): void {
    console.error('Worker error:', error);

    const task = workerInstance.currentTask;
    if (task) {
      workerInstance.busy = false;
      workerInstance.currentTask = null;
      task.reject(new Error(`Worker error: ${error.message}`));
    }

    // Replace the failed worker
    this.replaceWorker(workerInstance);

    // Process queue with remaining workers
    this.processQueue();
  }

  private replaceWorker(failedWorker: WorkerInstance): void {
    // Remove failed worker
    const index = this.workers.indexOf(failedWorker);
    if (index > -1) {
      this.workers.splice(index, 1);
      failedWorker.worker.terminate();
    }

    // Create replacement worker
    this.createWorker();
  }

  private processQueue(): void {
    if (this.taskQueue.length === 0) {
      return;
    }

    // Find available worker
    const availableWorker = this.workers.find((w) => !w.busy);
    if (!availableWorker) {
      return;
    }

    // Get next task
    const task = this.taskQueue.shift();
    if (!task) {
      return;
    }

    // Check if task has timed out while in queue
    if (Date.now() - task.timestamp > this.taskTimeout) {
      task.reject(new Error('Task timed out in queue'));
      this.processQueue(); // Try next task
      return;
    }

    // Assign task to worker
    availableWorker.busy = true;
    availableWorker.currentTask = task;

    // Set up timeout for the task
    const timeoutId = setTimeout(() => {
      if (availableWorker.currentTask?.id === task.id) {
        availableWorker.busy = false;
        availableWorker.currentTask = null;
        task.reject(new Error('Task execution timeout'));
        this.processQueue();
      }
    }, this.taskTimeout);

    // Send task to worker
    availableWorker.worker.postMessage({
      taskId: task.id,
      data: task.data,
    });

    // Clear timeout when task completes
    const originalResolve = task.resolve;
    const originalReject = task.reject;

    task.resolve = (result) => {
      clearTimeout(timeoutId);
      originalResolve(result);
    };

    task.reject = (error) => {
      clearTimeout(timeoutId);
      originalReject(error);
    };

    // Continue processing queue if more workers available
    this.processQueue();
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Example usage:
/*
const pool = new WorkerPool({
  workerScript: './data-processor.worker.js',
  maxWorkers: 4,
  taskTimeout: 10000,
});

try {
  const result = await pool.execute({ data: [1, 2, 3, 4, 5] });
  console.log('Processing result:', result);
} catch (error) {
  console.error('Task failed:', error);
} finally {
  pool.destroy();
}
*/
