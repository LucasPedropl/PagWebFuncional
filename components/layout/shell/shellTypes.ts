import type { LucideIcon } from 'lucide-react';

export interface ShellNavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number;
}

export interface ShellBrand {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
}

export type ShellAudience = 'client' | 'business';
