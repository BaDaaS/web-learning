# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is the **Web Learning** documentation site - a comprehensive resource for
preparing interviewers on advanced web development topics including TypeScript
SDKs, Rust/WebAssembly integration, worker patterns, cross-origin security, and
full-stack debugging.

**Technology Stack:**

- Docusaurus v2 (TypeScript)
- React components for MDX
- GitHub Pages deployment
- Local search (docusaurus-search-local)
- Mermaid diagrams support

## Development Commands

All commands use the Makefile for consistency with CI:

### Essential Commands

- `make install` - Install dependencies (uses npm ci)
- `make dev` - Start development server
- `make build` - Build for production
- `make serve` - Serve built site locally

### Quality Checks

- `make check` - Run all checks (format, lint, typecheck, trailing whitespace)
- `make lint` - Run ESLint
- `make typecheck` - Run TypeScript checking
- `make format` - Format all files
- `make format-md` - Format markdown files to 80 characters
- `make fix` - Fix all formatting issues

### Whitespace Management

- `make fix-trailing-whitespace` - Remove trailing whitespaces
- `make check-trailing-whitespace` - Check for trailing whitespaces

### Other Commands

- `make clean` - Clean build artifacts
- `make clean-deps` - Clean dependencies
- `make help` - Show all available commands

## Architecture

### Key Files

- `docusaurus.config.ts` - Main configuration (GitHub org/repo settings here)
- `sidebars.ts` - Navigation structure
- `docs/` - All documentation content
- `src/components/` - Reusable MDX components

### Documentation Structure

```
docs/
├── overview/          # Project overview and introduction
├── sdk-ts-wasm/       # TypeScript SDK & WebAssembly integration
├── workers-concurrency/# Worker patterns and concurrency
├── rust-wasm/         # Rust/WebAssembly specifics
├── cross-origin-security/# Security topics
├── debugging/         # Debugging techniques
├── exercises/         # Hands-on exercises
└── rubrics/           # Assessment rubrics
```

### Custom Components

- `<Callout type="good|bad|note">` - Highlight practices/warnings
- `<Question>` - Format interview questions
- `<Expected>` - Show expected responses
- `<Tabs>` and `<TabItem>` - Platform-specific examples

## Content Guidelines

### Target Audience

Senior developers and technical interviewers assessing advanced web development
skills.

### Content Structure

Each technical page should include:

1. **Core concepts** with practical examples
2. **Signals of Mastery** - what good understanding looks like
3. **Red Flags** - common misconceptions and poor practices
4. **Interview Questions** (`q-questions.mdx` files)

### Code Examples

- Prefer TypeScript over JavaScript
- Include both Node.js and browser versions when relevant
- Show real-world patterns, not toy examples
- Cover edge cases and error handling

## Code Documentation Guidelines

### Example File Organization

All code examples should be stored in the `examples/` directory with proper
organization:

```
examples/
├── workers-concurrency/     # Worker and concurrency patterns
├── sdk-ts-wasm/            # TypeScript SDK examples
├── rust-wasm/              # Rust WebAssembly examples
├── cross-origin-security/  # Security-related examples
├── debugging/              # Debugging examples
└── exercises/              # Exercise solutions
```

### Example File Naming Convention

- Use descriptive filenames with `.example.ts` extension
- Examples: `message-channel-basic.example.ts`,
  `backpressure-patterns.example.ts`
- Group related examples in the same file when logical
- Keep individual examples focused on a single concept

### Example File Structure

Each example file should follow this structure:

```typescript
/**
 * [Title] - Brief Description
 *
 * This example demonstrates [key concept] including [specific features].
 * Use cases: [when to use this pattern]
 */

// Main implementation with clear comments
class ExampleImplementation {
  // Implementation details
}

// Helper functions and utilities
function helperFunction() {
  // Implementation
}

// Usage examples showing practical application
function usageExample() {
  // Demonstrate how to use the implementation
}

// Export all relevant classes and functions
export { ExampleImplementation, helperFunction, usageExample };
```

### Documentation Integration

