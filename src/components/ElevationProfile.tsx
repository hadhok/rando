import React from 'react';
import { View } from 'react-native';
import { C } from '../theme';

interface Props {
  path: string;
  color: string;
  height?: number;
}

export default function ElevationProfile({ color, height = 60 }: Props) {
  return (
    <View
      style={{
        height,
        width: '100%',
        backgroundColor: C.paper3,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        borderBottomWidth: 2,
        borderBottomColor: color,
      }}
    />
  );
}
