import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/supabase';
// 1. Importação essencial para a área segura
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HeaderItens = ({ title, topInset }) => {
  const router = useRouter();
  return (
    <View style={[styles.header, { paddingTop: topInset + 15 }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
};

export default function TelaDeItens() {
  const { id, nome, usaMapa, areaNome, areaId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets(); // 2. Hook de GPS do sistema
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
      <HeaderItens 
        title={usaMapa === 'sim' ? areaNome : 'Livre'} 
        topInset={insets.top} 
      />
      
      <View style={styles.content}>
        <View style={styles.subHeader}>
            <Ionicons name="pricetags-outline" size={16} color="#6B7280" />
            <Text style={styles.subtitle}> Materiais de {nome}</Text>
        </View>

        {carregando ? (
          <ActivityIndicator size="large" color="#005b9f" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={itens}
            keyExtractor={(item) => item.id.toString()}
            // 3. O ajuste mestre para a lista não sumir atrás da barra do Android
            contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.cardItem} 
                onPress={() => irParaContagem(item)} 
                activeOpacity={0.7}
              >
                <View style={styles.cardItemBody}>
                  <Text style={styles.codigoSap}>{item.codigo_sap}</Text>
                  <Text style={styles.descricao} numberOfLines={2}>{item.descricao}</Text>
                </View>
                <View style={styles.iconContainer}>
                    <Ionicons name="chevron-forward" size={20} color="#005b9f" />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum material encontrado.</Text>}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    backgroundColor: '#FFFFFF', 
    paddingBottom: 15, 
    paddingHorizontal: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, color: '#1F2937', fontWeight: 'bold' },
  
  content: { flex: 1, paddingHorizontal: 20 },
  subHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 15,
    backgroundColor: '#E2E8F0',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  subtitle: { fontSize: 13, color: '#475569', fontWeight: 'bold' },
  
  cardItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 20, 
    borderRadius: 16, 
    marginBottom: 12, 
    elevation: 3, 
    borderLeftWidth: 6, 
    borderLeftColor: '#005b9f', // Azul Ypê para Itens
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardItemBody: { flex: 1 },
  codigoSap: { fontSize: 20, fontWeight: 'bold', color: '#005b9f' },
  descricao: { fontSize: 14, color: '#64748B', marginTop: 4, textTransform: 'uppercase' },
  
  iconContainer: {
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 10,
    marginLeft: 10
  },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#94A3B8' }
});