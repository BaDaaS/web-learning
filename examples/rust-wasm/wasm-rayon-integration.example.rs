/**
 * WebAssembly + Rayon Integration Examples
 *
 * This example demonstrates how to integrate Rayon parallel processing
 * with WebAssembly for high-performance web applications.
 */

use wasm_bindgen::prelude::*;
use rayon::prelude::*;
use std::sync::Once;

// Ensure we only initialize once
static INIT: Once = Once::new();

// Initialize the WebAssembly module with Rayon support
#[wasm_bindgen(start)]
pub fn main() {
    INIT.call_once(|| {
        // Set up panic hook for better debugging
        #[cfg(feature = "console_error_panic_hook")]
        console_error_panic_hook::set_once();

        // Enable logging
        #[cfg(feature = "wee_alloc")]
        {
            extern crate wee_alloc;
            #[global_allocator]
            static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
        }
    });
}

// Basic parallel processor for WebAssembly
#[wasm_bindgen]
pub struct WasmParallelProcessor {
    thread_pool: Option<rayon::ThreadPool>,
    initialized: bool,
}

#[wasm_bindgen]
impl WasmParallelProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(num_threads: Option<usize>) -> Result<WasmParallelProcessor, JsValue> {
        let num_threads = num_threads.unwrap_or_else(|| {
            // Default to available parallelism, but cap it for web environment
            std::cmp::min(navigator_hardware_concurrency(), 8)
        });

        // Build thread pool with specified number of threads
        let thread_pool = rayon::ThreadPoolBuilder::new()
            .num_threads(num_threads)
            .thread_name(|i| format!("wasm-rayon-{}", i))
            .build()
            .map_err(|e| JsValue::from_str(&format!("Failed to create thread pool: {}", e)))?;

        Ok(WasmParallelProcessor {
            thread_pool: Some(thread_pool),
            initialized: true,
        })
    }

    // Get the number of threads in the pool
    #[wasm_bindgen]
    pub fn num_threads(&self) -> usize {
        if let Some(ref pool) = self.thread_pool {
            pool.current_num_threads()
        } else {
            1
        }
    }

    // Basic parallel sum operation
    #[wasm_bindgen]
    pub fn parallel_sum(&self, data: &[i32]) -> Result<i32, JsValue> {
        if !self.initialized {
            return Err(JsValue::from_str("Processor not initialized"));
        }

        if let Some(ref pool) = self.thread_pool {
            Ok(pool.install(|| data.par_iter().sum()))
        } else {
            Ok(data.iter().sum())
        }
    }

    // Parallel map operation
    #[wasm_bindgen]
    pub fn parallel_map_square(&self, data: &[i32]) -> Result<Vec<i32>, JsValue> {
        if !self.initialized {
            return Err(JsValue::from_str("Processor not initialized"));
        }

        if let Some(ref pool) = self.thread_pool {
            Ok(pool.install(|| data.par_iter().map(|&x| x * x).collect()))
        } else {
            Ok(data.iter().map(|&x| x * x).collect())
        }
    }

    // More complex parallel operation: filter and transform
    #[wasm_bindgen]
    pub fn parallel_filter_transform(&self, data: &[i32], threshold: i32) -> Result<Vec<i32>, JsValue> {
        if !self.initialized {
            return Err(JsValue::from_str("Processor not initialized"));
        }

        if let Some(ref pool) = self.thread_pool {
            Ok(pool.install(|| {
                data.par_iter()
                    .filter(|&&x| x > threshold)
                    .map(|&x| x * 2 + 1)
                    .collect()
            }))
        } else {
            Ok(data.iter()
                .filter(|&&x| x > threshold)
                .map(|&x| x * 2 + 1)
                .collect())
        }
    }

    // Parallel reduction with custom operation
    #[wasm_bindgen]
    pub fn parallel_reduce(&self, data: &[f64]) -> Result<f64, JsValue> {
        if !self.initialized {
            return Err(JsValue::from_str("Processor not initialized"));
        }

        if data.is_empty() {
            return Ok(0.0);
        }

        if let Some(ref pool) = self.thread_pool {
            Ok(pool.install(|| {
                data.par_iter()
                    .map(|&x| x * x) // Square each element
                    .reduce(|| 0.0, |a, b| a + b) // Sum the squares
                    .sqrt() // Take square root (Euclidean norm)
            }))
        } else {
            let sum_of_squares: f64 = data.iter().map(|&x| x * x).sum();
            Ok(sum_of_squares.sqrt())
        }
    }
}

