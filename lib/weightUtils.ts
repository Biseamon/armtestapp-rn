/**
 * Weight Conversion Utilities
 *
 * Functions for converting and formatting weights between different units.
 * Now supports storing data in user's preferred unit (not just lbs).
 */

/**
 * Convert pounds to kilograms
 * @param lbs - Weight in pounds
 * @returns Weight in kilograms, rounded to nearest integer
 */
export const lbsToKg = (lbs: number): number => {
  return Math.round(lbs * 0.453592);
};

/**
 * Convert kilograms to pounds
 * @param kg - Weight in kilograms
 * @returns Weight in pounds, rounded to nearest integer
 */
export const kgToLbs = (kg: number): number => {
  return Math.round(kg * 2.20462);
};

/**
 * Convert weight from one unit to another
 * @param value - The weight value to convert
 * @param fromUnit - The unit the value is currently in
 * @param toUnit - The unit to convert to
 * @returns The converted weight value (rounded to nearest integer)
 */
export function convertWeight(value: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs'): number {
  if (fromUnit === toUnit) return Math.round(value);
  
  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return Math.round(value * 0.453592); // 225 lbs = 102 kg
  } else if (fromUnit === 'kg' && toUnit === 'lbs') {
    return Math.round(value * 2.20462); // 102 kg = 225 lbs
  }
  
  return Math.round(value);
}

/**
 * Format weight for display with unit
 * @param weight - Weight value (in any unit)
 * @param unit - Unit to display
 * @param decimals - Number of decimal places (default: 0 for whole numbers)
 * @returns Formatted string like "100 lbs" or "45 kg"
 */
export const formatWeight = (weight: number, unit: 'lbs' | 'kg', decimals: number = 0): string => {
  return `${Math.round(weight)} ${unit}`;
};

/**
 * Convert user input to pounds for database storage
 * @param value - Weight value entered by user
 * @param fromUnit - Unit the user entered the value in
 * @returns Weight in pounds (rounded to nearest integer)
 */
export const convertToLbs = (value: number, fromUnit: 'lbs' | 'kg'): number => {
  return convertWeight(value, fromUnit, 'lbs');
};

/**
 * Convert database weight to user's preferred unit for display
 * @param weightInLbs - Weight from database (always in lbs)
 * @param toUnit - User's preferred display unit
 * @returns Weight in user's preferred unit (rounded to nearest integer)
 */
export const convertFromLbs = (weightInLbs: number, toUnit: 'lbs' | 'kg'): number => {
  return convertWeight(weightInLbs, 'lbs', toUnit);
};

/**
 * Convert circumference from cm to inches or keep in cm
 * @param value - Circumference value
 * @param toUnit - User's preferred unit ('kg' or 'lbs')
 * @returns Converted circumference value
 */
export function convertCircumference(value: number, toUnit: 'kg' | 'lbs'): number {
  // Circumferences stored in cm, convert to inches if user prefers lbs
  if (toUnit === 'lbs') {
    return value / 2.54; // cm to inches
  }
  return value; // keep in cm for kg users
}

/**
 * Get the unit for circumference based on weight unit
 * @param weightUnit - User's weight unit preference ('kg' or 'lbs')
 * @returns Circumference unit ('cm' or 'in')
 */
export function getCircumferenceUnit(weightUnit: 'kg' | 'lbs'): string {
  return weightUnit === 'lbs' ? 'in' : 'cm';
}
