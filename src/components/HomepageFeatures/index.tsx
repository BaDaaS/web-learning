import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'TypeScript SDK & WebAssembly',
    Svg: require('@site/static/img/typescript-wasm.svg').default,
    description: (
      <>
        Learn to design TypeScript SDKs that seamlessly wrap Rust/WebAssembly modules
        for both Node.js and browser environments. Master API design patterns,
        initialization strategies, and cross-platform compatibility.
      </>
    ),
  },
  {
    title: 'Workers & Concurrency',
    Svg: require('@site/static/img/workers-concurrency.svg').default,
    description: (
      <>
        Master advanced concurrency patterns using Web Workers, MessagePorts,
        and transferable objects. Implement efficient pipelines, backpressure
        handling, and worker pool management for high-performance applications.
      </>
    ),
  },
  {
    title: 'Security & Debugging',
    Svg: require('@site/static/img/security-debugging.svg').default,
    description: (
      <>
        Navigate cross-origin security (CORS, COOP/COEP) and SharedArrayBuffer
        requirements. Develop skills for debugging across TypeScript-WebAssembly-Runtime
        boundaries with profiling and tracing techniques.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
