export function convertWeight(
  value: number,
  fromUnit: 'kg' | 'lbs',
  toUnit: 'kg' | 'lbs'
): number {
  if (fromUnit === toUnit) return value;

  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return value * 0.453592;
  }

  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return value * 2.20462;
  }

  return value;
}

export function formatWeight(value: number, unit: 'kg' | 'lbs'): string {
  return `${Math.round(value)} ${unit}`;
}

export function convertToLbs(value: number, fromUnit: 'kg' | 'lbs'): number {
  return convertWeight(value, fromUnit, 'lbs');
}

export function convertFromLbs(value: number, toUnit: 'kg' | 'lbs'): number {
  return convertWeight(value, 'lbs', toUnit);
}