// High-performance matrix operations for WebAssembly
#[wasm_bindgen]
pub struct WasmMatrixProcessor {
    thread_pool: Option<rayon::ThreadPool>,
}

#[wasm_bindgen]
impl WasmMatrixProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<WasmMatrixProcessor, JsValue> {
        let thread_pool = rayon::ThreadPoolBuilder::new()
            .num_threads(std::cmp::min(navigator_hardware_concurrency(), 4))
            .build()
            .map_err(|e| JsValue::from_str(&format!("Failed to create matrix processor: {}", e)))?;

        Ok(WasmMatrixProcessor {
            thread_pool: Some(thread_pool),
        })
    }

    // Parallel matrix multiplication
    #[wasm_bindgen]
    pub fn multiply_matrices(
        &self,
        a: &[f64], a_rows: usize, a_cols: usize,
        b: &[f64], b_rows: usize, b_cols: usize,
    ) -> Result<Vec<f64>, JsValue> {
        if a_cols != b_rows {
            return Err(JsValue::from_str("Matrix dimensions incompatible for multiplication"));
        }

        if a.len() != a_rows * a_cols || b.len() != b_rows * b_cols {
            return Err(JsValue::from_str("Matrix data length doesn't match dimensions"));
        }

        let mut result = vec![0.0; a_rows * b_cols];

        if let Some(ref pool) = self.thread_pool {
            pool.install(|| {
                result
                    .par_chunks_mut(b_cols)
                    .enumerate()
                    .for_each(|(i, row)| {
                        for j in 0..b_cols {
                            let mut sum = 0.0;
                            for k in 0..a_cols {
                                sum += a[i * a_cols + k] * b[k * b_cols + j];
                            }
                            row[j] = sum;
                        }
                    });
            });
        } else {
            // Fallback to sequential multiplication
            for i in 0..a_rows {
                for j in 0..b_cols {
                    let mut sum = 0.0;
                    for k in 0..a_cols {
                        sum += a[i * a_cols + k] * b[k * b_cols + j];
                    }
                    result[i * b_cols + j] = sum;
                }
            }
        }

        Ok(result)
    }

    // Parallel matrix transpose
    #[wasm_bindgen]
    pub fn transpose_matrix(
        &self,
        matrix: &[f64],
        rows: usize,
        cols: usize,
    ) -> Result<Vec<f64>, JsValue> {
        if matrix.len() != rows * cols {
            return Err(JsValue::from_str("Matrix data length doesn't match dimensions"));
        }

        let mut result = vec![0.0; rows * cols];

        if let Some(ref pool) = self.thread_pool {
            pool.install(|| {
                result
                    .par_chunks_mut(rows)
                    .enumerate()
                    .for_each(|(j, col)| {
                        for i in 0..rows {
                            col[i] = matrix[i * cols + j];
                        }
                    });
            });
        } else {
            for i in 0..rows {
                for j in 0..cols {
                    result[j * rows + i] = matrix[i * cols + j];
                }
            }
        }

        Ok(result)
    }
}

// Image processing with parallel operations
#[wasm_bindgen]
pub struct WasmImageProcessor {
    thread_pool: Option<rayon::ThreadPool>,
    buffer: Vec<u8>,
}

#[wasm_bindgen]
impl WasmImageProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(max_image_size: usize) -> Result<WasmImageProcessor, JsValue> {
        let thread_pool = rayon::ThreadPoolBuilder::new()
            .num_threads(std::cmp::min(navigator_hardware_concurrency(), 6))
            .build()
            .map_err(|e| JsValue::from_str(&format!("Failed to create image processor: {}", e)))?;

