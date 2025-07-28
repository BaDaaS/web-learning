# Web Learning

**Interviewers' guide for TypeScript, Rust/WebAssembly & concurrency**

A comprehensive documentation site for preparing interviewers on advanced web
development topics including TypeScript SDKs, Rust/WebAssembly integration,
worker patterns, cross-origin security, and full-stack debugging.

**[Visit the full documentation site →](https://BaDaaS.github.io/web-learning/)**

For complete topics, exercises, interview questions, and assessment rubrics,
please visit the documentation website. This README contains only development
setup instructions.

## Quick Start

### Prerequisites

- Node.js 18+
- npm, pnpm, or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/BaDaaS/web-learning.git
cd web-learning

# Install dependencies
make install

# Start development server
make dev
```

The site will be available at `http://localhost:3000`.

### Development Commands

All commands are available through the Makefile:

```bash
# Development
make dev          # Start development server
make build        # Build for production
make serve        # Serve built site locally

# Quality checks
make check        # Run all checks (format, lint, typecheck, trailing whitespace)
make lint         # Run ESLint
make typecheck    # Run TypeScript checking

# Formatting
make format       # Format all files
make format-md    # Format markdown files to 80 characters
make fix          # Fix all formatting issues

# Whitespace management
make fix-trailing-whitespace    # Remove trailing whitespaces
make check-trailing-whitespace  # Check for trailing whitespaces

# Cleanup
make clean        # Clean build artifacts
make clean-deps   # Clean dependencies

# Help
make help         # Show all available commands
```

### npm/pnpm/yarn Alternative Commands

If you prefer package manager commands:

```bash
# Using npm
npm ci              # Install dependencies
npm run dev         # Development server
npm run build       # Build
npm run lint        # Lint
npm run format      # Format

# Using pnpm
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm format

# Using yarn
yarn install
yarn dev
yarn build
yarn lint
yarn format
```

## Configuration

### Repository Setup

Update these values in `docusaurus.config.ts`:

```typescript
const GITHUB_ORG = 'BaDaaS'; // Your GitHub organization
const GITHUB_REPO = 'web-learning'; // Your repository name
```

This will automatically configure:

- GitHub Pages URL: `https://BaDaaS.github.io/web-learning/`
- Edit links and repository references
- Footer links

### GitHub Pages Deployment

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: "GitHub Actions"

2. **Permissions** (if using fine-grained tokens):
   - Repository permissions: Contents (read), Pages (write), Metadata (read)
   - Account permissions: None required

3. **Custom Domain** (optional):
   - Add `CNAME` file to `static/` directory
   - Update `url` in `docusaurus.config.ts`

The GitHub Actions workflow will automatically deploy to the `gh-pages` branch
on every push to `main`.

## Contributing

**[See full contributor guidelines on the website →](https://BaDaaS.github.io/web-learning/)**

Quick contribution steps:

1. Fork and clone the repository
2. Run `make install && make dev`
3. Make your changes
4. Run `make check && make fix`
5. Create a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed technical guidelines.

## License

Copyright © 2025 BaDaaS.
