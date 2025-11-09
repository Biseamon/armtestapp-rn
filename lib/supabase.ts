/**
 * Supabase Configuration
 *
 * Sets up the Supabase client for database and authentication operations.
 * Works with both cloud-hosted and self-hosted Supabase instances.
 *
 * Configuration is loaded from environment variables:
 * - EXPO_PUBLIC_SUPABASE_URL: Your Supabase instance URL
 * - EXPO_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous key
 */

// Required for URL handling in React Native
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Load Supabase credentials from environment variables
// Supports both Expo config (app.json) and .env file
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Ensure required environment variables are present
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Supabase Client Instance
 *
 * Use this client for all database operations throughout the app.
 *
 * Configuration:
 * - autoRefreshToken: Automatically refresh expired tokens
 * - persistSession: Save session to local storage
 * - detectSessionInUrl: Disabled (not needed for mobile)
 * - storage: Uses AsyncStorage for React Native
 * - storageKey: Custom key for storing session data
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: AsyncStorage,
      storageKey: 'armwrestling-auth',
      debug: true, // Add this to see auth debug logs
    },
  }
);

/**
 * Database Type Definitions
 *
 * TypeScript types matching the database schema.
 * These types ensure type safety when working with database records.
 */

/**
 * User Profile
 * Linked to Supabase auth.users table via id
 */
export type Profile = {
  id: string;              // Matches auth.users.id
  email: string;           // User's email address
  full_name: string;       // User's display name
  is_premium: boolean;     // Premium subscription status
  is_test_user: boolean;   // Test user flag (gets premium features)
  weight_unit: 'lbs' | 'kg';  // User's preferred weight unit
  created_at: string;      // Account creation timestamp
  updated_at: string;      // Last profile update timestamp
  avatar_url: string;

};

/**
 * Workout Session
 * Records a single training session
 */
export type Workout = {
  id: string;                 // Unique workout ID
  user_id: string;            // Owner's user ID
  workout_type: string;       // Type: strength, technique, conditioning, etc.
  duration_minutes: number;   // How long the workout lasted
  intensity: number;          // 1-10 intensity rating
  notes: string;              // Optional workout notes
  cycle_id: string | null;    // Associated training cycle (if any)
  created_at: string;         // When workout was logged
  exercises?: { sets: number; reps: number }[]; // Add exercises property
};

/**
 * Exercise within a Workout
 * Individual exercises performed during a workout session
 */
export type Exercise = {
  id: string;              // Unique exercise ID
  workout_id: string;      // Parent workout ID
  exercise_name: string;   // Name of the exercise
  sets: number;            // Number of sets performed
  reps: number;            // Reps per set
  weight_lbs: number;      // Weight used (stored in user's unit)
  weight_unit: 'kg' | 'lbs'; // Unit the weight was stored in
  notes: string;           // Optional exercise notes
};

/**
 * Training Goal
 * User-defined goals with progress tracking
 */
export type Goal = {
  id: string;              // Unique goal ID
  user_id: string;         // Owner's user ID
  goal_type: string;       // Description of the goal
  target_value: number;    // Target to reach
  current_value: number;   // Current progress
  deadline?: string | null; // Optional deadline date
  is_completed: boolean;   // Whether goal is achieved
  notes?: string | null;   // Optional notes about the goal
  created_at: string;      // When goal was created
};

/**
 * Strength Test Result
 * Periodic strength assessments
 */
export type StrengthTest = {
  id: string;              // Unique test ID
  user_id: string;         // Owner's user ID
  test_type: string;       // Type: max_wrist_curl, table_pressure, etc.
  result_value: number;    // Test result (weight or measurement)
  result_unit: 'kg' | 'lbs'; // Unit the result was stored in
  notes?: string;          // Optional test notes
  created_at: string;      // When test was performed
};

/**
 * Training Cycle
 * Periodized training program with defined start/end dates
 */
export type Cycle = {
  id: string;              // Unique cycle ID
  user_id: string;         // Owner's user ID
  name: string;            // Cycle name (e.g., "Competition Prep 2024")
  description?: string;     // Optional cycle description
  cycle_type: string;      // Type: strength, technique, recovery, etc.
  start_date: string;      // Cycle start date
  end_date: string;        // Cycle end date
  is_active: boolean;      // Whether this is the current active cycle
  created_at: string;      // When cycle was created
};

export type ScheduledTraining = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time: string;
  notification_enabled: boolean;
  notification_minutes_before: number;
  notification_id: string | null;
  completed: boolean;
  created_at: string;
};

/**
 * Body Measurement
 * User body measurements over time
 */
export type BodyMeasurement = {
  id: string;
  user_id: string;
  weight?: number;         // Body weight
  weight_unit: 'kg' | 'lbs'; // Unit for weight
  arm_circumference?: number;      // in cm
  forearm_circumference?: number;  // in cm
  wrist_circumference?: number;    // in cm
  notes?: string;
  measured_at: string;
  created_at: string;
};