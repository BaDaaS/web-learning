/**
 * Parallel Processing with Rayon Examples
 *
 * This example demonstrates various Rayon patterns for parallel processing
 * including basic iterators, custom thread pools, and performance optimization.
 */

use rayon::prelude::*;
use rayon::{ThreadPool, ThreadPoolBuilder};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Instant;

// Basic parallel iterator examples
pub fn basic_parallel_examples() {
    println!("=== Basic Parallel Examples ===");

    // Simple parallel sum
    let data: Vec<i32> = (0..1_000_000).collect();
    let start = Instant::now();
    let sequential_sum: i32 = data.iter().sum();
    let sequential_time = start.elapsed();

    let start = Instant::now();
    let parallel_sum: i32 = data.par_iter().sum();
    let parallel_time = start.elapsed();

    println!("Sequential sum: {} (took {:?})", sequential_sum, sequential_time);
    println!("Parallel sum: {} (took {:?})", parallel_sum, parallel_time);
    println!("Speedup: {:.2}x", sequential_time.as_secs_f64() / parallel_time.as_secs_f64());

    // Parallel map operations
    let results: Vec<_> = data
        .par_iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| expensive_computation(x))
        .take(100) // Limit results for demo
        .collect();

    println!("Processed {} even numbers", results.len());
}

// Simulate expensive computation
fn expensive_computation(x: i32) -> i32 {
    (0..1000).fold(x, |acc, i| acc.wrapping_add(i * x))
}

// Parallel data processing patterns
pub fn parallel_data_patterns() {
    println!("\n=== Parallel Data Patterns ===");

    // Parallel word count
    let texts = vec![
        "The quick brown fox jumps over the lazy dog".to_string(),
        "Lorem ipsum dolor sit amet consectetur adipiscing elit".to_string(),
        "Rust is a systems programming language focused on safety".to_string(),
        "Rayon provides data parallelism with work stealing".to_string(),
    ].repeat(1000); // Repeat for meaningful work

    let word_count = parallel_word_count(&texts);
    println!("Total word count: {}", word_count);

    // Parallel search for maximum
    let data: Vec<f64> = (0..100_000).map(|i| (i as f64).sin()).collect();
    if let Some(max_val) = parallel_find_max(&data) {
        println!("Maximum value found: {:.6}", max_val);
    }

    // Parallel variance calculation
    let variance = parallel_variance(&data);
    println!("Variance: {:.6}", variance);
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
    
    let variance = data
        .par_iter()
        .map(|&x| (x - mean).powi(2))
        .sum::<f64>() / len;
        
    variance
}

// Custom thread pool examples
pub fn custom_thread_pool_examples() {
    println!("\n=== Custom Thread Pool Examples ===");

    // Create specialized thread pools for different workloads
    let cpu_pool = ThreadPoolBuilder::new()
        .num_threads(4)
        .thread_name(|i| format!("cpu-worker-{}", i))
        .build()
        .expect("Failed to create CPU pool");

    let io_pool = ThreadPoolBuilder::new()
        .num_threads(8)
        .thread_name(|i| format!("io-worker-{}", i))
        .build()
        .expect("Failed to create I/O pool");

    // CPU-intensive work
    let data: Vec<i32> = (0..10_000).collect();
    let cpu_result = cpu_pool.install(|| {
        data.par_iter()
            .map(|&x| expensive_computation(x))
            .sum::<i32>()
    });
    println!("CPU pool result: {}", cpu_result);

    // Simulated I/O work (in real code, this would be actual I/O)
    let urls: Vec<String> = (0..100)
        .map(|i| format!("https://api.example.com/data/{}", i))
        .collect();

    let io_results = io_pool.install(|| {
        urls.par_iter()
            .map(|url| simulate_network_request(url))
            .collect::<Vec<_>>()
    });
    println!("Processed {} network requests", io_results.len());
}

fn simulate_network_request(url: &str) -> String {
    // Simulate network delay
    std::thread::sleep(std::time::Duration::from_millis(1));
    format!("Response from {}", url)
}

// Advanced parallel patterns
pub fn advanced_parallel_patterns() {
    println!("\n=== Advanced Parallel Patterns ===");

    // Uneven workload distribution with progress tracking
    let tasks: Vec<usize> = vec![100, 500, 1000, 50, 2000, 300, 750, 1200];
    let results = parallel_uneven_work(tasks);
    println!("Completed {} tasks with varying workloads", results.len());

    // Parallel quicksort demonstration
    let mut data: Vec<i32> = (0..10_000).rev().collect(); // Reverse sorted for worst case
    let start = Instant::now();
    parallel_quicksort(&mut data);
    let sort_time = start.elapsed();
    
    let is_sorted = data.windows(2).all(|w| w[0] <= w[1]);
    println!("Parallel quicksort completed in {:?}, sorted: {}", sort_time, is_sorted);
}

