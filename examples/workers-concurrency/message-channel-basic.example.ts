/**
 * Basic MessageChannel communication pattern
 *
 * This example demonstrates how to set up bidirectional communication
 * between main thread and worker using MessageChannel and MessagePort.
 */

// Main thread setup
function initializeMessageChannel() {
  const channel = new MessageChannel();
  const { port1, port2 } = channel;

  // Create worker (assuming worker script exists)
  const worker = new Worker('worker.js');

  // Keep port1, send port2 to worker
  worker.postMessage({ type: 'init', port: port2 }, [port2]);

  // Listen on port1 for messages from worker
  port1.onmessage = ({ data }) => {
    console.log('Received from worker:', data);
  };

  // Send message to worker through port1
  port1.postMessage({ type: 'task', data: 'process this' });

  return { port1, worker };
}

// Worker thread code (would be in separate worker file)
interface WorkerGlobalScope {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (message: any, transfer?: Transferable[]) => void;
}

// This would be in the worker file
function setupWorkerMessagePort() {
  let workerPort: MessagePort;

  // Mock self for demonstration
  const self = globalThis as unknown as WorkerGlobalScope;

  self.onmessage = ({ data }) => {
    if (data.type === 'init') {
      workerPort = data.port;

      // Now worker can communicate directly through the port
      workerPort.postMessage('Worker initialized');

      workerPort.onmessage = ({ data }) => {
        // Handle messages from main thread
        processMessage(data);
      };
    }
  };

  function processMessage(data: any) {
    console.log('Worker processing:', data);

    // Process the data and send result back
    const result = {
      type: 'result',
      processed: `Processed: ${data.data}`,
      timestamp: Date.now(),
    };

    workerPort.postMessage(result);
  }
}

// Node.js version using worker_threads
function nodeMessageChannelExample() {
  // This would be used in Node.js environment
  /*
  import { Worker, MessageChannel, isMainThread } from 'worker_threads';

  if (isMainThread) {
    const { port1, port2 } = new MessageChannel();
    const worker = new Worker(__filename, {
      transferList: [port2],
      workerData: { port: port2 },
    });

    port1.on('message', (data) => {
      console.log('Received:', data);
    });
  } else {
    const { port } = require('worker_threads').workerData;
    port.postMessage('Hello from worker');
  }
  */
}

export {
  initializeMessageChannel,
  setupWorkerMessagePort,
  nodeMessageChannelExample,
};
