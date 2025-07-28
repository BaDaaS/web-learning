# Web Learning Documentation Makefile
#
# Prerequisites:
# - Node.js and npm (for TypeScript and documentation)
# - Rust nightly toolchain (for examples and formatting)
# - taplo (for TOML formatting): run 'make install-taplo' if not installed
# - wasm-pack (for WebAssembly builds): run 'make install-wasm-pack' if not installed

.PHONY: help
help: ## Ask for help!
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

# Development commands
.PHONY: install
install: ## Install dependencies
	@if [ -f package-lock.json ]; then \
		npm ci; \
	else \
		npm install; \
	fi

.PHONY: dev
dev: ## Start development server
	npm run dev

.PHONY: build
build: ## Build the documentation site
	npm run build

.PHONY: serve
serve: ## Serve built site locally
	npm run serve

.PHONY: deploy
deploy: ## Deploy to GitHub Pages
	npm run deploy

# Formatting and linting
.PHONY: format
format: ## Format all code and documentation
	npm run format
	$(MAKE) format-md
	$(MAKE) format-rust
	$(MAKE) format-toml

.PHONY: format-md
format-md: ## Format markdown files to 80 characters
	@echo "Formatting markdown files to 80 characters..."
	@find . -type f \( -name "*.md" -o -name "*.mdx" \) \
		-not -path "./node_modules/*" \
		-not -path "./build/*" \
		-not -path "./.docusaurus/*" \
		-not -path "./.git/*" \
		-exec npx prettier --write --prose-wrap always --print-width 80 {} + && \
		echo "Markdown files formatted."

.PHONY: check-format
check-format: ## Check code formatting
	npm run lint
	$(MAKE) check-md
	$(MAKE) check-rust-format
	$(MAKE) check-toml-format

.PHONY: check-md
check-md: ## Check markdown file formatting
	@echo "Checking markdown file formatting..."
	@find . -type f \( -name "*.md" -o -name "*.mdx" \) \
		-not -path "./node_modules/*" \
		-not -path "./build/*" \
		-not -path "./.docusaurus/*" \
		-not -path "./.git/*" \
		-exec npx prettier --check --prose-wrap always --print-width 80 {} + && \
		echo "Markdown formatting is correct." || \
		(echo "Markdown files need formatting. Run 'make format-md'." && exit 1)

.PHONY: lint
lint: ## Run linting
	npm run lint

.PHONY: lint-fix
lint-fix: ## Run linting with auto-fix
	npm run lint:fix

.PHONY: typecheck
typecheck: ## Run TypeScript type checking
	npm run typecheck

# Whitespace management (from OpenMina)
.PHONY: fix-trailing-whitespace
fix-trailing-whitespace: ## Remove trailing whitespaces from all files
	@find . -type f \( \
		-name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
		-o -name "*.md" -o -name "*.mdx" -o -name "*.json" -o -name "*.yaml" \
		-o -name "*.yml" -o -name "*.css" -o -name "*.scss" -o -name "*.sh" \) \
		-not -path "./node_modules/*" \
		-not -path "./build/*" \
		-not -path "./.docusaurus/*" \
		-not -path "./.git/*" \
		-exec sed -i'' -e "s/[[:space:]]*$$//" {} + && \
		echo "Trailing whitespaces removed."

.PHONY: check-trailing-whitespace
check-trailing-whitespace: ## Check for trailing whitespaces in source files
	@files_with_trailing_ws=$$(find . -type f \( \
		-name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
		-o -name "*.md" -o -name "*.mdx" -o -name "*.json" -o -name "*.yaml" \
		-o -name "*.yml" -o -name "*.css" -o -name "*.scss" -o -name "*.sh" \) \
		-not -path "./node_modules/*" \
		-not -path "./examples/node_modules/*" \
		-not -path "./build/*" \
		-not -path "./.docusaurus/*" \
		-not -path "./target/*" \
		-not -path "./examples/rust-wasm/target/*" \
		-not -path "./.git/*" \
		-exec grep -l '[[:space:]]$$' {} + 2>/dev/null || true); \
	if [ -n "$$files_with_trailing_ws" ]; then \
		echo "Files with trailing whitespaces:"; \
		for file in $$files_with_trailing_ws; do \
			echo "  $$file"; \
			echo "    Lines with trailing whitespaces:"; \
			grep -n '[[:space:]]$$' "$$file" | head -5 | sed 's/^/      /'; \
			lines_count=$$(grep -c '[[:space:]]$$' "$$file"); \
			if [ "$$lines_count" -gt 5 ]; then \
				echo "      ... and $$((lines_count - 5)) more lines"; \
			fi; \
		done; \
		echo "Run 'make fix-trailing-whitespace' to fix them."; \
		exit 1; \
	else \
		echo "No trailing whitespaces found."; \
	fi

