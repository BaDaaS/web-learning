#!/usr/bin/env cargo
/*
[dependencies]
rayon = "1.10"
crossbeam-channel = "0.5"
num_cpus = "1.16"
clap = { version = "4.4", features = ["derive"] }
serde_json = "1.0"
*/

use clap::Parser;
/**
 * Parallel Processing with Rayon Examples
 *
 * This executable demonstrates various Rayon patterns for parallel processing
 * including basic iterators, custom thread pools, and performance optimization.
 *
 * Usage:
 *   cargo run --bin parallel-processing [--json] [--benchmark]
 */
use rayon::prelude::*;
use rayon::ThreadPoolBuilder;
use std::{
    sync::atomic::{AtomicUsize, Ordering},
    time::Instant,
};

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Output results in JSON format
    #[arg(long)]
    json: bool,

    /// Run performance benchmarks
    #[arg(long)]
    benchmark: bool,

    /// Number of threads to use (default: auto-detect)
    #[arg(short, long)]
    threads: Option<usize>,
}

fn main() {
    let args = Args::parse();

    // Configure Rayon globally
    if let Some(threads) = args.threads {
        rayon::ThreadPoolBuilder::new()
            .num_threads(threads)
            .thread_name(|i| format!("rayon-{i}"))
            .build_global()
            .expect("Failed to initialize Rayon thread pool");
    }

    if args.json {
        run_json_output(args.benchmark);
    } else {
        run_interactive_examples(args.benchmark);
    }
}

fn run_interactive_examples(include_benchmark: bool) {
    println!("🦀 Rayon Parallel Processing Examples");
    println!("Available threads: {}", rayon::current_num_threads());
    println!();

    basic_parallel_examples();
    parallel_data_patterns();
    custom_thread_pool_examples();
    advanced_parallel_patterns();
    memory_optimization_examples();

    if include_benchmark {
        benchmark_parallel_performance();
    }

    println!("\n✅ All examples completed successfully!");
}

fn run_json_output(include_benchmark: bool) {
    let mut results = serde_json::Map::new();

    results.insert(
        "available_threads".to_string(),
        rayon::current_num_threads().into(),
    );
    results.insert("basic_examples".to_string(), run_basic_examples_json());
    results.insert("data_patterns".to_string(), run_data_patterns_json());

    if include_benchmark {
        results.insert("benchmarks".to_string(), run_benchmarks_json());
    }

    println!("{}", serde_json::to_string_pretty(&results).unwrap());
}

// Basic parallel iterator examples
fn basic_parallel_examples() {
    println!("=== Basic Parallel Examples ===");

    // Simple parallel sum
    let data: Vec<i32> = (0..1_000_000).collect();
    let start = Instant::now();
    let sequential_sum: i32 = data.iter().sum();
    let sequential_time = start.elapsed();

    let start = Instant::now();
    let parallel_sum: i32 = data.par_iter().sum();
    let parallel_time = start.elapsed();

    println!("Sequential sum: {sequential_sum} (took {sequential_time:?})");
    println!("Parallel sum: {parallel_sum} (took {parallel_time:?})");
    println!(
        "Speedup: {:.2}x",
        sequential_time.as_secs_f64() / parallel_time.as_secs_f64()
    );

    // Parallel map operations - collect first to make it indexed, then take
    let filtered_results: Vec<_> = data
        .par_iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| expensive_computation(x))
        .collect();

    let results: Vec<_> = filtered_results.into_iter().take(100).collect();
    println!("Processed {} even numbers", results.len());
}

