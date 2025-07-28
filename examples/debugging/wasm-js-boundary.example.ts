/**
 * Debugging Techniques for TypeScript-WebAssembly Boundary Issues
 *
 * This example demonstrates common debugging approaches when working
 * with the boundary between JavaScript/TypeScript and WebAssembly.
 */

import type { WasmModule } from './pkg/my_wasm_module';

interface DebugConfig {
  enableLogging: boolean;
  trackMemoryUsage: boolean;
  profilePerformance: boolean;
  validateInputs: boolean;
}

interface CallStats {
  functionName: string;
  callCount: number;
  totalTime: number;
  averageTime: number;
  lastError?: Error;
}

class WasmDebugger {
  private wasmModule: WasmModule;
  private config: DebugConfig;
  private callStats: Map<string, CallStats> = new Map();
  private memorySnapshots: number[] = [];

  constructor(wasmModule: WasmModule, config: DebugConfig) {
    this.wasmModule = wasmModule;
    this.config = config;
  }

  /**
   * Wrap WASM function calls with debugging instrumentation
   */
  async debuggedCall<T extends any[], R>(
    functionName: string,
    wasmFunction: (...args: T) => R,
    args: T
  ): Promise<R> {
    const startTime = this.config.profilePerformance ? performance.now() : 0;

    try {
      // Input validation
      if (this.config.validateInputs) {
        this.validateInputs(functionName, args);
      }

      // Memory usage before call
      if (this.config.trackMemoryUsage) {
        this.captureMemorySnapshot('before_' + functionName);
      }

      // Log the call
      if (this.config.enableLogging) {
        console.log(`[WASM DEBUG] Calling ${functionName} with args:`, args);
      }

      // Execute the WASM function
      const result = wasmFunction.apply(this.wasmModule, args);

      // Handle async results
      const finalResult = result instanceof Promise ? await result : result;

      // Memory usage after call
      if (this.config.trackMemoryUsage) {
        this.captureMemorySnapshot('after_' + functionName);
      }

      // Update performance stats
      if (this.config.profilePerformance) {
        this.updateCallStats(functionName, performance.now() - startTime);
      }

      // Log successful result
      if (this.config.enableLogging) {
        console.log(`[WASM DEBUG] ${functionName} completed successfully`);
        console.log('[WASM DEBUG] Result type:', typeof finalResult);
        console.log('[WASM DEBUG] Result:', finalResult);
      }

      return finalResult;
    } catch (error) {
      // Enhanced error logging for WASM boundary issues
      console.error(`[WASM DEBUG] Error in ${functionName}:`, error);
      console.error('[WASM DEBUG] Arguments that caused error:', args);
      console.error('[WASM DEBUG] Stack trace:', error.stack);

      // Check for common WASM boundary issues
      this.diagnoseBoundaryError(functionName, args, error);

      // Update error stats
      this.updateErrorStats(functionName, error as Error);

      throw error;
    }
  }

  /**
   * Diagnose common WASM boundary issues
   */
  private diagnoseBoundaryError(
    functionName: string,
    args: any[],
    error: Error
  ): void {
    const errorMessage = error.message.toLowerCase();

    // Check for memory-related issues
    if (
      errorMessage.includes('memory') ||
      errorMessage.includes('out of bounds')
    ) {
      console.warn('[WASM DEBUG] Possible memory access violation detected');
      console.warn('[WASM DEBUG] Current memory usage:', this.getMemoryUsage());
      console.warn(
        '[WASM DEBUG] Consider checking buffer sizes and memory allocation'
      );
    }

    // Check for type conversion issues
    if (errorMessage.includes('type') || errorMessage.includes('convert')) {
      console.warn('[WASM DEBUG] Possible type conversion error detected');
      args.forEach((arg, index) => {
        console.warn(`[WASM DEBUG] Arg ${index}:`, typeof arg, arg);
      });
    }

    // Check for null/undefined issues
    if (errorMessage.includes('null') || errorMessage.includes('undefined')) {
      console.warn('[WASM DEBUG] Null/undefined value detected');
      console.warn(
        '[WASM DEBUG] Check for proper initialization of WASM module'
      );
    }

    // Check for function not found
    if (
      errorMessage.includes('function') &&
      errorMessage.includes('not found')
    ) {
      console.warn('[WASM DEBUG] Function not found - possible binding issue');
      console.warn(
        '[WASM DEBUG] Available functions:',
        Object.getOwnPropertyNames(this.wasmModule)
      );
    }
  }

  /**
   * Validate inputs before passing to WASM
   */
  private validateInputs(functionName: string, args: any[]): void {
    args.forEach((arg, index) => {
      // Check for TypedArray corruption
      if (arg instanceof Uint8Array || arg instanceof Int32Array) {
        if (arg.byteLength === 0) {
          throw new Error(
            `[WASM DEBUG] Empty TypedArray passed to ${functionName} at arg ${index}`
          );
        }
        if (arg.buffer.byteLength === 0) {
          throw new Error(
            `[WASM DEBUG] Detached ArrayBuffer passed to ${functionName} at arg ${index}`
          );
        }
      }

      // Check for NaN values
      if (typeof arg === 'number' && isNaN(arg)) {
        throw new Error(
          `[WASM DEBUG] NaN value passed to ${functionName} at arg ${index}`
        );
      }

      // Check for negative values where they might not be expected
      if (typeof arg === 'number' && arg < 0 && functionName.includes('size')) {
        console.warn(
          `[WASM DEBUG] Negative value (${arg}) passed to ${functionName} - this might be intentional`
        );
      }
    });
  }

