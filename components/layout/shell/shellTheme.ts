import type { ShellAudience } from './shellTypes';

export const SHELL_R = 'rounded-[5px]';
/** Espaço entre sidebar recolhida e popover/tooltip */
export const SHELL_POPOVER_GAP = 'ml-4';
export const SHELL_HEADER_HEIGHT = 'h-[3.75rem]';
/** Logo: visivelmente mais alta que a barra superior (diferença de 1rem) */
export const SHELL_BRAND_HEIGHT = 'h-[4.75rem]';

export const SHELL_SIDEBAR_WIDTH_EXPANDED = 'w-[15.5rem]';
export const SHELL_SIDEBAR_WIDTH_COLLAPSED = 'w-[4.5rem]';
export const SHELL_MAIN_OFFSET_EXPANDED = 'md:ml-[15.5rem]';
export const SHELL_MAIN_OFFSET_COLLAPSED = 'md:ml-[4.5rem]';

export const getShellSidebarBg = (audience: ShellAudience): string => {
  if (audience === 'client') {
    return 'bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950';
  }
  return 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950';
};

export const getShellAccent = (audience: ShellAudience) => {
  const isClient = audience === 'client';
  return {
    brandIcon: isClient
      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
      : 'bg-slate-700 text-white ring-1 ring-white/10',
    navActive: 'bg-white/10 text-white ring-1 ring-white/10',
    navInactive: 'text-slate-400 hover:text-white hover:bg-white/5',
    navIconActive: isClient ? 'text-blue-400' : 'text-white',
    navIndicator: isClient ? 'bg-blue-500' : 'bg-white',
    switcherAccent: isClient ? 'text-blue-400' : 'text-slate-300',
    sidebarBorder: 'border-slate-800/90',
    sidebarMuted: 'text-slate-500',
    badgeRing: 'ring-slate-900',
  };
};

export const shellPageBackdrop =
  'min-h-0 flex-1 overflow-y-auto bg-[#F3F4F6] bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(255,255,255,0.9),transparent)]';
