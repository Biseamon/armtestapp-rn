import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export type Breakpoint = 'phone' | 'tablet';

export interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isPhone: boolean;
  isTablet: boolean;
  columns: number; // Suggested number of columns for grid layouts
}

const TABLET_BREAKPOINT = 768;

function getBreakpoint(width: number): Breakpoint {
  return width >= TABLET_BREAKPOINT ? 'tablet' : 'phone';
}

function getColumns(width: number): number {
  return width >= TABLET_BREAKPOINT ? 3 : 2;
}

export function useResponsive(): ResponsiveInfo {
  const [dimensions, setDimensions] = useState<ScaledSize>(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const breakpoint = getBreakpoint(dimensions.width);
  const columns = getColumns(dimensions.width);

  return {
    width: dimensions.width,
    height: dimensions.height,
    breakpoint,
    isPhone: breakpoint === 'phone',
    isTablet: breakpoint === 'tablet',
    columns,
  };
}

// Utility function to get responsive padding
export function getResponsivePadding(width: number): number {
  return width >= TABLET_BREAKPOINT ? 24 : 20;
}

// Utility function to get responsive font size
export function getResponsiveFontSize(baseSize: number, width: number): number {
  const scale = width >= TABLET_BREAKPOINT ? 1.15 : 1;
  return Math.round(baseSize * scale);
}