  /**
   * Capture memory usage snapshot
   */
  private captureMemorySnapshot(label: string): void {
    if (typeof (performance as any).memory !== 'undefined') {
      const memory = (performance as any).memory;
      const snapshot = {
        label,
        timestamp: Date.now(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };

      this.memorySnapshots.push(memory.usedJSHeapSize);
      console.log('[WASM DEBUG] Memory snapshot:', snapshot);
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): any {
    if (typeof (performance as any).memory !== 'undefined') {
      return (performance as any).memory;
    }
    return { note: 'Memory API not available' };
  }

  /**
   * Update performance statistics
   */
  private updateCallStats(functionName: string, executionTime: number): void {
    let stats = this.callStats.get(functionName);
    if (!stats) {
      stats = {
        functionName,
        callCount: 0,
        totalTime: 0,
        averageTime: 0,
      };
      this.callStats.set(functionName, stats);
    }

    stats.callCount++;
    stats.totalTime += executionTime;
    stats.averageTime = stats.totalTime / stats.callCount;

    if (this.config.profilePerformance) {
      console.log(
        `[WASM DEBUG] ${functionName} took ${executionTime.toFixed(2)}ms`
      );
      console.log(
        `[WASM DEBUG] ${functionName} average: ${stats.averageTime.toFixed(2)}ms over ${stats.callCount} calls`
      );
    }
  }

  /**
   * Update error statistics
   */
  private updateErrorStats(functionName: string, error: Error): void {
    let stats = this.callStats.get(functionName);
    if (!stats) {
      stats = {
        functionName,
        callCount: 0,
        totalTime: 0,
        averageTime: 0,
      };
      this.callStats.set(functionName, stats);
    }

    stats.lastError = error;
  }

  /**
   * Generate debugging report
   */
  generateReport(): any {
    const report = {
      timestamp: new Date().toISOString(),
      configuration: this.config,
      callStatistics: Array.from(this.callStats.entries()).map(
        ([name, stats]) => ({
          function: name,
          calls: stats.callCount,
          averageTime: Math.round(stats.averageTime * 100) / 100,
          totalTime: Math.round(stats.totalTime * 100) / 100,
          hasErrors: !!stats.lastError,
          lastError: stats.lastError?.message,
        })
      ),
      memoryTrend: this.analyzeMemoryTrend(),
      recommendations: this.generateRecommendations(),
    };

    console.log('[WASM DEBUG] Debug Report:', report);
    return report;
  }

  /**
   * Analyze memory usage patterns
   */
  private analyzeMemoryTrend(): any {
    if (this.memorySnapshots.length < 2) {
      return { status: 'Insufficient data' };
    }

    const first = this.memorySnapshots[0];
    const last = this.memorySnapshots[this.memorySnapshots.length - 1];
    const trend = last - first;
    const maxUsage = Math.max(...this.memorySnapshots);
    const minUsage = Math.min(...this.memorySnapshots);

    return {
      trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
      changeBytes: trend,
      maxUsage,
      minUsage,
      volatility: maxUsage - minUsage,
    };
  }

  /**
   * Generate debugging recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const memoryTrend = this.analyzeMemoryTrend();

    if (
      memoryTrend.trend === 'increasing' &&
      memoryTrend.changeBytes > 1000000
    ) {
      recommendations.push(
        'Memory usage is increasing significantly. Check for memory leaks in WASM or event listeners.'
      );
    }

    const errorFunctions = Array.from(this.callStats.values()).filter(
      (s) => s.lastError
    );
    if (errorFunctions.length > 0) {
      recommendations.push(
        `Functions with errors: ${errorFunctions.map((s) => s.functionName).join(', ')}`
      );
    }

    const slowFunctions = Array.from(this.callStats.values()).filter(
      (s) => s.averageTime > 100
    );
    if (slowFunctions.length > 0) {
      recommendations.push(
        `Slow functions (>100ms avg): ${slowFunctions.map((s) => s.functionName).join(', ')}`
      );
    }

    return recommendations;
  }
}

// Example usage:
/*
const debugConfig: DebugConfig = {
  enableLogging: true,
  trackMemoryUsage: true,
  profilePerformance: true,
  validateInputs: true,
};

const debugger = new WasmDebugger(wasmModule, debugConfig);

// Wrap WASM calls with debugging
const result = await debugger.debuggedCall(
  'process_data',
  wasmModule.process_data.bind(wasmModule),
  [inputData]
);

// Generate debugging report
const report = debugger.generateReport();
*/

export { WasmDebugger, type DebugConfig, type CallStats };
