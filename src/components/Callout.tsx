import React from 'react';
import Admonition from '@theme/Admonition';

interface CalloutProps {
  type: 'good' | 'bad' | 'note';
  title?: string;
  children: React.ReactNode;
}

const typeMapping = {
  good: { type: 'tip', title: 'Good Practice' },
  bad: { type: 'danger', title: 'Red Flag' },
  note: { type: 'info', title: 'Note' }
} as const;

export default function Callout({ type, title, children }: CalloutProps) {
  const config = typeMapping[type];
  const displayTitle = title || config.title;

  return (
    <Admonition
      type={config.type}
      title={displayTitle}
    >
      {children}
    </Admonition>
  );
}