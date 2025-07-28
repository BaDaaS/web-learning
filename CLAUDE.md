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