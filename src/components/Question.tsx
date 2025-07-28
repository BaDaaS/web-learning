import React from 'react';
import Admonition from '@theme/Admonition';

interface QuestionProps {
  children: React.ReactNode;
}

export default function Question({ children }: QuestionProps) {
  return (
    <Admonition type="note" title="Interview Question">
      {children}
    </Admonition>
  );
}