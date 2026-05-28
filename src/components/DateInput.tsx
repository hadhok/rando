import React from 'react';
import { TextInput } from 'react-native';
import { C, FF } from '../theme';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function DateInput({ value, onChange }: Props) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD"
      placeholderTextColor={`${C.ink}55`}
      style={{
        fontFamily: FF.mono,
        fontSize: 13,
        color: C.ink,
        borderWidth: 1,
        borderColor: C.line,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: C.paper3,
        minWidth: 120,
      }}
      keyboardType="numeric"
      maxLength={10}
    />
  );
}
