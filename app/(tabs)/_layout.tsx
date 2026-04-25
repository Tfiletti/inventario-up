import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#005b9f',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 8,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          // Aumentamos a altura e o padding para fugir dos botões do Android
          height: Platform.OS === 'android' ? 85 : 95, 
          paddingBottom: Platform.OS === 'android' ? 20 : 30,
          paddingTop: 10,
          // Removemos o absolute para evitar conflito de sobreposição
          elevation: 10,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
      }}
    >
      {/* 1. HOME */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
          ),
        }}
      />

      {/* 2. REGISTROS */}
      <Tabs.Screen
        name="registros"
        options={{
          title: 'Registros',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons 
              name={focused ? "clipboard-text-play" : "clipboard-text-play-outline"} 
              size={26} 
              color={color} 
            />
          ),
        }}
      />

      {/* 3. RELATÓRIO */}
      <Tabs.Screen
        name="relatorio"
        options={{
          title: 'Relatório',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "analytics" : "analytics-outline"} size={26} color={color} />
          ),
        }}
      />

      {/* --- TELAS ONDE A BARRA DEVE SUMIR --- */}

      <Tabs.Screen 
        name="contar" 
        options={{ 
          href: null,
          tabBarStyle: { display: 'none' } // Isso esconde a barra nesta tela
        }} 
      />

      <Tabs.Screen 
        name="editar" 
        options={{ 
          href: null,
          tabBarStyle: { display: 'none' } // Isso esconde a barra nesta tela
        }} 
      />

      {/* OUTRAS TELAS APENAS ESCONDIDAS DO MENU */}
      <Tabs.Screen name="area" options={{ href: null }} />
      <Tabs.Screen name="itens" options={{ href: null }} />
      <Tabs.Screen name="modal" options={{ href: null }} />
      <Tabs.Screen name="setup" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />

    </Tabs>
  );
}