import { Svg, Path, Defs, LinearGradient, Stop, Circle, ClipPath } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

interface LogoProps {
  size?: number;
}

export function Logo({ size = 44 }: LogoProps) {
  const { theme } = useTheme();
  const isDark = theme.mode === 'dark';

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Defs>
        <LinearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
          <Stop offset="0" stopColor={isDark ? '#5a6be0' : '#2b50f0'} />
          <Stop offset="1" stopColor={isDark ? '#ff5ab0' : '#e83390'} />
        </LinearGradient>
        <LinearGradient id="logoGradInner" x1="12" y1="12" x2="36" y2="36">
          <Stop offset="0" stopColor="#ffffff" stopOpacity="0.3" />
          <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Shield outline */}
      <Path
        d="M24 3 L41 9 V22 C41 32 34 40 24 45 C14 40 7 32 7 22 V9 Z"
        fill="url(#logoGrad)"
      />
      <Path
        d="M24 3 L41 9 V22 C41 32 34 40 24 45 C14 40 7 32 7 22 V9 Z"
        fill="url(#logoGradInner)"
      />

      {/* Magnifying glass circle */}
      <Circle
        cx="20"
        cy="20"
        r="7"
        stroke="#ffffff"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Magnifying glass handle */}
      <Path
        d="M25 25 L31 31"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Checkmark inside glass */}
      <Path
        d="M17 20 L19.5 22.5 L23.5 17.5"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Trend line at bottom */}
      <Path
        d="M12 36 L18 33 L24 35 L30 30 L36 33"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </Svg>
  );
}

export function LogoMark({ size = 44 }: LogoProps) {
  return <Logo size={size} />;
}
