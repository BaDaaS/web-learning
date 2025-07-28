import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    'overview/index',
    {
      type: 'category',
      label: 'TS SDK & WASM',
      collapsed: false,
      items: [
        'sdk-ts-wasm/index',
        'sdk-ts-wasm/packaging',
        'sdk-ts-wasm/init-and-api-design',
        'sdk-ts-wasm/errors-and-cancellation',
        'sdk-ts-wasm/asset-loading',
        'sdk-ts-wasm/q-questions',
      ],
    },
    {
      type: 'category',
      label: 'Workers & Concurrency',
      collapsed: false,
      items: [
        'workers-concurrency/index',
        'workers-concurrency/messageports-and-transferables',
        'workers-concurrency/pipelines-and-backpressure',
        'workers-concurrency/worker-pools',
        'workers-concurrency/q-questions',
      ],
    },
    {
      type: 'category',
      label: 'Rust/WASM',
      collapsed: false,
      items: [
        'rust-wasm/index',
        'rust-wasm/memory-and-limits',
        'rust-wasm/rayon-and-threads',
        'rust-wasm/error-mapping',
        'rust-wasm/build-size',
        'rust-wasm/q-questions',
      ],
    },
    {
      type: 'category',
      label: 'Cross-Origin Security',
      collapsed: false,
      items: [
        'cross-origin-security/index',
        'cross-origin-security/same-origin-cors',
        'cross-origin-security/cross-origin-isolation',
        'cross-origin-security/sharedarraybuffer',
        'cross-origin-security/canvas-tainting',
        'cross-origin-security/q-questions',
      ],
    },
    {
      type: 'category',
      label: 'Debugging',
      collapsed: false,
      items: [
        'debugging/index',
        'debugging/profiling-and-tracing',
        'debugging/boundary-bugs',
        'debugging/perf-pathologies',
        'debugging/q-questions',
      ],
    },
  ],
  exercisesSidebar: [
    'exercises/index',
    'exercises/sdk-compress-exercise',
    'exercises/pipeline-design-exercise',
    'exercises/wasm-oom-scenario',
  ],
  questionsSidebar: ['rubrics/interviewer-rubric', 'rubrics/quick-cheatsheet'],
};

export default sidebars;
