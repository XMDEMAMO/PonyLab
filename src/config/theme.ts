export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = Exclude<ThemeMode, 'system'>;

export interface ThemeConfig {
  modes: readonly ThemeMode[];
  defaultMode: ThemeMode;
  storageKey: string;
  themeColor: Record<ResolvedTheme, `#${string}`>;
}

export const themeConfig = {
  modes: ['light', 'dark', 'system'],
  defaultMode: 'system',
  storageKey: 'ponylab-theme',
  themeColor: {
    light: '#E7F0F2',
    dark: '#111A21',
  },
} as const satisfies ThemeConfig;
