import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, StatusBar, ScrollView, Alert, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/supabase';

// Tipagem para clareza no desenvolvimento
interface RelatorioData {
  codigo: string;
  descricao: string;
  fisico: number;
  sap: number;
  desvio: number;
}

export default function TelaRelatorio() {
  const [dados, setDados] = useState<RelatorioData[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  // FILTROS
  const [dataBusca, setDataBusca] = useState(new Date().toISOString().split('T')[0]); 
  const [supervisorAtivo, setSupervisorAtivo] = useState('Edevandro');
  
  const supervisores = ['Edevandro', 'Everaldo', 'Fabio', 'Joel', 'Marcelo', 'Samuel'];

  // FUNÇÃO PRINCIPAL DE BUSCA E CÁLCULO
  async function gerarRelatorio() {
    setCarregando(true);
    try {
      // 1. Busca os itens do supervisor (Base da Tabela)
      const { data: itensDB, error: errItens } = await supabase
        .from('itens')
        .select('codigo_sap, descricao')
        .eq('supervisor', supervisorAtivo);

      if (errItens) throw errItens;
      if (!itensDB || itensDB.length === 0) {
        setDados([]);
        setCarregando(false);
        return;
      }

      const codigosSetor = itensDB.map(i => i.codigo_sap);

      // 2. Ajuste de Fuso Horário (UTC-3)
      const dataLocalInicio = new Date(dataBusca + "T00:00:00");
      const dataLocalFim = new Date(dataBusca + "T23:59:59");
      const inicioUTC = dataLocalInicio.toISOString();
      const fimUTC = dataLocalFim.toISOString();

      // 3. Busca Contagens e Saldos SAP
      const [resContagens, resSap] = await Promise.all([
        supabase.from('contagens').select('peso_liquido_calculado, item_id').in('item_id', codigosSetor).gte('data_hora', inicioUTC).lte('data_hora', fimUTC),
        supabase.from('estoque_sap').select('codigo_sap, saldo_sap').in('codigo_sap', codigosSetor)
      ]);

      if (resContagens.error) throw resContagens.error;

      // 4. Cruzamento de Dados (Lógica de Planilha)
      const relatorioFinal = itensDB.map(item => {
        const totalFisico = (resContagens.data || [])
          .filter(c => String(c.item_id).trim() === String(item.codigo_sap).trim())
          .reduce((acc, curr) => acc + curr.peso_liquido_calculado, 0);
        
        const saldoSAP = resSap.data?.find(s => s.codigo_sap === item.codigo_sap)?.saldo_sap || 0;

        return {
          codigo: item.codigo_sap,
          descricao: item.descricao,
          fisico: totalFisico,
          sap: saldoSAP,
          desvio: totalFisico - saldoSAP
        };
      });

      setDados(relatorioFinal);
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setCarregando(false);
    }
  }

  // EFEITO PARA REALTIME E FILTROS
  useEffect(() => {
    gerarRelatorio();

    // ESCUTA EM TEMPO REAL: Se algo mudar na tabela 'contagens', recalcula o relatório
    const canalRealtime = supabase
      .channel('db-sync-relatorio')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'contagens' }, 
        () => {
          console.log('Dados alterados! Sincronizando relatório...');
          gerarRelatorio();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalRealtime);
    };
  }, [supervisorAtivo, dataBusca]);

  const renderIcon = (desvio: number) => {
    if (Math.abs(desvio) < 0.01) return <Ionicons name="checkmark-circle" size={16} color="#10B981" />;
    return <Ionicons name={desvio > 0 ? "alert-circle" : "close-circle"} size={16} color={desvio > 0 ? "#F59E0B" : "#EF4444"} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Divergência de Inventário</Text>
        <View style={styles.dateSelector}>
          <Ionicons name="calendar-outline" size={18} color="#BFDBFE" />
          <TextInput 
            style={styles.dateInput}
            value={dataBusca}
            onChangeText={setDataBusca}
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#60A5FA"
          />
          <TouchableOpacity onPress={gerarRelatorio}>
            <Ionicons name="refresh-circle" size={32} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {supervisores.map(sup => (
            <TouchableOpacity 
              key={sup} 
              onPress={() => setSupervisorAtivo(sup)}
              style={[styles.chip, supervisorAtivo === sup && styles.chipAtivo]}
            >
              <Text style={[styles.chipText, supervisorAtivo === sup && styles.chipTextAtivo]}>{sup}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.colH, { flex: 2.5, textAlign: 'left' }]}>Item</Text>
        <Text style={styles.colH}>Físico</Text>
        <Text style={styles.colH}>SAP</Text>
        <Text style={styles.colH}>Desvio</Text>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color="#005b9f" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={dados}
          keyExtractor={(item) => item.codigo}
          refreshControl={<RefreshControl refreshing={false} onRefresh={gerarRelatorio} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 2.5 }}>
                <Text style={styles.txtCodigo}>{item.codigo}</Text>
                <Text style={styles.txtDesc} numberOfLines={1}>{item.descricao}</Text>
              </View>
              <Text style={styles.txtVal}>{item.fisico.toFixed(2)}</Text>
              <Text style={styles.txtVal}>{item.sap.toFixed(2)}</Text>
              <View style={[styles.txtVal, styles.desvioCell]}>
                {renderIcon(item.desvio)}
                <Text style={[styles.txtDesvio, { color: item.desvio < 0 ? "#EF4444" : "#1F2937" }]}>
                  {item.desvio.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="clipboard-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>Nenhum item para {supervisorAtivo}.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { backgroundColor: '#005b9f', paddingTop: 60, paddingBottom: 15, paddingHorizontal: 20 },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  dateSelector: { flexDirection: 'row', alignItems: 'center', marginTop: 10, backgroundColor: '#004a80', borderRadius: 8, paddingHorizontal: 10 },
  dateInput: { flex: 1, color: '#FFF', paddingVertical: 8, marginLeft: 8, fontSize: 16, fontWeight: 'bold' },
  filterBar: { padding: 10, backgroundColor: '#F3F4F6', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E5E7EB', marginRight: 10 },
  chipAtivo: { backgroundColor: '#005b9f' },
  chipText: { fontSize: 13, color: '#4B5563', fontWeight: 'bold' },
  chipTextAtivo: { color: '#FFF' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#E5E7EB', padding: 12 },
  colH: { flex: 1, fontSize: 10, fontWeight: 'bold', color: '#4B5563', textAlign: 'center' },
  row: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  txtCodigo: { fontSize: 14, fontWeight: 'bold', color: '#005b9f' },
  txtDesc: { fontSize: 11, color: '#9CA3AF' },
  txtVal: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700' },
  desvioCell: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  txtDesvio: { fontSize: 12, fontWeight: 'bold' },
  empty: { marginTop: 80, alignItems: 'center' },
  emptyText: { marginTop: 10, color: '#9CA3AF', fontSize: 14 }
});