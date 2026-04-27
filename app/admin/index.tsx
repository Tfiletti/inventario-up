// app/admin/index.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminHub() {
  const router = useRouter();

  // Estrutura de botões do painel Admin
  const menuOptions = [
    {
      id: 'taras',
      title: 'Gestão de Taras',
      description: 'Cadastre paletes, embalagens e fórmulas.',
      icon: 'scale-outline',
      route: '/admin/taras',
      color: '#E6A23C' // Laranja Industrial
    },
    {
      id: 'locais',
      title: 'Mapeamento de Locais',
      description: 'Configure galpões, corredores e posições.',
      icon: 'map-outline',
      route: '/admin/locais',
      color: '#1E3A8A' // Azul Tech
    },
    {
      id: 'itens',
      title: 'Gestão de Itens',
      description: 'Adicione SKUs, vincule fórmulas e taras.',
      icon: 'cube-outline',
      route: '/admin/itens',
      color: '#10B981' // Verde
    },
    {
      id: 'equipe',
      title: 'Controle de Equipe',
      description: 'Gerencie acessos dos conferentes.',
      icon: 'people-outline',
      route: '/admin/equipe',
      color: '#6B7280' // Cinza
    }
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Painel de Configurações' }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Painel Admin</Text>
        <Text style={styles.subtitle}>Gerencie a engenharia do seu sistema SaaS</Text>
      </View>

      <View style={styles.grid}>
        {menuOptions.map((option) => (
          <TouchableOpacity 
            key={option.id} 
            style={styles.card}
            onPress={() => router.push(option.route)}
            activeOpacity={0.7}
          >
            {/* Ícone agora fica na esquerda, alinhado com o texto */}
            <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
              <Ionicons name={option.icon as any} size={24} color={option.color} />
            </View>
            
            {/* O TextContainer ocupa o espaço do meio (flex: 1) */}
            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{option.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{option.description}</Text>
            </View>

            {/* Setinha fixa na direita */}
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { 
    paddingVertical: 20, 
    paddingHorizontal: 25, 
    backgroundColor: '#FFFFFF', 
    borderBottomWidth: 1, 
    borderColor: '#EEE' 
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  grid: { padding: 15 },
  card: {
    flexDirection: 'row', // ALINHAMENTO HORIZONTAL (O segredo da compactação)
    alignItems: 'center', // Centraliza verticalmente
    backgroundColor: '#FFFFFF',
    padding: 15, // Reduzimos o padding interno
    borderRadius: 12,
    marginBottom: 12, // Reduzimos o espaço entre os cards
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15, // Dá um espaço para o texto que agora está do lado
  },
  textContainer: {
    flex: 1, // Faz o texto empurrar a setinha para o final da tela
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardDesc: { fontSize: 13, color: '#666', marginTop: 2 },
});