import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* O React Native vai injetar as nossas telas aqui automaticamente */}
    </Stack>
  );
}