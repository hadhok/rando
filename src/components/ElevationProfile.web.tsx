import React from 'react';

interface Props {
  path: string;
  color: string;
  height?: number;
}

export default function ElevationProfile({ path, color, height = 60 }: Props) {
  const gradId = `eg${color.replace(/[^a-z0-9]/gi, '')}`;
  const svgHtml = `<svg viewBox="0 0 400 60" preserveAspectRatio="none" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.05"/>
      </linearGradient>
    </defs>
    <path d="${path}" fill="url(#${gradId})" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>`;

  return React.createElement('div', {
    style: { width: '100%', height },
    dangerouslySetInnerHTML: { __html: svgHtml },
  });
}
