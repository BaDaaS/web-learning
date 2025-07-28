# Code Examples

This directory contains compilable code examples that are included in the
documentation using raw-loader. All code files use the `.example.{ext}` naming
convention to be processed by the webpack configuration.

## Directory Structure

```
examples/
├── typescript-sdk/          # TypeScript SDK examples
├── rust-wasm/              # Rust/WebAssembly examples
├── workers-concurrency/    # Web Workers and concurrency patterns
├── cross-origin-security/  # CORS, COOP/COEP configuration examples
└── debugging/              # Debugging techniques and tools
```

## File Naming Convention

All example files must use the `.example.{ext}` suffix to be processed by
raw-loader:

- `basic-initialization.example.ts` - TypeScript example
- `lib.example.rs` - Rust example
- `coop-coep-headers.example.js` - JavaScript example
- `package.example.json` - JSON configuration example

## Usage in Documentation

Import and use the CodeExample component in MDX files:

```mdx
import CodeExample from '@site/src/components/CodeBlock';

<CodeExample
  path="typescript-sdk/basic-initialization.example.ts"
  language="typescript"
  title="Basic SDK Initialization Pattern"
  description="This example demonstrates a robust initialization pattern..."
/>
```

## Code Quality Requirements

All example code must:

1. **Be compilable** - Code should compile without errors when dependencies are
   available
2. **Follow best practices** - Demonstrate proper patterns and techniques
3. **Include comments** - Explain complex logic and design decisions
4. **Handle errors** - Show proper error handling strategies
5. **Be production-ready** - Code should be suitable for real-world use

## GitHub Integration

Each code example automatically includes a "View on GitHub" link that points to:
`https://github.com/BaDaaS/web-learning/blob/main/examples/{path}`

This allows readers to:

- View the complete file with syntax highlighting
- See the file history and changes
- Copy the raw file content
- Contribute improvements via pull requests

## Testing Examples

All examples are designed to be compilable and are automatically checked in CI.
You can compile them locally using:

### TypeScript Examples

```bash
# From the project root
make install-examples  # Install dependencies
make compile-examples   # Compile all examples
```

Or manually:

```bash
cd examples
npm install
npm run typecheck
```

### Rust Examples

```bash
# From the project root
cd examples/rust-wasm
cargo check
```

### CI Integration

Example compilation is automatically checked in the CI pipeline using the
`make check-examples` target, which ensures all examples remain compilable with
the latest dependencies.

## Contributing

When adding new examples:

1. Choose the appropriate subdirectory
2. Use the `.example.{ext}` naming convention
3. Include comprehensive documentation comments
4. Test that the code compiles in the target environment
5. Update the relevant documentation pages to reference the new example
6. Ensure the example follows the established patterns and quality standards
