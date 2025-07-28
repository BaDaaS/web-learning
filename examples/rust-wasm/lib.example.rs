use wasm_bindgen::prelude::*;
use js_sys::{Promise, Uint8Array};
use wasm_bindgen_futures::future_to_promise;
use std::collections::HashMap;

// Import the `console.log` function from the browser
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Macro for easier logging
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

/// Main WASM module that provides data processing capabilities
#[wasm_bindgen]
pub struct WasmModule {
    // Internal state
    processing_cache: HashMap<String, Vec<u8>>,
    is_initialized: bool,
}

#[wasm_bindgen]
impl WasmModule {
    /// Create a new instance of the WASM module
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmModule {
        console_log!("Creating new WasmModule instance");
        
        // Set up panic hook for better error messages
        std::panic::set_hook(Box::new(console_error_panic_hook::hook));
        
        WasmModule {
            processing_cache: HashMap::new(),
            is_initialized: true,
        }
    }

    /// Process input data and return transformed result
    #[wasm_bindgen]
    pub fn process_data(&mut self, input: &Uint8Array) -> Result<Uint8Array, JsValue> {
        if !self.is_initialized {
            return Err(JsValue::from_str("Module not initialized"));
        }

        // Convert JS Uint8Array to Rust Vec<u8>
        let input_data: Vec<u8> = input.to_vec();
        
        console_log!("Processing {} bytes of data", input_data.len());
        
        // Perform some processing (example: simple transformation)
        let processed_data = self.transform_data(input_data)?;
        
        // Convert back to Uint8Array for JavaScript
        Ok(Uint8Array::from(&processed_data[..]))
    }

    /// Asynchronous processing method that returns a Promise
    #[wasm_bindgen]
    pub fn process_data_async(&mut self, input: &Uint8Array) -> Promise {
        let input_data: Vec<u8> = input.to_vec();
        let cache_key = format!("async_{}", input_data.len());
        
        // Check cache first
        if let Some(cached_result) = self.processing_cache.get(&cache_key) {
            console_log!("Returning cached result for key: {}", cache_key);
            let result = Uint8Array::from(&cached_result[..]);
            return Promise::resolve(&result.into());
        }

        // Create async processing future
        let future = async move {
            // Simulate async work
            let processed = Self::async_transform(input_data).await?;
            Ok(JsValue::from(Uint8Array::from(&processed[..])))
        };

        future_to_promise(future)
    }

    /// Get processing statistics
    #[wasm_bindgen(getter)]
    pub fn cache_size(&self) -> usize {
        self.processing_cache.len()
    }

    /// Clear the processing cache
    #[wasm_bindgen]
    pub fn clear_cache(&mut self) {
        console_log!("Clearing processing cache");
        self.processing_cache.clear();
    }
}

impl WasmModule {
    /// Internal synchronous data transformation
    fn transform_data(&mut self, mut data: Vec<u8>) -> Result<Vec<u8>, JsValue> {
        // Example transformation: reverse and XOR with 0xAA
        data.reverse();
        for byte in &mut data {
            *byte ^= 0xAA;
        }
        
        // Cache the result
        let cache_key = format!("sync_{}", data.len());
        self.processing_cache.insert(cache_key, data.clone());
        
        Ok(data)
    }

    /// Internal asynchronous data transformation
    async fn async_transform(mut data: Vec<u8>) -> Result<Vec<u8>, JsValue> {
        // Simulate async processing delay
        let promise = Promise::new(&mut |resolve, _| {
            let timeout = js_sys::global()
                .dyn_into::<web_sys::Window>()
                .unwrap()
                .set_timeout_with_callback_and_timeout_and_arguments_0(
                    &resolve,
                    10, // 10ms delay
                )
                .unwrap();
        });
        
        wasm_bindgen_futures::JsFuture::from(promise).await?;
        
        // Perform transformation
        for (i, byte) in data.iter_mut().enumerate() {
            *byte = byte.wrapping_add(i as u8);
        }
        
        Ok(data)
    }
}

/// Utility function for memory management
#[wasm_bindgen]
pub fn get_memory_usage() -> usize {
    // This is a simplified example
    // In practice, you'd use more sophisticated memory tracking
    std::mem::size_of::<WasmModule>()
}

/// Initialize panic hook and logging
#[wasm_bindgen(start)]
pub fn main() {
    console_log!("WASM module initialized");
}