import React from 'react';
import CodeBlock from '@theme/CodeBlock';

interface CodeExampleProps {
  /** Path to the example file relative to examples/ directory */
  path: string;
  /** Programming language for syntax highlighting */
  language?: string;
  /** Title for the code block */
  title?: string;
  /** GitHub organization name */
  org?: string;
  /** GitHub repository name */
  repo?: string;
  /** Additional description or context */
  description?: string;
}

// Configuration constants
const GITHUB_ORG = 'BaDaaS';
const GITHUB_REPO = 'web-learning';

/**
 * CodeExample component that imports code from files using raw-loader
 * and provides a link to view the code on GitHub.
 *
 * Usage:
 * ```tsx
 * import CodeExample from '@site/src/components/CodeBlock';
 *
 * <CodeExample
 *   path="typescript-sdk/basic-initialization.example.ts"
 *   language="typescript"
 *   title="Basic SDK Initialization"
 *   description="Shows how to initialize a TypeScript SDK wrapper for WASM"
 * />
 * ```
 */
export default function CodeExample({
  path,
  language,
  title,
  org = GITHUB_ORG,
  repo = GITHUB_REPO,
  description,
}: CodeExampleProps): React.JSX.Element {
  // Import the code file using raw-loader
  // This will be resolved at build time by our webpack configuration
  let codeContent: string;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    codeContent = require(`!!raw-loader!@site/examples/${path}`).default;
  } catch (error) {
    codeContent = `// Error loading example file: ${path}\n// ${error}`;
    // eslint-disable-next-line no-console
    console.error(`Failed to load example file: ${path}`, error);
  }

  // Determine language from file extension if not provided
  const detectedLanguage =
    language || path.split('.').pop()?.replace('example.', '') || 'text';

  // GitHub URL for the example file
  const githubUrl = `https://github.com/${org}/${repo}/blob/main/examples/${path}`;

  return (
    <div className="code-example-container">
      {description && (
        <div className="code-example-description margin-bottom--sm">
          <p>{description}</p>
        </div>
      )}

      <CodeBlock language={detectedLanguage} title={title} showLineNumbers>
        {codeContent}
      </CodeBlock>

      <div className="code-example-footer margin-top--sm">
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="button button--secondary button--sm"
        >
          📂 View on GitHub
        </a>
      </div>
    </div>
  );
}
