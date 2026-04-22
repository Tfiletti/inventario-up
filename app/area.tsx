import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/supabase';

const HeaderMapa = () => {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1F2937" /></TouchableOpacity>
      <Text style={styles.headerTitle}>Mapa Físico</Text>
      <View style={{ width: 24 }} />
    </View>
  );
};

export default function SelecaoDeArea() {
  const { id, nome } = useLocalSearchParams();
  const router = useRouter();
  const [areas, setAreas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscarAreas() {
      const { data } = await supabase.from('areas').select('*').order('nome');
      if (data) setAreas(data);
      setCarregando(false);
    }
    buscarAreas();
  }, []);

  const aoClicarNaArea = (area) => {
    router.push({ pathname: '/itens', params: { id, nome, areaId: area.id, areaNome: area.nome, usaMapa: 'sim' } });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <HeaderMapa />
      <View style={styles.content}>
        <Text style={styles.subtitle}>Família: {nome}</Text>
        {carregando ? (
          <ActivityIndicator size="large" color="#005b9f" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={areas}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.cardArea} onPress={() => aoClicarNaArea(item)} activeOpacity={0.7}>
                <Ionicons name="location" size={24} color="#6B7280" />
                <Text style={styles.nomeArea}>{item.nome}</Text>
                {item.status_contagem === 'finalizado' && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
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
  header: { backgroundColor: '#FFFFFF', paddingTop: 60, paddingBottom: 15, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 4 },
  headerTitle: { fontSize: 18, color: '#1F2937', fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 20, fontWeight: '500' },
  cardArea: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 10, marginBottom: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  nomeArea: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginLeft: 15 },
});