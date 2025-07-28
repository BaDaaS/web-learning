#!/usr/bin/env node

/**
 * WebAssembly Node.js Runner
 *
 * This script demonstrates how to use the Rust WebAssembly module in Node.js
 * It showcases the main functionality of the WASM module including:
 * - Synchronous data processing
 * - Asynchronous data processing with promises
 * - Memory management and caching
 *
 * Usage:
 *   node wasm-node-runner.js
 */

const path = require('path');
const fs = require('fs');

async function main() {
    console.log('🦀 WebAssembly Rust Examples - Node.js Runner\n');

    // Check if WASM package exists
    const pkgPath = path.join(__dirname, 'pkg');
    if (!fs.existsSync(pkgPath)) {
        console.error('❌ WebAssembly package not found!');
        console.error('   Please run "make build-wasm" first to build the WASM package.');
        process.exit(1);
    }

    try {
        // Import the generated WASM module
        const wasm = require('./pkg/web_learning_rust_examples.js');
        console.log('✅ WebAssembly module loaded successfully');

        // Create a new instance of the WASM module
        const wasmModule = new wasm.WasmModule();
        console.log('✅ WasmModule instance created');

        // Test 1: Basic synchronous data processing
        console.log('\n=== Test 1: Synchronous Data Processing ===');
        const testData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
        console.log('Input data:', Array.from(testData));

        const processedData = wasmModule.process_data(testData);
        console.log('Processed data:', Array.from(processedData));
        console.log('Cache size after processing:', wasmModule.cache_size);

        // Test 2: Asynchronous data processing
        console.log('\n=== Test 2: Asynchronous Data Processing ===');
        const asyncTestData = new Uint8Array([10, 20, 30, 40, 50]);
        console.log('Input data:', Array.from(asyncTestData));

        try {
            const asyncResult = await wasmModule.process_data_async(asyncTestData);
            console.log('Async processed data:', Array.from(asyncResult));
            console.log('Cache size after async processing:', wasmModule.cache_size);
        } catch (error) {
            console.error('Async processing error:', error);
        }

        // Test 3: Memory usage and cache management
        console.log('\n=== Test 3: Memory Usage and Cache Management ===');
        console.log('Memory usage estimate:', wasm.get_memory_usage(), 'bytes');
        console.log('Current cache size:', wasmModule.cache_size);

        // Process more data to fill cache
        for (let i = 0; i < 5; i++) {
            const data = new Uint8Array(Array.from({length: 10}, (_, idx) => idx + i * 10));
            wasmModule.process_data(data);
        }
        console.log('Cache size after multiple operations:', wasmModule.cache_size);

        // Clear cache
        wasmModule.clear_cache();
        console.log('Cache size after clearing:', wasmModule.cache_size);

        // Test 4: Performance comparison
        console.log('\n=== Test 4: Performance Comparison ===');
        const largeData = new Uint8Array(10000);
        for (let i = 0; i < largeData.length; i++) {
            largeData[i] = i % 256;
        }

        // WASM processing
        const wasmStart = performance.now();
        const wasmResult = wasmModule.process_data(largeData);
        const wasmTime = performance.now() - wasmStart;

        // JavaScript equivalent processing
        const jsStart = performance.now();
        const jsData = Array.from(largeData);
        jsData.reverse();
        for (let i = 0; i < jsData.length; i++) {
            jsData[i] ^= 0xAA;
        }
        const jsTime = performance.now() - jsStart;

        console.log(`WASM processing time: ${wasmTime.toFixed(3)}ms`);
        console.log(`JavaScript processing time: ${jsTime.toFixed(3)}ms`);
        console.log(`Performance ratio: ${(jsTime / wasmTime).toFixed(2)}x`);

        // Test 5: Error handling
        console.log('\n=== Test 5: Error Handling ===');
        try {
            // This should work fine
            const validData = new Uint8Array([1, 2, 3]);
            const result = wasmModule.process_data(validData);
            console.log('Valid processing succeeded:', Array.from(result));
        } catch (error) {
            console.error('Unexpected error:', error.toString());
        }

        console.log('\n✅ All WebAssembly tests completed successfully!');
        console.log('\nModule Statistics:');
        console.log(`- Final cache size: ${wasmModule.cache_size}`);
        console.log(`- Memory usage estimate: ${wasm.get_memory_usage()} bytes`);

    } catch (error) {
        console.error('❌ Error running WebAssembly tests:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the main function
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
