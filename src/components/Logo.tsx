import React from 'react';
import { Image } from 'react-native';

import logoSource from '@/assets/logo-familieknappen.png';

interface LogoProps {
  size?: number;
}

/** Familieknappen-logo som rund/avrundet bilde. Brukes i header (liten) og
 *  som visuelt anker på sign-in/onboarding (stor). */
export function Logo({ size = 32 }: LogoProps) {
  return (
    <Image
      accessible={false}
      accessibilityIgnoresInvertColors
      resizeMode="contain"
      source={logoSource}
      style={{ width: size, height: size, borderRadius: size * 0.18 }}
    />
  );
}