#### Using CodeBlock Component

Replace inline code blocks in MDX files with CodeBlock components:

```mdx
<CodeBlock
  language="typescript"
  title="Descriptive Title"
  file="examples/category/filename.example.ts"
  lines="10-25"
/>
```

#### CodeBlock Parameters

- `language`: Programming language for syntax highlighting
- `title`: Descriptive title explaining what the code does
- `file`: Relative path from project root to example file
- `lines`: Specific line ranges to display (optional)

### Code Quality Standards

#### TypeScript Requirements

- Use strict TypeScript configuration
- Include proper type annotations
- Handle error cases explicitly
- Use modern ES2020+ features appropriately

#### Documentation Comments

- Include JSDoc comments for classes and functions
- Explain complex algorithms or patterns
- Document parameter types and return values
- Include usage examples in comments when helpful

#### Example Organization

- **Single Concept**: Each example should focus on one main concept
- **Progressive Complexity**: Start with basic examples, build to advanced
- **Real-World Applicable**: Examples should reflect actual use cases
- **Error Handling**: Include proper error handling patterns
- **Performance Considerations**: Comment on performance implications

### Testing Example Code

#### Compilation Verification

All example code must compile successfully:

- Examples are automatically checked in CI via `make check-examples`
- Use `make compile-examples` locally to verify compilation
- Fix any TypeScript errors before committing

#### Example Testing

- Examples should be self-contained and runnable
- Include example usage functions that demonstrate the code
- Test edge cases and error conditions
- Verify examples work in both Node.js and browser environments when applicable

### Maintenance Guidelines

#### Keeping Examples Current

- Review examples when dependencies are updated
- Ensure compatibility with latest TypeScript versions
- Update examples when better patterns emerge
- Remove deprecated patterns and mark alternatives

#### Documentation Synchronization

- Update documentation when example code changes
- Ensure CodeBlock line references remain accurate
- Verify all referenced files exist and compile
- Check that example titles match the actual implementation

## Configuration Notes

### Repository Setup

Update `GITHUB_ORG` and `GITHUB_REPO` constants in `docusaurus.config.ts` for
your organization. This controls:

- GitHub Pages URL
- Edit links
- Footer repository links

### Search

Currently using local search (`@easyops-cn/docusaurus-search-local`). Can be
switched to Algolia by updating plugin configuration.

## Claude Development Guidelines

### Formatting Commands

After making code modifications, run appropriate formatting commands:

#### Markdown and MDX Files

- **Format**: Run `make format-md` after modifying markdown/MDX files
- **Check**: Run `make check-md` to verify formatting

#### TypeScript and JavaScript Files

- **Format**: Run `make format` after modifying TypeScript/JS files
- **Check**: Run `make check-format` to verify formatting

### Commit Guidelines

**NEVER** add Claude as a co-author in commit messages.

**NEVER** use emojis in commit messages.

**Always** wrap commit message titles and body text at 80 characters.

### Development Workflow

1. Make code changes
2. Run appropriate formatting command
3. **Always run `make fix-trailing-whitespace` before committing**
4. Verify formatting
5. **Verify no Claude co-author in commit message**
6. **Verify no emojis in commit message**
7. Proceed with testing or committing

### Critical Pre-Commit Requirements

- **MANDATORY**: Run `make fix-trailing-whitespace`
- **MANDATORY**: Run `make check-trailing-whitespace`
- Apply to ALL file modifications
- No trailing whitespaces allowed

Wrap all markdown files to 80 characters, as any other files.

## Testing and Validation

### Before Committing

1. Run `make check` to verify all quality checks pass
2. Run `make fix` to automatically fix issues
3. Run `make build` to ensure site builds successfully
4. Test navigation and links work correctly

### Content Validation

- Verify all code examples are syntactically correct
- Test Mermaid diagrams render properly
- Check all internal links resolve
- Ensure responsive design works on mobile

## Deployment

The site deploys automatically via GitHub Actions to GitHub Pages on pushes to
`main`. The workflow uses the Makefile commands to ensure consistency between
local development and CI.
