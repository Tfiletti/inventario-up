import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Importando ícones
import { supabase } from '../../src/supabase';

export default function TelaRegistros() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  // Lógica do Ciclo Ypê (05h às 05h)
  const obterFiltroTurno = () => {
    const agora = new Date();
    const inicio = new Date(agora);
    if (agora.getHours() < 5) inicio.setDate(agora.getDate() - 1);
    inicio.setHours(5, 0, 0, 0);

    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 1);
    
    return { 
      inicio: inicio.toISOString(), 
      fim: fim.toISOString(),
      exibicao: inicio.toLocaleDateString() 
    };
  };

  async function buscarRegistros() {
    setCarregando(true);
    const { inicio, fim } = obterFiltroTurno();
    
    try {
      const { data, error } = await supabase
        .from('contagens')
        .select('*, itens(*), areas(*)')
        .gte('data_hora', inicio)
        .lte('data_hora', fim)
        .order('data_hora', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscarRegistros();
    const canal = supabase.channel('registros-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contagens' }, () => buscarRegistros())
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.txtCiclo}>🕒 Ciclo: 05h às 05h ({obterFiltroTurno().exibicao})</Text>
      </View>

      <FlatList 
        data={registros}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={buscarRegistros} color="#005b9f" />}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => router.push({ pathname: '/editar-contagem', params: { id: item.id } })}
          >
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.txtArea}>📍 {item.areas?.nome || 'Sem Área'}</Text>
                <Text style={styles.txtSap}>{item.itens?.codigo_sap}</Text>
              </View>
              
              <View style={styles.statusIcons}>
                <Text style={styles.txtHora}>{new Date(item.data_hora).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Text>
                
                {/* INDICADORES VISUAIS */}
                <View style={styles.iconRow}>
                  {item.foto_url && (
                    <Ionicons name="camera" size={14} color="#005b9f" style={styles.miniIcon} />
                  )}
                  {item.observacao && item.observacao !== 'EMPTY' && (
                    <Ionicons name="document-text" size={14} color="#6B7280" style={styles.miniIcon} />
                  )}
                </View>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.txtDesc}>{item.itens?.descricao}</Text>
              <Text style={styles.txtPeso}>
                {item.peso_liquido_calculado?.toFixed(2) || '0.00'} 
                <Text style={styles.unitText}> {item.itens?.tipo_calculo === 'unidade' ? 'un' : 'kg'}</Text>
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#FFF', padding: 15, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  txtCiclo: { fontSize: 11, fontWeight: 'bold', color: '#0369A1', textAlign: 'center' },
  card: { backgroundColor: '#FFF', marginHorizontal: 12, marginTop: 12, padding: 15, borderRadius: 12, elevation: 2, borderLeftWidth: 5, borderLeftColor: '#005b9f' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  statusIcons: { alignItems: 'flex-end' },
  iconRow: { flexDirection: 'row', marginTop: 4 },
  miniIcon: { marginLeft: 5 },
  txtArea: { fontSize: 10, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 2 },
  txtHora: { fontSize: 10, color: '#9CA3AF' },
  txtSap: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 5 },
  txtDesc: { fontSize: 12, color: '#64748B', flex: 1, marginRight: 10 },
  txtPeso: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
  unitText: { fontSize: 12, color: '#64748B' }
});