fn run_basic_examples_json() -> serde_json::Value {
    let data: Vec<i32> = (0..1_000_000).collect();

    let start = Instant::now();
    let sequential_sum: i32 = data.iter().sum();
    let sequential_time = start.elapsed();

    let start = Instant::now();
    let parallel_sum: i32 = data.par_iter().sum();
    let parallel_time = start.elapsed();

    serde_json::json!({
        "sequential_sum": sequential_sum,
        "parallel_sum": parallel_sum,
        "sequential_time_ms": sequential_time.as_millis(),
        "parallel_time_ms": parallel_time.as_millis(),
        "speedup": sequential_time.as_secs_f64() / parallel_time.as_secs_f64()
    })
}

// Simulate expensive computation
fn expensive_computation(x: i32) -> i32 {
    (0..1000).fold(x, |acc, i| acc.wrapping_add(i * x))
}

// Parallel data processing patterns
fn parallel_data_patterns() {
    println!("\n=== Parallel Data Patterns ===");

    // Parallel word count
    // Create base texts and repeat manually (String doesn't implement Copy)
    let base_texts = vec![
        "The quick brown fox jumps over the lazy dog".to_string(),
        "Lorem ipsum dolor sit amet consectetur adipiscing elit".to_string(),
        "Rust is a systems programming language focused on safety".to_string(),
        "Rayon provides data parallelism with work stealing".to_string(),
    ];
    let mut texts = Vec::with_capacity(base_texts.len() * 1000);
    for _ in 0..1000 {
        for text in &base_texts {
            texts.push(text.clone());
        }
    }

    let word_count = parallel_word_count(&texts);
    println!("Total word count: {word_count}");

    // Parallel search for maximum
    let data: Vec<f64> = (0..100_000).map(|i| (i as f64).sin()).collect();
    if let Some(max_val) = parallel_find_max(&data) {
        println!("Maximum value found: {max_val:.6}");
    }

    // Parallel variance calculation
    let variance = parallel_variance(&data);
    println!("Variance: {variance:.6}");
}

fn run_data_patterns_json() -> serde_json::Value {
    // Create base texts and repeat manually (String doesn't implement Copy)
    let base_texts = vec![
        "The quick brown fox jumps over the lazy dog".to_string(),
        "Lorem ipsum dolor sit amet consectetur adipiscing elit".to_string(),
        "Rust is a systems programming language focused on safety".to_string(),
        "Rayon provides data parallelism with work stealing".to_string(),
    ];
    let mut texts = Vec::with_capacity(base_texts.len() * 100);
    for _ in 0..100 {
        for text in &base_texts {
            texts.push(text.clone());
        }
    }

    let word_count = parallel_word_count(&texts);
    let data: Vec<f64> = (0..10_000).map(|i| (i as f64).sin()).collect();
    let max_val = parallel_find_max(&data);
    let variance = parallel_variance(&data);

    serde_json::json!({
        "word_count": word_count,
        "max_value": max_val,
        "variance": variance
    })
}

fn parallel_word_count(texts: &[String]) -> usize {
    texts
        .par_iter()
        .map(|text| text.split_whitespace().count())
        .sum()
}

fn parallel_find_max(data: &[f64]) -> Option<f64> {
    data.par_iter()
        .copied()
        .max_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
}

fn parallel_variance(data: &[f64]) -> f64 {
    let len = data.len() as f64;
    let mean = data.par_iter().sum::<f64>() / len;

    let variance = data.par_iter().map(|&x| (x - mean).powi(2)).sum::<f64>() / len;

    variance
}

// Custom thread pool examples
fn custom_thread_pool_examples() {
    println!("\n=== Custom Thread Pool Examples ===");

    // Create specialized thread pools for different workloads
    let cpu_pool = ThreadPoolBuilder::new()
        .num_threads(4)
        .thread_name(|i| format!("cpu-worker-{i}"))
        .build()
        .expect("Failed to create CPU pool");

    let io_pool = ThreadPoolBuilder::new()
        .num_threads(8)
        .thread_name(|i| format!("io-worker-{i}"))
        .build()
        .expect("Failed to create I/O pool");

    // CPU-intensive work
    let data: Vec<i32> = (0..10_000).collect();
    let cpu_result = cpu_pool.install(|| {
        data.par_iter()
            .map(|&x| expensive_computation(x))
            .sum::<i32>()
    });
    println!("CPU pool result: {cpu_result}");

    // Simulated I/O work (in real code, this would be actual I/O)
    let urls: Vec<String> = (0..100)
        .map(|i| format!("https://api.example.com/data/{i}"))
        .collect();

    let io_results = io_pool.install(|| {
        urls.par_iter()
            .map(|url| simulate_network_request(url))
            .collect::<Vec<_>>()
    });
    let len = io_results.len();
    println!("Processed {len} network requests");
}