        Ok(WasmImageProcessor {
            thread_pool: Some(thread_pool),
            buffer: Vec::with_capacity(max_image_size * 4), // RGBA
        })
    }

    // Parallel grayscale conversion
    #[wasm_bindgen]
    pub fn to_grayscale(&mut self, rgba_data: &[u8]) -> Result<Vec<u8>, JsValue> {
        if rgba_data.len() % 4 != 0 {
            return Err(JsValue::from_str("RGBA data length must be divisible by 4"));
        }

        let pixel_count = rgba_data.len() / 4;
        self.buffer.clear();
        self.buffer.resize(rgba_data.len(), 0);

        if let Some(ref pool) = self.thread_pool {
            pool.install(|| {
                rgba_data
                    .par_chunks_exact(4)
                    .zip(self.buffer.par_chunks_exact_mut(4))
                    .for_each(|(src_pixel, dst_pixel)| {
                        let r = src_pixel[0] as f32;
                        let g = src_pixel[1] as f32;
                        let b = src_pixel[2] as f32;
                        let a = src_pixel[3];

                        // Standard luminance formula
                        let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;

                        dst_pixel[0] = gray;
                        dst_pixel[1] = gray;
                        dst_pixel[2] = gray;
                        dst_pixel[3] = a;
                    });
            });
        } else {
            for i in 0..pixel_count {
                let base = i * 4;
                let r = rgba_data[base] as f32;
                let g = rgba_data[base + 1] as f32;
                let b = rgba_data[base + 2] as f32;
                let a = rgba_data[base + 3];

                let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;

                self.buffer[base] = gray;
                self.buffer[base + 1] = gray;
                self.buffer[base + 2] = gray;
                self.buffer[base + 3] = a;
            }
        }

        Ok(self.buffer.clone())
    }

    // Parallel brightness adjustment
    #[wasm_bindgen]
    pub fn adjust_brightness(&mut self, rgba_data: &[u8], brightness: f32) -> Result<Vec<u8>, JsValue> {
        if rgba_data.len() % 4 != 0 {
            return Err(JsValue::from_str("RGBA data length must be divisible by 4"));
        }

        self.buffer.clear();
        self.buffer.resize(rgba_data.len(), 0);

        if let Some(ref pool) = self.thread_pool {
            pool.install(|| {
                rgba_data
                    .par_chunks_exact(4)
                    .zip(self.buffer.par_chunks_exact_mut(4))
                    .for_each(|(src_pixel, dst_pixel)| {
                        for i in 0..3 { // RGB channels only
                            let adjusted = (src_pixel[i] as f32 * brightness).min(255.0).max(0.0) as u8;
                            dst_pixel[i] = adjusted;
                        }
                        dst_pixel[3] = src_pixel[3]; // Keep alpha unchanged
                    });
            });
        } else {
            for chunk in rgba_data.chunks_exact(4).zip(self.buffer.chunks_exact_mut(4)) {
                let (src_pixel, dst_pixel) = chunk;
                for i in 0..3 {
                    let adjusted = (src_pixel[i] as f32 * brightness).min(255.0).max(0.0) as u8;
                    dst_pixel[i] = adjusted;
                }
                dst_pixel[3] = src_pixel[3];
            }
        }

        Ok(self.buffer.clone())
    }
}

// Memory-efficient batch processor
#[wasm_bindgen]
pub struct WasmBatchProcessor {
    thread_pool: Option<rayon::ThreadPool>,
    input_buffer: Vec<f64>,
    output_buffer: Vec<f64>,
}

#[wasm_bindgen]
impl WasmBatchProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(batch_size: usize) -> Result<WasmBatchProcessor, JsValue> {
        let thread_pool = rayon::ThreadPoolBuilder::new()
            .num_threads(std::cmp::min(navigator_hardware_concurrency(), 4))
            .build()
            .map_err(|e| JsValue::from_str(&format!("Failed to create batch processor: {}", e)))?;