fn parallel_uneven_work(tasks: Vec<usize>) -> Vec<usize> {
    let completed_count = AtomicUsize::new(0);
    
    let results: Vec<_> = tasks
        .par_iter()
        .map(|&task_size| {
            // Simulate variable work amounts
            let result = (0..task_size).fold(0, |acc, i| acc.wrapping_add(i));
            
            let count = completed_count.fetch_add(1, Ordering::Relaxed);
            println!("Completed task {} (size: {})", count + 1, task_size);
            
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
        || parallel_quicksort(&mut right[1..])
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
pub fn memory_optimization_examples() {
    println!("\n=== Memory Optimization Examples ===");

    // Cache-friendly matrix processing
    let matrix: Vec<Vec<i32>> = (0..1000)
        .map(|i| (0..1000).map(|j| i * j).collect())
        .collect();

    let sum = cache_friendly_sum(&matrix);
    println!("Matrix sum (cache-friendly): {}", sum);

    // NUMA-aware processing
    let data: Vec<f64> = (0..100_000).map(|i| i as f64 * 0.1).collect();
    let results = numa_aware_processing(&data);
    println!("NUMA-aware processing completed {} items", results.len());

    // False sharing avoidance
    let large_data: Vec<i32> = (0..1_000_000).collect();
    let sum_no_sharing = avoid_false_sharing(&large_data);
    println!("Sum without false sharing: {}", sum_no_sharing);
}

fn cache_friendly_sum(matrix: &[Vec<i32>]) -> i32 {
    // Row-major access (cache-friendly)
    matrix
        .par_iter()
        .map(|row| row.iter().sum::<i32>())
        .sum()
}

fn numa_aware_processing(data: &[f64]) -> Vec<f64> {
    let chunk_size = std::cmp::max(1, data.len() / rayon::current_num_threads());
    
    data.par_chunks(chunk_size)
        .flat_map(|chunk| {
            // Process each chunk on the same NUMA node
            chunk.iter().map(|&x| expensive_math_operation(x))
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
            counters[thread_id % num_threads].value.store(local_sum as usize, Ordering::Relaxed);
        });
    
    counters
        .iter()
        .map(|counter| counter.value.load(Ordering::Relaxed) as u64)
        .sum()
}

// Performance benchmarking
pub fn benchmark_parallel_performance() {
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
        let par_result: i64 = data.par_iter().map(|&x| x as i64 * x as i64).sum();
        let par_time = start.elapsed();
        
        assert_eq!(seq_result, par_result);
        
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

// Main function to run all examples
#[cfg(not(target_arch = "wasm32"))]
pub fn run_all_examples() {
    // Configure Rayon globally
    rayon::ThreadPoolBuilder::new()
        .num_threads(num_cpus::get())
        .thread_name(|i| format!("rayon-{}", i))
        .build_global()
        .expect("Failed to initialize Rayon thread pool");

    println!("Running Rayon parallel processing examples...");
    println!("Available threads: {}", rayon::current_num_threads());

    basic_parallel_examples();
    parallel_data_patterns();
    custom_thread_pool_examples();
    advanced_parallel_patterns();
    memory_optimization_examples();
    benchmark_parallel_performance();

    println!("\nAll examples completed successfully!");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parallel_word_count() {
        let texts = vec![
            "hello world".to_string(),
            "rust is great".to_string(),
            "rayon parallel".to_string(),
        ];
        assert_eq!(parallel_word_count(&texts), 7);
    }

    #[test]
    fn test_parallel_find_max() {
        let data = vec![1.0, 5.0, 3.0, 9.0, 2.0];
        assert_eq!(parallel_find_max(&data), Some(9.0));
    }

    #[test]
    fn test_parallel_quicksort() {
        let mut data = vec![64, 34, 25, 12, 22, 11, 90];
        parallel_quicksort(&mut data);
        assert_eq!(data, vec![11, 12, 22, 25, 34, 64, 90]);
    }

    #[test]
    fn test_expensive_computation() {
        let result = expensive_computation(5);
        assert!(result != 0); // Just ensure it computes something
    }
}