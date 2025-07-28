/**
 * Transferable Objects Examples
 *
 * This example demonstrates zero-copy data transfer using transferable objects
 * like ArrayBuffer and ImageData for efficient worker communication.
 */

// ArrayBuffer transfer example
function transferArrayBufferExample() {
  // Create large buffer
  const buffer = new ArrayBuffer(1024 * 1024); // 1MB
  const view = new Uint8Array(buffer);

  // Fill with data
  for (let i = 0; i < view.length; i++) {
    view[i] = i % 256;
  }

  console.log('Buffer size before transfer:', buffer.byteLength); // 1048576

  // Create worker and transfer buffer
  const worker = new Worker('data-processor.js');

  // Transfer to worker (zero-copy!)
  worker.postMessage(
    {
      type: 'process',
      buffer: buffer,
      metadata: {
        size: view.length,
        timestamp: Date.now(),
      },
    },
    [buffer] // Transfer list - buffer ownership moves to worker
  );

  // ⚠️ buffer is now neutered (unusable) in main thread
  console.log('Buffer size after transfer:', buffer.byteLength); // 0

  // Listen for processed result
  worker.onmessage = ({ data }) => {
    if (data.type === 'processed') {
      const resultBuffer = data.buffer;
      const resultView = new Uint8Array(resultBuffer);
      console.log('Received processed data:', resultView.length, 'bytes');
    }
  };
}

// ImageData transfer for canvas processing
function transferImageDataExample() {
  // Create canvas for image processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = 1920;
  canvas.height = 1080;

  // Fill canvas with sample data
  ctx.fillStyle = 'rgb(200, 100, 50)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  console.log('ImageData size:', imageData.data.length, 'bytes');

  // Create image processing worker
  const worker = new Worker('image-processor.js');

  // Transfer ImageData buffer for processing
  worker.postMessage(
    {
      type: 'processImage',
      imageData: {
        data: imageData.data,
        width: imageData.width,
        height: imageData.height,
      },
      filters: ['brightness', 'contrast'],
    },
    [imageData.data.buffer] // Transfer the underlying ArrayBuffer
  );

  // Handle processed image
  worker.onmessage = ({ data }) => {
    if (data.type === 'imageProcessed') {
      // Reconstruct ImageData from transferred buffer
      const processedImageData = new ImageData(
        new Uint8ClampedArray(data.buffer),
        canvas.width,
        canvas.height
      );

      // Apply processed image back to canvas
      ctx.putImageData(processedImageData, 0, 0);
      console.log('Image processing complete');
    }
  };
}

// Batch transfer for multiple buffers
class BatchTransferManager {
  private batch: ArrayBuffer[] = [];
  private batchSize = 10;
  private transferCallback: (buffers: ArrayBuffer[]) => void;

  constructor(callback: (buffers: ArrayBuffer[]) => void) {
    this.transferCallback = callback;
  }

  addBuffer(buffer: ArrayBuffer): void {
    this.batch.push(buffer);

    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }

  flush(): void {
    if (this.batch.length === 0) return;

    const transferList = this.batch.slice();
    console.log(`Transferring batch of ${transferList.length} buffers`);

    this.transferCallback(transferList);
    this.batch = [];
  }

  // Get current batch size
  getBatchSize(): number {
    return this.batch.length;
  }
}

// Example usage of batch transfer
function batchTransferExample() {
  const worker = new Worker('batch-processor.js');

  const batchManager = new BatchTransferManager((buffers: ArrayBuffer[]) => {
    worker.postMessage(
      {
        type: 'processBatch',
        buffers: buffers,
        timestamp: Date.now(),
      },
      buffers // Transfer all buffers
    );
  });

  // Simulate adding buffers over time
  for (let i = 0; i < 25; i++) {
    const buffer = new ArrayBuffer(1024);
    const view = new Uint8Array(buffer);
    view.fill(i); // Fill with sample data

    batchManager.addBuffer(buffer);
  }

  // Flush remaining buffers
  batchManager.flush();
}

// SharedArrayBuffer example (when available)
function sharedArrayBufferExample() {
  // Check if SharedArrayBuffer is available
  if (typeof SharedArrayBuffer === 'undefined') {
    console.warn('SharedArrayBuffer not available');
    return;
  }

  // Create shared buffer
  const sharedBuffer = new SharedArrayBuffer(1024);
  const sharedView = new Int32Array(sharedBuffer);

  // Fill with initial data
  for (let i = 0; i < sharedView.length; i++) {
    sharedView[i] = i;
  }

  const worker = new Worker('shared-buffer-worker.js');

  // Send shared buffer (no transfer needed - it's shared!)
  worker.postMessage({
    type: 'processShared',
    sharedBuffer: sharedBuffer,
  });

  // Both main thread and worker can access the same memory
  // Use Atomics for thread-safe operations
  const originalValue = Atomics.load(sharedView, 0);
  console.log('Original value:', originalValue);

  // Worker can modify, main thread sees changes immediately
  worker.onmessage = ({ data }) => {
    if (data.type === 'sharedProcessed') {
      const newValue = Atomics.load(sharedView, 0);
      console.log('Value after worker processing:', newValue);
    }
  };
}

export {
  transferArrayBufferExample,
  transferImageDataExample,
  BatchTransferManager,
  batchTransferExample,
  sharedArrayBufferExample,
};
