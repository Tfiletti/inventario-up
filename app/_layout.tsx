import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    // 1. O Provider é a base. Sem ele, o SafeAreaView das telas não funciona 100%
    <SafeAreaProvider>
      
      {/* 2. Configuramos a StatusBar (relógio, bateria) de forma global aqui */}
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />

      {/* 3. O Stack gerencia a navegação entre suas telas */}
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: '#FAFAFA' } // Define a cor de fundo padrão para todas as telas
        }} 
      />
      
    </SafeAreaProvider>
  );
}