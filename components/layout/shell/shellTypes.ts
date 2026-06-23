import type { LucideIcon } from 'lucide-react';

export interface ShellNavChild {
  label: string;
  path: string;
  icon?: LucideIcon;
}

export interface ShellNavItem {
  icon: LucideIcon;
  label: string;
  path?: string;
  badge?: number;
  children?: ShellNavChild[];
}

export interface ShellBrand {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
}

export type ShellAudience = 'client' | 'business';

/** Resolve o título da página a partir dos itens da sidebar (inclui submenus). */
export const resolveShellPageTitle = (
  items: ShellNavItem[],
  path: string,
): string | null => {
  for (const item of items) {
    if (item.path === path) return item.label;
    const child = item.children?.find((c) => c.path === path);
    if (child) return child.label;
  }
  return null;
};
