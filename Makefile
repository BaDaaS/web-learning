# Web Learning Documentation Makefile

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

.PHONY: compile-examples
compile-examples: ## Compile all example scripts to check they're valid
	@echo "Compiling TypeScript examples..."
	@cd examples && npm run typecheck
	@echo "Checking Rust examples..."
	@if command -v cargo >/dev/null 2>&1; then \
		cargo check --workspace && \
		cargo clippy --workspace --all-targets --all-features -- -D warnings; \
	else \
		echo "Cargo not found - skipping Rust example compilation"; \
	fi
	@echo "All examples compiled successfully!"

.PHONY: format-rust
format-rust: ## Format Rust code
	@if command -v cargo >/dev/null 2>&1; then \
		echo "Formatting Rust code..."; \
		cargo fmt --all; \
		echo "Rust code formatted."; \
	else \
		echo "Cargo not found - skipping Rust formatting"; \
	fi

.PHONY: check-rust-format
check-rust-format: ## Check Rust code formatting
	@if command -v cargo >/dev/null 2>&1; then \
		echo "Checking Rust code formatting..."; \
		cargo fmt --all -- --check && echo "Rust formatting is correct."; \
	else \
		echo "Cargo not found - skipping Rust format check"; \
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