# Example compilation
.PHONY: install-examples
install-examples: ## Install dependencies for examples
	@echo "Installing TypeScript dependencies for examples..."
	@cd examples && npm install

.PHONY: install-taplo
install-taplo: ## Install taplo TOML formatter
	@if command -v cargo >/dev/null 2>&1; then \
		echo "Installing taplo..."; \
		cargo install taplo-cli; \
		echo "taplo installed successfully."; \
	else \
		echo "Cargo not found - cannot install taplo"; \
	fi

.PHONY: install-wasm-pack
install-wasm-pack: ## Install wasm-pack for WebAssembly builds
	@if command -v cargo >/dev/null 2>&1; then \
		echo "Installing wasm-pack..."; \
		cargo install wasm-pack; \
		echo "wasm-pack installed successfully."; \
	else \
		echo "Cargo not found - cannot install wasm-pack"; \
	fi

.PHONY: compile-examples
compile-examples: ## Compile all example scripts to check they're valid
	@echo "Compiling TypeScript examples..."
	@cd examples && npm run typecheck
	@echo "Checking Rust examples..."
	@if command -v cargo >/dev/null 2>&1; then \
		cd examples/rust-wasm && \
		cargo check --bins && \
		cargo clippy --bins --all-targets --all-features -- -D warnings; \
	else \
		echo "Cargo not found - skipping Rust example compilation"; \
	fi
	@echo "All examples compiled successfully!"

.PHONY: build-rust-examples
build-rust-examples: ## Build Rust example binaries
	@if command -v cargo >/dev/null 2>&1; then \
		echo "Building Rust example binaries..."; \
		cd examples/rust-wasm && cargo build --bins --release; \
		echo "Rust binaries built successfully."; \
	else \
		echo "Cargo not found - skipping Rust binary build"; \
	fi

.PHONY: run-parallel-processing
run-parallel-processing: build-rust-examples ## Run the parallel processing example
	@if command -v cargo >/dev/null 2>&1; then \
		echo "Running parallel processing example..."; \
		./target/release/parallel-processing; \
	else \
		echo "Cargo not found - cannot run Rust examples"; \
	fi

.PHONY: run-wasm-integration
run-wasm-integration: build-rust-examples ## Run the WASM integration example
	@if command -v cargo >/dev/null 2>&1; then \
		echo "Running WASM integration example..."; \
		./target/release/wasm-integration; \
	else \
		echo "Cargo not found - cannot run Rust examples"; \
	fi

.PHONY: run-rust-examples
run-rust-examples: ## Run all Rust examples
	$(MAKE) run-parallel-processing
	$(MAKE) run-wasm-integration

.PHONY: run-parallel-processing-json
run-parallel-processing-json: build-rust-examples ## Run parallel processing example with JSON output
	@if command -v cargo >/dev/null 2>&1; then \
		./target/release/parallel-processing --json; \
	else \
		echo "Cargo not found - cannot run Rust examples"; \
	fi

.PHONY: run-wasm-integration-json
run-wasm-integration-json: build-rust-examples ## Run WASM integration example with JSON output
	@if command -v cargo >/dev/null 2>&1; then \
		./target/release/wasm-integration --json; \
	else \
		echo "Cargo not found - cannot run Rust examples"; \
	fi

