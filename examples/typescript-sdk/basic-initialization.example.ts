/**
 * Basic TypeScript SDK initialization pattern for WASM modules
 *
 * This example demonstrates the standard initialization flow for a TypeScript
 * SDK that wraps a WebAssembly module, handling both browser and Node.js environments.
 */

import init, { WasmModule } from './pkg/my_wasm_module';

interface InitOptions {
  wasmPath?: string;
  memory?: WebAssembly.Memory;
  enableThreads?: boolean;
}

export class MySDK {
  private wasmModule: WasmModule | null = null;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the SDK with optional configuration
   */
  async initialize(options: InitOptions = {}): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize(options);
    return this.initPromise;
  }

  private async _doInitialize(options: InitOptions): Promise<void> {
    try {
      // Initialize the WASM module
      await init(options.wasmPath);

      // Create the main module instance
      this.wasmModule = new WasmModule();

      // Configure threads if enabled and supported
      if (options.enableThreads && this._supportsThreads()) {
        await this._initializeThreads(options.memory);
      }

      this.initialized = true;
    } catch (error) {
      this.initPromise = null;
      throw new Error(`Failed to initialize SDK: ${error}`);
    }
  }

  /**
   * Check if the SDK is ready for use
   */
  isInitialized(): boolean {
    return this.initialized && this.wasmModule !== null;
  }

  /**
   * Ensure the SDK is initialized before use
   */
  private _ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
  }

  /**
   * Example API method that uses the WASM module
   */
  async processData(data: Uint8Array): Promise<Uint8Array> {
    this._ensureInitialized();
    return this.wasmModule!.process_data(data);
  }

  /**
   * Check if SharedArrayBuffer and threads are supported
   */
  private _supportsThreads(): boolean {
    return (
      typeof SharedArrayBuffer !== 'undefined' && typeof Worker !== 'undefined'
    );
  }

  /**
   * Initialize thread pool for multi-threaded operations
   */
  private async _initializeThreads(
    customMemory?: WebAssembly.Memory
  ): Promise<void> {
    // Thread initialization logic would go here
    // This is a simplified example
    console.log('Initializing thread support...');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.wasmModule) {
      this.wasmModule.free();
      this.wasmModule = null;
    }
    this.initialized = false;
    this.initPromise = null;
  }
}

// Factory function for easier instantiation
export async function createSDK(options?: InitOptions): Promise<MySDK> {
  const sdk = new MySDK();
  await sdk.initialize(options);
  return sdk;
}
