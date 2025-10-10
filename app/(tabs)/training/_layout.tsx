import { Stack } from 'expo-router/stack';

export default function TrainingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cycle-details" />
    </Stack>
  );
}
