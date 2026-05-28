import React from 'react';
import { C, FF } from '../theme';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function DateInput({ value, onChange }: Props) {
  return React.createElement('input', {
    type: 'date',
    value: value || '',
    onChange: (e: any) => onChange(e.target.value),
    style: {
      fontFamily: FF.mono,
      fontSize: 13,
      color: C.ink,
      border: `1.5px solid ${C.line}`,
      borderRadius: 6,
      paddingInline: 10,
      paddingBlock: 6,
      backgroundColor: C.paper3,
      outline: 'none',
      cursor: 'pointer',
      minWidth: 130,
    },
  });
}
