/*
  # Change strength test result_value to support decimals

  1. Changes
    - Alter `strength_tests.result_value` from integer to numeric(10,2)
      This allows storing decimal values like 102.5 lbs

  2. Security
    - No changes to RLS policies
*/

ALTER TABLE strength_tests 
ALTER COLUMN result_value TYPE numeric(10,2);
