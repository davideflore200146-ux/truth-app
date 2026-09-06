import { Image } from 'react-native';

interface LogoProps {
size?: number;
}

export function Logo({ size = 44 }: LogoProps) {
return (
<Image
source={require('@/assets/images/icon.png')}
style={{
width: size,
height: size,
}}
resizeMode="contain"
/>
);
}

export function LogoMark({ size = 44 }: LogoProps) {
return <Logo size={size} />;
}