fn simulate_network_request(url: &str) -> String {
    // Simulate network delay
    std::thread::sleep(std::time::Duration::from_millis(1));
    format!("Response from {url}")
}

// Advanced parallel patterns
fn advanced_parallel_patterns() {
    println!("\n=== Advanced Parallel Patterns ===");

    // Uneven workload distribution with progress tracking
    let tasks: Vec<usize> = vec![100, 500, 1000, 50, 2000, 300, 750, 1200];
    let results = parallel_uneven_work(tasks);
    let len = results.len();
    println!("Completed {len} tasks with varying workloads");

    // Parallel quicksort demonstration
    let mut data: Vec<i32> = (0..10_000).rev().collect(); // Reverse sorted for worst case
    let start = Instant::now();
    parallel_quicksort(&mut data);
    let sort_time = start.elapsed();

    let is_sorted = data.windows(2).all(|w| w[0] <= w[1]);
    println!("Parallel quicksort completed in {sort_time:?}, sorted: {is_sorted}");
}

fn parallel_uneven_work(tasks: Vec<usize>) -> Vec<usize> {
    let completed_count = AtomicUsize::new(0);

    let results: Vec<_> = tasks
        .par_iter()
        .map(|&task_size| {
            // Simulate variable work amounts
            let result = (0..task_size).fold(0usize, |acc, i| acc.wrapping_add(i));

            let count = completed_count.fetch_add(1, Ordering::Relaxed);
            if count % 100 == 0 {
                println!("Completed task {} (size: {})", count + 1, task_size);
            }

            result
        })
        .collect();

    results
}

fn parallel_quicksort<T: Ord + Send>(data: &mut [T]) {
    const SEQUENTIAL_THRESHOLD: usize = 1000;

    if data.len() <= SEQUENTIAL_THRESHOLD {
        data.sort_unstable();
        return;
    }

    if data.len() <= 1 {
        return;
    }

    let pivot_index = partition(data);
    let (left, right) = data.split_at_mut(pivot_index);

    // Use rayon::join for parallel divide-and-conquer
    rayon::join(
        || parallel_quicksort(left),
        || parallel_quicksort(&mut right[1..]),
    );
}

fn partition<T: Ord>(data: &mut [T]) -> usize {
    let len = data.len();
    let pivot_index = len / 2;
    data.swap(pivot_index, len - 1);

    let mut store_index = 0;
    for i in 0..len - 1 {
        if data[i] <= data[len - 1] {
            data.swap(i, store_index);
            store_index += 1;
        }
    }
    data.swap(store_index, len - 1);
    store_index
}

// Memory optimization examples
fn memory_optimization_examples() {
    println!("\n=== Memory Optimization Examples ===");

    // Cache-friendly matrix processing
    let matrix: Vec<Vec<i32>> = (0..1000)
        .map(|i| (0..1000).map(|j| i * j).collect())
        .collect();

    let sum = cache_friendly_sum(&matrix);
    println!("Matrix sum (cache-friendly): {sum}");

    // NUMA-aware processing
    let data: Vec<f64> = (0..100_000).map(|i| i as f64 * 0.1).collect();
    let results = numa_aware_processing(&data);
    println!("NUMA-aware processing completed {} items", results.len());

    // False sharing avoidance
    let large_data: Vec<i32> = (0..1_000_000).collect();
    let sum_no_sharing = avoid_false_sharing(&large_data);
    println!("Sum without false sharing: {sum_no_sharing}");
}

