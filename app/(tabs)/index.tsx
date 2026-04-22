import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/supabase';

const HeaderHome = () => (
  <View style={styles.header}>
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

  useEffect(() => {
    async function buscarFamilias() {
      const { data, error } = await supabase.from('familias').select('*');
      if (data) setFamilias(data);
      setCarregando(false);
    }
    buscarFamilias();
  }, []);

  const aoClicarNaFamilia = (familiaId, familiaNome) => {
    router.push({
      pathname: '/setup',
      params: { id: familiaId, nome: familiaNome }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <HeaderHome />

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Selecione uma família:</Text>

        {carregando ? (
          <ActivityIndicator size="large" color="#005b9f" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={familias}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.cardFamilias} onPress={() => aoClicarNaFamilia(item.id, item.nome)} activeOpacity={0.7}>
                <View style={styles.cardHeader}><Text style={styles.cardTag}>Rótulos e Embalagens</Text></View>
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
  header: { backgroundColor: '#FFFFFF', paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 4 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoSC: { width: 36, height: 36, backgroundColor: '#F59E0B', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  logoSCText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  logoSmart: { color: '#F59E0B', fontSize: 18, fontWeight: 'bold', lineHeight: 20 },
  logoCount: { color: '#1F2937', fontSize: 14, fontWeight: 'bold', letterSpacing: 1.2 },
  headerTitleContainer: { flex: 1, alignItems: 'flex-end' },
  headerTitle: { fontSize: 14, color: '#6B7280', fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 20, color: '#111827', fontWeight: 'bold', marginBottom: 20 },
  cardFamilias: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 10, marginBottom: 16, elevation: 3, borderLeftWidth: 6, borderLeftColor: '#F59E0B' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTag: { fontSize: 12, color: '#6B7280', fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#6B7280', paddingBottom: 2 },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937' },
  cardDescription: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
});