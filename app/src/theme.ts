export const colors = {
  background: '#0F1226',
  surface: '#191D3A',
  surfaceAlt: '#222749',
  border: '#2E3462',
  primary: '#6C7BFF',
  primaryDark: '#4A57D6',
  text: '#F4F5FF',
  textMuted: '#A2A8CF',
  danger: '#FF6B81',
  success: '#4ED8A0',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

/** Palette utilisee pour colorer les avatars, choisie de facon deterministe par nom. */
const avatarColors = ['#6C7BFF', '#FF8FA3', '#4ED8A0', '#FFC46B', '#8E7BFF', '#4CC9F0'];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return avatarColors[hash % avatarColors.length];
}