.PHONY: benchmark-rust
benchmark-rust: build-rust-examples ## Run Rust examples with benchmarking
	@if command -v cargo >/dev/null 2>&1; then \
		echo "Running Rust benchmarks..."; \
		echo "=== Parallel Processing Benchmark ==="; \
		./target/release/parallel-processing --benchmark; \
		echo ""; \
		echo "=== WASM Integration Benchmark ==="; \
		./target/release/wasm-integration --simulate-wasm; \
	else \
		echo "Cargo not found - cannot run Rust benchmarks"; \
	fi

.PHONY: build-wasm
build-wasm: ## Build Rust code as WebAssembly using wasm-pack
	@if command -v wasm-pack >/dev/null 2>&1; then \
		echo "Building WebAssembly package..."; \
		cd examples/rust-wasm && wasm-pack build --target nodejs --out-dir pkg; \
		echo "WebAssembly package built successfully."; \
	else \
		echo "wasm-pack not found - please install with 'make install-wasm-pack'"; \
	fi

.PHONY: build-wasm-web
build-wasm-web: ## Build Rust code as WebAssembly for web browsers
	@if command -v wasm-pack >/dev/null 2>&1; then \
		echo "Building WebAssembly package for web..."; \
		cd examples/rust-wasm && wasm-pack build --target web --out-dir pkg-web; \
		echo "WebAssembly web package built successfully."; \
	else \
		echo "wasm-pack not found - please install with 'make install-wasm-pack'"; \
	fi

.PHONY: run-wasm-node
run-wasm-node: build-wasm ## Build and run WebAssembly in Node.js
	@if command -v node >/dev/null 2>&1; then \
		echo "Running WebAssembly in Node.js..."; \
		cd examples/rust-wasm && node wasm-node-runner.js; \
	else \
		echo "Node.js not found - cannot run WebAssembly"; \
	fi

.PHONY: test-wasm-node
test-wasm-node: build-wasm ## Build and test WebAssembly functionality in Node.js
	@if command -v node >/dev/null 2>&1; then \
		echo "Testing WebAssembly functionality in Node.js..."; \
		cd examples/rust-wasm && node wasm-test-runner.js; \
	else \
		echo "Node.js not found - cannot test WebAssembly"; \
	fi

.PHONY: format-rust
format-rust: ## Format Rust code
	@if command -v cargo >/dev/null 2>&1; then \
		echo "Formatting Rust code..."; \
		cd examples/rust-wasm && cargo fmt --all; \
		echo "Rust code formatted."; \
	else \
		echo "Cargo not found - skipping Rust formatting"; \
	fi

.PHONY: format-toml
format-toml: ## Format TOML files
	@if command -v taplo >/dev/null 2>&1; then \
		echo "Formatting TOML files..."; \
		taplo format; \
		echo "TOML files formatted."; \
	else \
		echo "taplo not found - skipping TOML formatting"; \
	fi

.PHONY: check-rust-format
check-rust-format: ## Check Rust code formatting
	@if command -v cargo >/dev/null 2>&1; then \
		echo "Checking Rust code formatting..."; \
		cd examples/rust-wasm && cargo fmt --all -- --check && echo "Rust formatting is correct."; \
	else \
		echo "Cargo not found - skipping Rust format check"; \
	fi

.PHONY: check-toml-format
check-toml-format: ## Check TOML files formatting
	@if command -v taplo >/dev/null 2>&1; then \
		echo "Checking TOML file formatting..."; \
		taplo check && echo "TOML formatting is correct."; \
	else \
		echo "taplo not found - skipping TOML format check"; \
	fi

.PHONY: check-examples
check-examples: install-examples compile-examples ## Check that all examples compile correctly

# Quality checks
.PHONY: check
check: check-format check-trailing-whitespace typecheck check-examples ## Run all checks

.PHONY: fix
fix: format fix-trailing-whitespace ## Fix all formatting issues

# Clean
.PHONY: clean
clean: ## Clean build artifacts
	npm run clear
	rm -rf build/ .docusaurus/

.PHONY: clean-deps
clean-deps: ## Clean dependencies
	rm -rf node_modules/ package-lock.json