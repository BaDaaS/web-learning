/**
 * Type declarations for example WASM modules
 * These are placeholder types for the code examples
 */

declare module './pkg/my_wasm_module' {
  export default function init(wasmPath?: string): Promise<void>;

  export class WasmModule {
    constructor();
    process_data(data: Uint8Array): Uint8Array;
    process_data_async(data: Uint8Array): Promise<Uint8Array>;
    get cache_size(): number;
    clear_cache(): void;
    free(): void;
  }

  export function get_memory_usage(): number;
}