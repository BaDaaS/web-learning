import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// Configuration constants - update these for your repository
const GITHUB_ORG = 'BaDaaS'; // Replace with your GitHub organization
const GITHUB_REPO = 'web-learning'; // Replace with your repository name
const GITHUB_URL = `https://github.com/${GITHUB_ORG}/${GITHUB_REPO}`;

const config: Config = {
  title: 'Web Learning',
  tagline: "Interviewers' guide for TypeScript, Rust/WebAssembly & concurrency",
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // GitHub Pages configuration
  url: `https://${GITHUB_ORG}.github.io`,
  baseUrl: `/${GITHUB_REPO}/`,
  trailingSlash: false,

  // GitHub pages deployment config
  organizationName: GITHUB_ORG,
  projectName: GITHUB_REPO,
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: `${GITHUB_URL}/tree/main/`,
        },
        blog: false, // Disable blog for this project
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
    function (context, options) {
      return {
        name: 'raw-loader-plugin',
        configureWebpack(config, isServer, utils) {
          return {
            module: {
              rules: [
                {
                  test: /\.example\.(ts|js|tsx|jsx|rs|toml|json)$/,
                  use: 'raw-loader',
                },
              ],
            },
          };
        },
      };
    },
  ],

  themes: ['@docusaurus/theme-mermaid'],

  markdown: {
    mermaid: true,
  },

  themeConfig: {
    image: 'img/web-learning-social-card.jpg',
    navbar: {
      title: 'Web Learning',
      logo: {
        alt: 'Web Learning Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'exercisesSidebar',
          position: 'left',
          label: 'Exercises',
        },
        {
          type: 'docSidebar',
          sidebarId: 'questionsSidebar',
          position: 'left',
          label: 'Question Bank',
        },
        {
          href: GITHUB_URL,
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {
              label: 'TypeScript SDK & WebAssembly',
              to: '/docs/sdk-ts-wasm',
            },
            {
              label: 'Workers & Concurrency',
              to: '/docs/workers-concurrency',
            },
            {
              label: 'Rust/WebAssembly',
              to: '/docs/rust-wasm',
            },
          ],
        },
        {
          title: 'Practice',
          items: [
            {
              label: 'Exercises',
              to: '/docs/exercises',
            },
            {
              label: 'Rubrics',
              to: '/docs/rubrics/interviewer-rubric',
            },
          ],
        },
        {
          title: 'Contribute',
          items: [
            {
              label: 'GitHub',
              href: GITHUB_URL,
            },
            {
              label: 'Issues',
              href: `${GITHUB_URL}/issues`,
            },
            {
              label: 'Pull Requests',
              href: `${GITHUB_URL}/pulls`,
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ${GITHUB_ORG}.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['rust', 'toml', 'bash'],
    },
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
