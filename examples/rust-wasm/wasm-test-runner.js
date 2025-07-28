#!/usr/bin/env node

/**
 * WebAssembly Test Runner
 *
 * This script runs comprehensive tests for the Rust WebAssembly module
 * to ensure all functionality works correctly in the Node.js environment.
 *
 * Usage:
 *   node wasm-test-runner.js
 */

const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');

class WasmTester {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.wasmModule = null;
        this.wasm = null;
    }

    async initialize() {
        // Check if WASM package exists
        const pkgPath = path.join(__dirname, 'pkg');
        if (!fs.existsSync(pkgPath)) {
            throw new Error('WebAssembly package not found! Please run "make build-wasm" first.');
        }

        // Import the generated WASM module
        this.wasm = require('./pkg/web_learning_rust_examples.js');
        this.wasmModule = new this.wasm.WasmModule();

        console.log('🦀 WebAssembly Test Suite Initialized\n');
    }

    test(name, testFn) {
        this.tests.push({ name, fn: testFn });
    }

    async runTests() {
        console.log(`Running ${this.tests.length} tests...\n`);

        for (const { name, fn } of this.tests) {
            try {
                console.log(`▶️  ${name}`);
                await fn();
                console.log(`✅ ${name} - PASSED\n`);
                this.passed++;
            } catch (error) {
                console.error(`❌ ${name} - FAILED`);
                console.error(`   Error: ${error.message}\n`);
                this.failed++;
            }
        }

        this.printSummary();
    }

    printSummary() {
        const total = this.passed + this.failed;
        console.log('='.repeat(50));
        console.log('TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total tests: ${total}`);
        console.log(`Passed: ${this.passed}`);
        console.log(`Failed: ${this.failed}`);
        console.log(`Success rate: ${((this.passed / total) * 100).toFixed(1)}%`);

        if (this.failed === 0) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log('\n💥 Some tests failed!');
            process.exit(1);
        }
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, got ${actual}`);
        }
    }

    assertArrayEqual(actual, expected, message) {
        if (actual.length !== expected.length) {
            throw new Error(message || `Array lengths differ: ${actual.length} vs ${expected.length}`);
        }
        for (let i = 0; i < actual.length; i++) {
            if (actual[i] !== expected[i]) {
                throw new Error(message || `Arrays differ at index ${i}: ${actual[i]} vs ${expected[i]}`);
            }
        }
    }
}

async function main() {
    const tester = new WasmTester();

    try {
        await tester.initialize();

        // Test 1: Module initialization
        tester.test('Module Initialization', () => {
            tester.assert(tester.wasmModule !== null, 'WasmModule should be created');
            tester.assert(typeof tester.wasmModule.process_data === 'function', 'process_data method should exist');
            tester.assert(typeof tester.wasmModule.process_data_async === 'function', 'process_data_async method should exist');
            tester.assert(typeof tester.wasmModule.cache_size === 'number', 'cache_size should be a number');
        });

        // Test 2: Synchronous data processing
        tester.test('Synchronous Data Processing', () => {
            const input = new Uint8Array([1, 2, 3, 4, 5]);
            const result = tester.wasmModule.process_data(input);

            tester.assert(result instanceof Uint8Array, 'Result should be Uint8Array');
            tester.assertEqual(result.length, input.length, 'Result length should match input length');

            // The transformation should reverse and XOR with 0xAA
            const expected = [0xAF, 0xAE, 0xA9, 0xA8, 0xAB]; // [5^0xAA, 4^0xAA, 3^0xAA, 2^0xAA, 1^0xAA]
            tester.assertArrayEqual(Array.from(result), expected, 'Transformation should be correct');
        });

        // Test 3: Asynchronous data processing
        tester.test('Asynchronous Data Processing', async () => {
            const input = new Uint8Array([10, 20, 30]);
            const result = await tester.wasmModule.process_data_async(input);

            tester.assert(result instanceof Uint8Array, 'Async result should be Uint8Array');
            tester.assertEqual(result.length, input.length, 'Async result length should match input length');

            // The async transformation adds index to each byte
            const expected = [10, 21, 32]; // [10+0, 20+1, 30+2]
            tester.assertArrayEqual(Array.from(result), expected, 'Async transformation should be correct');
        });

        // Test 4: Cache functionality
        tester.test('Cache Functionality', () => {
            const initialCacheSize = tester.wasmModule.cache_size;

            // Process some data to populate cache
            const data1 = new Uint8Array([1, 2, 3]);
            tester.wasmModule.process_data(data1);

            const afterProcessCacheSize = tester.wasmModule.cache_size;
            tester.assert(afterProcessCacheSize > initialCacheSize, 'Cache size should increase after processing');

            // Clear cache
            tester.wasmModule.clear_cache();
            const afterClearCacheSize = tester.wasmModule.cache_size;
            tester.assertEqual(afterClearCacheSize, 0, 'Cache size should be 0 after clearing');
        });

        // Test 5: Memory usage function
        tester.test('Memory Usage Function', () => {
            const memUsage = tester.wasm.get_memory_usage();
            tester.assert(typeof memUsage === 'number', 'Memory usage should be a number');
            tester.assert(memUsage > 0, 'Memory usage should be positive');
        });

        // Test 6: Empty data processing
        tester.test('Empty Data Processing', () => {
            const emptyData = new Uint8Array(0);
            const result = tester.wasmModule.process_data(emptyData);

            tester.assert(result instanceof Uint8Array, 'Result should be Uint8Array');
            tester.assertEqual(result.length, 0, 'Empty input should produce empty output');
        });

        // Test 7: Large data processing
        tester.test('Large Data Processing', () => {
            const largeData = new Uint8Array(10000);
            for (let i = 0; i < largeData.length; i++) {
                largeData[i] = i % 256;
            }

            const start = performance.now();
            const result = tester.wasmModule.process_data(largeData);
            const end = performance.now();

            tester.assert(result instanceof Uint8Array, 'Result should be Uint8Array');
            tester.assertEqual(result.length, largeData.length, 'Result length should match input');
            tester.assert(end - start < 1000, 'Large data processing should complete within 1 second');

            console.log(`   Large data processing took ${(end - start).toFixed(3)}ms`);
        });

        // Test 8: Multiple async operations
        tester.test('Multiple Async Operations', async () => {
            const promises = [];

            for (let i = 0; i < 5; i++) {
                const data = new Uint8Array([i, i + 1, i + 2]);
                promises.push(tester.wasmModule.process_data_async(data));
            }

            const results = await Promise.all(promises);

            tester.assertEqual(results.length, 5, 'Should get 5 results');
            results.forEach((result, index) => {
                tester.assert(result instanceof Uint8Array, `Result ${index} should be Uint8Array`);
                tester.assertEqual(result.length, 3, `Result ${index} should have length 3`);
            });
        });

        // Test 9: Performance comparison
        tester.test('Performance Comparison', () => {
            const testData = new Uint8Array(1000);
            for (let i = 0; i < testData.length; i++) {
                testData[i] = i % 256;
            }

            // Measure WASM performance
            const wasmStart = performance.now();
            for (let i = 0; i < 100; i++) {
                tester.wasmModule.process_data(new Uint8Array(testData));
            }
            const wasmTime = performance.now() - wasmStart;

            // Measure JS performance
            const jsStart = performance.now();
            for (let i = 0; i < 100; i++) {
                const jsData = Array.from(testData);
                jsData.reverse();
                for (let j = 0; j < jsData.length; j++) {
                    jsData[j] ^= 0xAA;
                }
            }
            const jsTime = performance.now() - jsStart;

            console.log(`   WASM: ${wasmTime.toFixed(3)}ms, JS: ${jsTime.toFixed(3)}ms`);
            console.log(`   Performance ratio: ${(jsTime / wasmTime).toFixed(2)}x`);

            // Performance should be reasonable (not more than 10x slower than JS)
            tester.assert(wasmTime < jsTime * 10, 'WASM should not be more than 10x slower than JS');
        });

        await tester.runTests();

    } catch (error) {
        console.error('❌ Test suite initialization failed:', error.message);
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