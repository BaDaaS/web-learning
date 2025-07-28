#!/usr/bin/env cargo
/*
[dependencies]
rayon = "1.10"
clap = { version = "4.4", features = ["derive"] }
serde_json = "1.0"
tokio = { version = "1.0", features = ["full"] }
*/

use clap::Parser;
/**
 * WebAssembly Integration Examples
 *
 * This executable demonstrates patterns for integrating Rust with WebAssembly
 * and parallel processing considerations for web deployment.
 *
 * Usage:
 *   cargo run --bin wasm-integration [--json] [--simulate-wasm]
 */
use rayon::prelude::*;
use std::time::Instant;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Output results in JSON format
    #[arg(long)]
    json: bool,

    /// Simulate WebAssembly constraints
    #[arg(long)]
    simulate_wasm: bool,

    /// Number of threads (simulates WASM thread limitations)
    #[arg(short, long, default_value = "4")]
    threads: usize,

    /// Matrix size for operations
    #[arg(long, default_value = "100")]
    matrix_size: usize,
}

fn main() {
    let args = Args::parse();

    // Configure thread pool to simulate WASM constraints
    let num_threads = if args.simulate_wasm {
        std::cmp::min(args.threads, 4) // WASM typically has fewer threads
    } else {
        args.threads
    };

    rayon::ThreadPoolBuilder::new()
        .num_threads(num_threads)
        .thread_name(|i| format!("wasm-sim-{i}"))
        .build_global()
        .expect("Failed to initialize thread pool");

    if args.json {
        run_json_output(&args);
    } else {
        run_interactive_examples(&args);
    }
}

fn run_interactive_examples(args: &Args) {
    println!("🌐 WebAssembly Integration Examples");
    println!(
        "Threads: {} (WASM simulation: {})",
        rayon::current_num_threads(),
        args.simulate_wasm
    );
    println!();

    matrix_operations_example(args.matrix_size);
    image_processing_simulation(args.matrix_size);
    batch_processing_example();
    memory_management_example();

    println!("\n✅ All WebAssembly integration examples completed!");
}

fn run_json_output(args: &Args) {
    let mut results = serde_json::Map::new();

    results.insert("threads".to_string(), rayon::current_num_threads().into());
    results.insert("wasm_simulation".to_string(), args.simulate_wasm.into());
    results.insert(
        "matrix_operations".to_string(),
        run_matrix_operations_json(args.matrix_size),
    );
    results.insert(
        "image_processing".to_string(),
        run_image_processing_json(args.matrix_size),
    );
    results.insert("batch_processing".to_string(), run_batch_processing_json());

    println!("{}", serde_json::to_string_pretty(&results).unwrap());
}

// Matrix operations (common in WebAssembly applications)
fn matrix_operations_example(size: usize) {
    println!("=== Matrix Operations ===");

    // Create test matrices
    let a: Vec<f64> = (0..size * size).map(|i| i as f64).collect();
    let b: Vec<f64> = (0..size * size).map(|i| (i as f64) * 0.5).collect();

    let start = Instant::now();
    let result = parallel_matrix_multiply(&a, size, size, &b, size, size).unwrap();
    let duration = start.elapsed();

    println!("Matrix multiplication {size}x{size} completed in {duration:?}");
    println!("Result checksum: {:.2}", result.iter().sum::<f64>());

    // Matrix transpose
    let start = Instant::now();
    let transposed = parallel_matrix_transpose(&a, size, size);
    let transpose_duration = start.elapsed();

    println!("Matrix transpose completed in {transpose_duration:?}");
    println!("Transpose checksum: {:.2}", transposed.iter().sum::<f64>());
}

fn run_matrix_operations_json(size: usize) -> serde_json::Value {
    let a: Vec<f64> = (0..size * size).map(|i| i as f64).collect();
    let b: Vec<f64> = (0..size * size).map(|i| (i as f64) * 0.5).collect();

    let start = Instant::now();
    let result = parallel_matrix_multiply(&a, size, size, &b, size, size).unwrap();
    let multiply_duration = start.elapsed();

    let start = Instant::now();
    let transposed = parallel_matrix_transpose(&a, size, size);
    let transpose_duration = start.elapsed();

    serde_json::json!({
        "matrix_size": size,
        "multiply_time_ms": multiply_duration.as_millis(),
        "transpose_time_ms": transpose_duration.as_millis(),
        "multiply_checksum": result.iter().sum::<f64>(),
        "transpose_checksum": transposed.iter().sum::<f64>()
    })
}

fn parallel_matrix_multiply(
    a: &[f64],
    a_rows: usize,
    a_cols: usize,
    b: &[f64],
    b_rows: usize,
    b_cols: usize,
) -> Result<Vec<f64>, String> {
    if a_cols != b_rows {
        return Err("Matrix dimensions incompatible for multiplication".to_string());
    }

    if a.len() != a_rows * a_cols || b.len() != b_rows * b_cols {
        return Err("Matrix data length doesn't match dimensions".to_string());
    }

    let mut result = vec![0.0; a_rows * b_cols];

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

    Ok(result)
}

fn parallel_matrix_transpose(matrix: &[f64], rows: usize, cols: usize) -> Vec<f64> {
    let mut result = vec![0.0; rows * cols];

    result
        .par_chunks_mut(rows)
        .enumerate()
        .for_each(|(j, col)| {
            for i in 0..rows {
                col[i] = matrix[i * cols + j];
            }
        });

    result
}

