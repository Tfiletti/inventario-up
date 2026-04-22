import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/supabase';

const HeaderItens = ({ title }) => {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1F2937" /></TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
};

export default function TelaDeItens() {
  // EXTRAÍMOS TUDO DA URL AQUI
  const { id, nome, usaMapa, areaNome, areaId } = useLocalSearchParams();
  const router = useRouter();
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscarItens() {
      const { data } = await supabase.from('itens').select('*').eq('familia_id', id);
      if (data) setItens(data);
      setCarregando(false);
    }
    buscarItens();
  }, [id]);

  const irParaContagem = (item) => {
    // PASSAGEM DE BASTÃO CRÍTICA
    router.push({ 
      pathname: '/contar', 
      params: { 
        itemId: item.id, 
        codigo: item.codigo_sap, 
        descricao: item.descricao, 
        usaMapa: usaMapa, 
        areaNome: areaNome || '', 
        areaId: areaId || '' 
      } 
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <HeaderItens title={usaMapa === 'sim' ? areaNome : 'Livre'} />
      <View style={styles.content}>
        <Text style={styles.subtitle}>Materiais de {nome}</Text>
        {carregando ? (
          <ActivityIndicator size="large" color="#005b9f" />
        ) : (
          <FlatList
            data={itens}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.cardItem} onPress={() => irParaContagem(item)} activeOpacity={0.7}>
                <View style={styles.cardItemBody}>
                  <Text style={styles.codigoSap}>{item.codigo_sap}</Text>
                  <Text style={styles.descricao}>{item.descricao}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
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
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 20 },
  cardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 8, marginBottom: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#005b9f' },
  cardItemBody: { flex: 1 },
  codigoSap: { fontSize: 18, fontWeight: 'bold', color: '#005b9f' },
  descricao: { fontSize: 15, color: '#374151', marginTop: 4 },
});