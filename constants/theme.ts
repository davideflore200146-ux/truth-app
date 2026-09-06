export type ThemeMode = 'light' | 'dark';

export interface AppColors {
  primary: { 50: string; 100: string; 200: string; 300: string; 400: string; 500: string; 600: string; 700: string; 800: string; 900: string };
  accent: { 50: string; 100: string; 200: string; 300: string; 400: string; 500: string; 600: string; 700: string };
  success: { 50: string; 100: string; 400: string; 500: string; 600: string; 700: string };
  warning: { 50: string; 100: string; 400: string; 500: string; 600: string };
  error: { 50: string; 100: string; 400: string; 500: string; 600: string };
  neutral: {
    0: string; 50: string; 100: string; 200: string; 300: string;
    400: string; 500: string; 600: string; 700: string; 800: string;
    900: string; 950: string;
  };
}

export interface AppTheme {
  mode: ThemeMode;
  colors: AppColors;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  shadow: string;
  shadowOpacity: number;
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  inputBg: string;
  inputBorder: string;
  overlay: string;
}

const lightColors: AppColors = {
  primary: {
    50: '#eef4ff', 100: '#d9e6ff', 200: '#bcd3ff', 300: '#8eb6ff',
    400: '#598fff', 500: '#3b6bff', 600: '#2b50f0', 700: '#223fd4',
    800: '#1f37ab', 900: '#1e3387',
  },
  accent: {
    50: '#fef0f4', 100: '#fddbe6', 200: '#fbb8cd', 300: '#f78aad',
    400: '#f25ab0', 500: '#e83390', 600: '#d01f74', 700: '#ac1a5e',
  },
  success: {
    50: '#ecfdf5', 100: '#d1fae5', 400: '#34d399', 500: '#10b981',
    600: '#059669', 700: '#047857',
  },
  warning: {
    50: '#fffbeb', 100: '#fef3c7', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706',
  },
  error: {
    50: '#fef2f2', 100: '#fee2e2', 400: '#f87171', 500: '#ef4444', 600: '#dc2626',
  },
  neutral: {
    0: '#ffffff', 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
    300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569',
    700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617',
  },
};

const darkColors: AppColors = {
  primary: {
    50: '#1a1f3a', 100: '#1e2550', 200: '#2a3270', 300: '#3a46a0',
    400: '#5a6be0', 500: '#7b8fff', 600: '#9bb0ff', 700: '#bccaff',
    800: '#d8e0ff', 900: '#eef2ff',
  },
  accent: {
    50: '#2a1525', 100: '#3a1a35', 200: '#5a2350', 300: '#f25ab0',
    400: '#ff5ab0', 500: '#ff70c2', 600: '#ff8fd1', 700: '#ffb0de',
  },
  success: {
    50: '#0a2818', 100: '#0f3a24', 400: '#34d399', 500: '#10d980',
    600: '#34e89a', 700: '#5cf0b0',
  },
  warning: {
    50: '#2a2010', 100: '#3a2c18', 400: '#fbbf24', 500: '#f5c544', 600: '#ffd060',
  },
  error: {
    50: '#2a1010', 100: '#3a1414', 400: '#f87171', 500: '#ef5555', 600: '#ff7070',
  },
  neutral: {
    0: '#0a0e1a', 50: '#0f1424', 100: '#161c30', 200: '#1e2540',
    300: '#2a3350', 400: '#3a4566', 500: '#4a5680', 600: '#5a6ba0',
    700: '#7a88b8', 800: '#a0acce', 900: '#c8d0e8', 950: '#e8edf8',
  },
};

export const lightTheme: AppTheme = {
  mode: 'light',
  colors: lightColors,
  bg: lightColors.neutral[50],
  surface: lightColors.neutral[0],
  surfaceAlt: lightColors.neutral[100],
  border: lightColors.neutral[200],
  textPrimary: lightColors.neutral[900],
  textSecondary: lightColors.neutral[500],
  textTertiary: lightColors.neutral[400],
  shadow: lightColors.neutral[900],
  shadowOpacity: 0.06,
  tabBarBg: lightColors.neutral[0],
  tabBarBorder: lightColors.neutral[200],
  tabBarActive: lightColors.primary[600],
  tabBarInactive: lightColors.neutral[400],
  inputBg: lightColors.neutral[50],
  inputBorder: lightColors.neutral[200],
  overlay: 'rgba(0,0,0,0.4)',
};

export const darkTheme: AppTheme = {
  mode: 'dark',
  colors: darkColors,
  bg: darkColors.neutral[0],
  surface: darkColors.neutral[50],
  surfaceAlt: darkColors.neutral[100],
  border: darkColors.neutral[200],
  textPrimary: darkColors.neutral[900],
  textSecondary: darkColors.neutral[500],
  textTertiary: darkColors.neutral[400],
  shadow: '#000000',
  shadowOpacity: 0.4,
  tabBarBg: darkColors.neutral[0],
  tabBarBorder: darkColors.neutral[200],
  tabBarActive: darkColors.primary[400],
  tabBarInactive: darkColors.neutral[400],
  inputBg: darkColors.neutral[100],
  inputBorder: darkColors.neutral[200],
  overlay: 'rgba(0,0,0,0.6)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const Typography = {
  heading: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  small: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
};
