"use client";

import * as Icons from 'lucide-react';
import { ComponentProps, useMemo } from 'react';

type IconName = keyof typeof Icons;

type DynamicIconProps = ComponentProps<typeof Icons.Activity> & {
  name: string;
};

const fallbackIcon = Icons.Circle;

const normalizeName = (original: string): IconName | undefined => {
  const cleaned = original
    .split(/[-_\s]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
  return cleaned as IconName;
};

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const IconComponent = useMemo(() => {
    const normalized = normalizeName(name);
    if (normalized && Icons[normalized]) {
      return Icons[normalized];
    }
    return fallbackIcon;
  }, [name]);

  return <IconComponent aria-hidden="true" {...props} />;
}

