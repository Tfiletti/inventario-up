import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 

const HeaderHome = ({ topInset }: { topInset: number }) => (
  <View style={[styles.header, { paddingTop: topInset + 15 }]}>
    <View style={styles.logoContainer}>
      <View style={styles.logoSC}><Text style={styles.logoSCText}>SC</Text></View>
      <View>
        <Text style={styles.logoSmart}>SMART</Text>
        <Text style={styles.logoCount}>COUNT</Text>
      </View>
    </View>
    <View style={styles.headerTitleContainer}>
      <Text style={styles.headerTitle}>Sistemas de Inventário</Text>
    </View>
  </View>
);

export default function TelaInicial() {
  const [familias, setFamilias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    async function buscarFamilias() {
      const { data, error } = await supabase.from('familias').select('*');
      if (data) setFamilias(data);
      setCarregando(false);
    }
    buscarFamilias();
  }, []);

  // --- ALTERAÇÃO AQUI: DIRETO PARA ITENS ---
  const aoClicarNaFamilia = (familiaId: string, familiaNome: string) => {
    router.push({
      pathname: '/itens', // Agora pula a tela de setup/area
      params: { 
        familiaId: familiaId, 
        familiaNome: familiaNome 
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <HeaderHome topInset={insets.top} />

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Selecione uma família:</Text>

        {carregando ? (
          <ActivityIndicator size="large" color="#005b9f" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={familias}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ 
              paddingBottom: insets.bottom + 120 // Espaço para a Tab Bar Flutuante
            }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.cardFamilias} 
                onPress={() => aoClicarNaFamilia(item.id, item.nome)} 
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTag}>Rótulos e Embalagens</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                </View>
                <Text style={styles.cardTitle}>{item.nome}</Text>
                <Text style={styles.cardDescription}>Materiais cadastrados para conferência</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { 
    backgroundColor: '#FFFFFF', 
    paddingBottom: 15, 
    paddingHorizontal: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    elevation: 4 
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoSC: { width: 36, height: 36, backgroundColor: '#F59E0B', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  logoSCText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  logoSmart: { color: '#F59E0B', fontSize: 18, fontWeight: 'bold', lineHeight: 20 },
  logoCount: { color: '#1F2937', fontSize: 14, fontWeight: 'bold', letterSpacing: 1.2 },
  headerTitleContainer: { flex: 1, alignItems: 'flex-end' },
  headerTitle: { fontSize: 12, color: '#9CA3AF', fontWeight: 'bold', textTransform: 'uppercase' },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 20, color: '#111827', fontWeight: 'bold', marginBottom: 20 },
  cardFamilias: { 
    backgroundColor: '#FFFFFF', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 16, 
    elevation: 3, 
    borderLeftWidth: 6, 
    borderLeftColor: '#F59E0B' 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTag: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold', textTransform: 'uppercase' },
  cardTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  cardDescription: { fontSize: 14, color: '#6B7280', marginTop: 4 },
});