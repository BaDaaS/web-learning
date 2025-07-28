import React from 'react';
import Admonition from '@theme/Admonition';

interface ExpectedProps {
  children: React.ReactNode;
}

export default function Expected({ children }: ExpectedProps) {
  return (
    <Admonition type="tip" title="Expected Response">
      {children}
    </Admonition>
  );
}