fn cache_friendly_sum(matrix: &[Vec<i32>]) -> i32 {
    // Row-major access (cache-friendly)
    matrix.par_iter().map(|row| row.iter().sum::<i32>()).sum()
}

fn numa_aware_processing(data: &[f64]) -> Vec<f64> {
    let chunk_size = std::cmp::max(1, data.len() / rayon::current_num_threads());

    data.par_chunks(chunk_size)
        .flat_map(|chunk| {
            // Process each chunk on the same NUMA node
            chunk.par_iter().map(|&x| expensive_math_operation(x))
        })
        .collect()
}

fn expensive_math_operation(x: f64) -> f64 {
    // Simulate expensive floating-point operations
    (x.sin() + x.cos()).sqrt().ln_1p()
}

// Padding to avoid false sharing
#[repr(align(64))]
struct PaddedCounter {
    value: AtomicUsize,
}

fn avoid_false_sharing(data: &[i32]) -> u64 {
    let num_threads = rayon::current_num_threads();
    let counters: Vec<PaddedCounter> = (0..num_threads)
        .map(|_| PaddedCounter {
            value: AtomicUsize::new(0),
        })
        .collect();

    let chunk_size = std::cmp::max(1, data.len() / num_threads);

    data.par_chunks(chunk_size)
        .enumerate()
        .for_each(|(thread_id, chunk)| {
            let local_sum: u64 = chunk.iter().map(|&x| x as u64).sum();
            counters[thread_id % num_threads]
                .value
                .store(local_sum as usize, Ordering::Relaxed);
        });

    counters
        .iter()
        .map(|counter| counter.value.load(Ordering::Relaxed) as u64)
        .sum()
}

// Performance benchmarking
fn benchmark_parallel_performance() {
    println!("\n=== Performance Benchmarks ===");

    let sizes = vec![1_000, 10_000, 100_000, 1_000_000];

    for size in sizes {
        let data: Vec<i32> = (0..size).collect();

        // Sequential benchmark
        let start = Instant::now();
        let seq_result: i64 = data.iter().map(|&x| x as i64 * x as i64).sum();
        let seq_time = start.elapsed();

        // Parallel benchmark
        let start = Instant::now();
        let _par_result: i64 = data.par_iter().map(|&x| x as i64 * x as i64).sum();
        let par_time = start.elapsed();

        assert_eq!(seq_result, _par_result);

        let speedup = seq_time.as_secs_f64() / par_time.as_secs_f64();
        println!(
            "Size: {:>8} | Sequential: {:>8.2}ms | Parallel: {:>8.2}ms | Speedup: {:.2}x",
            size,
            seq_time.as_secs_f64() * 1000.0,
            par_time.as_secs_f64() * 1000.0,
            speedup
        );
    }
}

fn run_benchmarks_json() -> serde_json::Value {
    let sizes = vec![1_000, 10_000, 100_000];
    let mut benchmarks = Vec::new();

    for size in sizes {
        let data: Vec<i32> = (0..size).collect();

        let start = Instant::now();
        let seq_result: i64 = data.iter().map(|&x| x as i64 * x as i64).sum();
        let seq_time = start.elapsed();

        let start = Instant::now();
        let _par_result: i64 = data.par_iter().map(|&x| x as i64 * x as i64).sum();
        let par_time = start.elapsed();

        benchmarks.push(serde_json::json!({
            "size": size,
            "sequential_time_ms": seq_time.as_millis(),
            "parallel_time_ms": par_time.as_millis(),
            "speedup": seq_time.as_secs_f64() / par_time.as_secs_f64(),
            "result": seq_result
        }));
    }

    serde_json::json!(benchmarks)
}