// Image processing simulation (common WebAssembly use case)
fn image_processing_simulation(size: usize) {
    println!("\n=== Image Processing Simulation ===");

    // Simulate RGBA image data
    let image_size = size * size * 4; // RGBA
    let mut image_data: Vec<u8> = (0..image_size).map(|i| (i % 256) as u8).collect();

    let start = Instant::now();
    parallel_grayscale_conversion(&mut image_data);
    let grayscale_duration = start.elapsed();

    println!("Grayscale conversion ({size}x{size}) completed in {grayscale_duration:?}");

    let start = Instant::now();
    parallel_brightness_adjustment(&mut image_data, 1.2);
    let brightness_duration = start.elapsed();

    println!("Brightness adjustment completed in {brightness_duration:?}");
}

fn run_image_processing_json(size: usize) -> serde_json::Value {
    let image_size = size * size * 4;
    let mut image_data: Vec<u8> = (0..image_size).map(|i| (i % 256) as u8).collect();

    let start = Instant::now();
    parallel_grayscale_conversion(&mut image_data);
    let grayscale_duration = start.elapsed();

    let start = Instant::now();
    parallel_brightness_adjustment(&mut image_data, 1.2);
    let brightness_duration = start.elapsed();

    serde_json::json!({
        "image_size": format!("{}x{}", size, size),
        "pixel_count": size * size,
        "grayscale_time_ms": grayscale_duration.as_millis(),
        "brightness_time_ms": brightness_duration.as_millis()
    })
}

fn parallel_grayscale_conversion(rgba_data: &mut [u8]) {
    rgba_data.par_chunks_exact_mut(4).for_each(|pixel| {
        let r = pixel[0] as f32;
        let g = pixel[1] as f32;
        let b = pixel[2] as f32;
        let a = pixel[3];

        // Standard luminance formula
        let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;

        pixel[0] = gray;
        pixel[1] = gray;
        pixel[2] = gray;
        pixel[3] = a; // Keep alpha unchanged
    });
}

fn parallel_brightness_adjustment(rgba_data: &mut [u8], brightness: f32) {
    rgba_data.par_chunks_exact_mut(4).for_each(|pixel| {
        for pixel_val in pixel.iter_mut().take(3) {
            // RGB channels only
            let adjusted = (*pixel_val as f32 * brightness).clamp(0.0, 255.0) as u8;
            *pixel_val = adjusted;
        }
        // Keep alpha unchanged (pixel[3])
    });
}

// Batch processing (memory-efficient operations)
fn batch_processing_example() {
    println!("\n=== Batch Processing ===");

    let operations = vec!["square", "sqrt", "sin", "cos"];
    let batch_size = 10000;

    for operation in operations {
        let data: Vec<f64> = (0..batch_size).map(|i| i as f64 * 0.1).collect();

        let start = Instant::now();
        let result = process_batch_operation(&data, operation);
        let duration = start.elapsed();

        println!("Batch {operation} operation on {batch_size} items completed in {duration:?}");
        println!("Result checksum: {:.2}", result.iter().sum::<f64>());
    }
}

fn run_batch_processing_json() -> serde_json::Value {
    let operations = vec!["square", "sqrt", "sin"];
    let batch_size = 5000;
    let mut results = Vec::new();

    for operation in operations {
        let data: Vec<f64> = (0..batch_size).map(|i| i as f64 * 0.1).collect();

        let start = Instant::now();
        let result = process_batch_operation(&data, operation);
        let duration = start.elapsed();

        results.push(serde_json::json!({
            "operation": operation,
            "batch_size": batch_size,
            "time_ms": duration.as_millis(),
            "checksum": result.iter().sum::<f64>()
        }));
    }

    serde_json::json!(results)
}

fn process_batch_operation(data: &[f64], operation: &str) -> Vec<f64> {
    match operation {
        "square" => data.par_iter().map(|&x| x * x).collect(),
        "sqrt" => data.par_iter().map(|&x| x.sqrt()).collect(),
        "sin" => data.par_iter().map(|&x| x.sin()).collect(),
        "cos" => data.par_iter().map(|&x| x.cos()).collect(),
        _ => data.to_vec(),
    }
}

// Memory management patterns for WebAssembly
fn memory_management_example() {
    println!("\n=== Memory Management ===");

    let buffer_size = 100_000;
    let mut processor = MemoryEfficientProcessor::new(buffer_size);

    // Test with different data sizes
    for size in [1000, 5000, 10000] {
        let data: Vec<f64> = (0..size).map(|i| i as f64 * 0.01).collect();

        let start = Instant::now();
        let result = processor.process_inplace(&data);
        let duration = start.elapsed();

        println!("Memory-efficient processing of {size} items completed in {duration:?}");
        println!("Result checksum: {:.2}", result.iter().sum::<f64>());
    }

    println!("Memory usage stats: allocated buffer size: {buffer_size}");
}

struct MemoryEfficientProcessor {
    buffer: Vec<f64>,
    scratch_space: Vec<f64>,
}

impl MemoryEfficientProcessor {
    fn new(max_size: usize) -> Self {
        Self {
            buffer: Vec::with_capacity(max_size),
            scratch_space: Vec::with_capacity(max_size),
        }
    }

    fn process_inplace(&mut self, data: &[f64]) -> Vec<f64> {
        // Reuse allocated buffers to avoid GC pressure
        self.buffer.clear();
        self.buffer.extend_from_slice(data);

        self.scratch_space.clear();
        self.scratch_space.resize(data.len(), 0.0);

        // Parallel processing with pre-allocated memory
        self.buffer
            .par_chunks_mut(1024) // Process in chunks
            .zip(self.scratch_space.par_chunks_mut(1024))
            .for_each(|(input_chunk, output_chunk)| {
                for (input, output) in input_chunk.iter().zip(output_chunk.iter_mut()) {
                    *output = input.sqrt() * 2.0;
                }
            });

        self.scratch_space.clone()
    }
}