        Ok(WasmBatchProcessor {
            thread_pool: Some(thread_pool),
            input_buffer: Vec::with_capacity(batch_size),
            output_buffer: Vec::with_capacity(batch_size),
        })
    }

    // Process batch with minimal allocations
    #[wasm_bindgen]
    pub fn process_batch(&mut self, data: &[f64], operation: &str) -> Result<Vec<f64>, JsValue> {
        // Reuse buffers to avoid allocations
        self.input_buffer.clear();
        self.input_buffer.extend_from_slice(data);

        self.output_buffer.clear();
        self.output_buffer.resize(data.len(), 0.0);

        if let Some(ref pool) = self.thread_pool {
            pool.install(|| {
                match operation {
                    "square" => {
                        self.input_buffer
                            .par_iter()
                            .zip(self.output_buffer.par_iter_mut())
                            .for_each(|(&input, output)| {
                                *output = input * input;
                            });
                    }
                    "sqrt" => {
                        self.input_buffer
                            .par_iter()
                            .zip(self.output_buffer.par_iter_mut())
                            .for_each(|(&input, output)| {
                                *output = input.sqrt();
                            });
                    }
                    "sin" => {
                        self.input_buffer
                            .par_iter()
                            .zip(self.output_buffer.par_iter_mut())
                            .for_each(|(&input, output)| {
                                *output = input.sin();
                            });
                    }
                    _ => {
                        return Err(JsValue::from_str("Unknown operation"));
                    }
                }
                Ok(())
            })?;
        } else {
            // Sequential fallback
            for (input, output) in self.input_buffer.iter().zip(self.output_buffer.iter_mut()) {
                *output = match operation {
                    "square" => input * input,
                    "sqrt" => input.sqrt(),
                    "sin" => input.sin(),
                    _ => return Err(JsValue::from_str("Unknown operation")),
                };
            }
        }

        Ok(self.output_buffer.clone())
    }
}

// Utility functions
fn navigator_hardware_concurrency() -> usize {
    // In a real WASM environment, this would query navigator.hardwareConcurrency
    // For now, return a reasonable default
    std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(4)
}

// Performance testing utilities
#[wasm_bindgen]
pub fn benchmark_parallel_vs_sequential(size: usize, num_iterations: usize) -> Result<String, JsValue> {
    let data: Vec<i32> = (0..size as i32).collect();
    
    // Sequential timing
    let start = instant::Instant::now();
    for _ in 0..num_iterations {
        let _: i64 = data.iter().map(|&x| x as i64 * x as i64).sum();
    }
    let sequential_time = start.elapsed();

    // Parallel timing
    let start = instant::Instant::now();
    for _ in 0..num_iterations {
        let _: i64 = data.par_iter().map(|&x| x as i64 * x as i64).sum();
    }
    let parallel_time = start.elapsed();

    let speedup = sequential_time.as_secs_f64() / parallel_time.as_secs_f64();
    
    Ok(format!(
        "Size: {}, Iterations: {}, Sequential: {:.2}ms, Parallel: {:.2}ms, Speedup: {:.2}x",
        size,
        num_iterations,
        sequential_time.as_secs_f64() * 1000.0,
        parallel_time.as_secs_f64() * 1000.0,
        speedup
    ))
}

// Export configuration for easier JavaScript integration
#[wasm_bindgen]
pub fn get_optimal_thread_count() -> usize {
    std::cmp::min(navigator_hardware_concurrency(), 8)
}

#[wasm_bindgen]
pub fn is_rayon_available() -> bool {
    true
}

// Example usage from JavaScript:
/*
import init, { 
    WasmParallelProcessor, 
    WasmMatrixProcessor, 
    WasmImageProcessor,
    benchmark_parallel_vs_sequential,
    get_optimal_thread_count 
} from './pkg/wasm_rayon_integration.js';

async function main() {
    await init();
    
    const optimalThreads = get_optimal_thread_count();
    const processor = new WasmParallelProcessor(optimalThreads);
    
    const data = new Int32Array([1, 2, 3, 4, 5]);
    const sum = processor.parallel_sum(data);
    console.log('Parallel sum:', sum);
    
    const squared = processor.parallel_map_square(data);
    console.log('Parallel squared:', squared);
    
    // Benchmark
    const benchmark = benchmark_parallel_vs_sequential(100000, 10);
    console.log(benchmark);
}

main().catch(console.error);
*/