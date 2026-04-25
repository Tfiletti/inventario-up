import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../src/supabase'; 
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';

const COL_ITEM = 4;
const COL_FISICO = 2;
const COL_SAP = 2;
const COL_DESVIO = 2.5;

export default function TelaDivergencia() {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [supervisorAtivo, setSupervisorAtivo] = useState('Edevandro');
  const [lista, setLista] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const supervisores = ['Edevandro', 'Everaldo', 'Fabio', 'Joel', 'Marcelo', 'Samuel'];

  // --- NOVA FUNÇÃO DE FORMATAÇÃO (INFALÍVEL) ---
  const formatarPeso = (valor: number) => {
    if (valor === undefined || valor === null) return "0,00";
    
    // 1. Garante 2 casas decimais e transforma em string
    // 2. Troca o ponto decimal por vírgula
    // 3. Usa uma expressão regular para colocar o ponto de milhar
    return valor
      .toFixed(2)
      .replace('.', ',')
      .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  };

  // --- FUNÇÃO PARA MOEDA (TAMBÉM MANUAL PARA GARANTIR) ---
  const formatarMoedaManual = (valor: number) => {
    return "R$ " + formatarPeso(valor);
  };

  const obterFiltroTurno = (dataBase: Date) => {
    const inicio = new Date(dataBase);
    inicio.setHours(5, 0, 0, 0);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 1);
    fim.setHours(5, 0, 0, 0);
    return { inicio: inicio.toISOString(), fim: fim.toISOString() };
  };

  const buscarDados = async () => {
    setCarregando(true);
    const { inicio, fim } = obterFiltroTurno(dataSelecionada);
    
    const ano = dataSelecionada.getFullYear();
    const mes = String(dataSelecionada.getMonth() + 1).padStart(2, '0');
    const dia = String(dataSelecionada.getDate()).padStart(2, '0');
    const dataLocalStr = `${ano}-${mes}-${dia}`;
    
    const sapInicio = `${dataLocalStr}T00:00:00.000Z`;
    const sapFim = `${dataLocalStr}T23:59:59.999Z`;

    try {
      const { data: itens, error: errItens } = await supabase
        .from('itens')
        .select('id, descricao, preco_unitario')
        .eq('supervisor', supervisorAtivo);

      if (errItens) throw errItens;

      const { data: contagens, error: errCont } = await supabase
        .from('contagens')
        .select('item_id, peso_liquido_calculado')
        .gte('data_hora', inicio)
        .lt('data_hora', fim);

      if (errCont) throw errCont;

      const { data: estoqueSap, error: errSap } = await supabase
        .from('estoque_sap')
        .select('codigo_sap, saldo_sap')
        .gte('data_atualizacao', sapInicio)
        .lte('data_atualizacao', sapFim);

      if (errSap) throw errSap;

      const listaConsolidada = itens.map(item => {
        const totalFisico = contagens
          ?.filter(c => c.item_id === item.id)
          .reduce((acc, curr) => acc + (curr.peso_liquido_calculado || 0), 0);

        const itemSap = estoqueSap?.find(e => String(e.codigo_sap) === String(item.id));
        const sap = itemSap ? (itemSap.saldo_sap || 0) : 0; 

        const desvio = (totalFisico || 0) - sap;
        const precoUnit = item.preco_unitario || 0;
        const impacto = desvio * precoUnit;

        return {
          id: item.id,
          descricao: item.descricao,
          fisico: totalFisico || 0,
          sap: sap,
          desvio: desvio,
          impacto: impacto
        };
      });

      setLista(listaConsolidada);
    } catch (err: any) {
      Alert.alert("Erro", err.message);
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      buscarDados();
    }, [supervisorAtivo, dataSelecionada])
  );

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDataSelecionada(selectedDate);
    }
  };

  const exportarCSV = async () => {
    if (lista.length === 0) return;
    
    let csv = "ITEM;DESCRICAO;FISICO;SAP;DESVIO;IMPACTO (R$)\n";
    lista.forEach(i => {
      csv += `${i.id};${i.descricao?.replace(/;/g, ",")};${formatarPeso(i.fisico)};${formatarPeso(i.sap)};${formatarPeso(i.desvio)};${formatarPeso(i.impacto)}\n`;
    });

    const uri = FileSystem.documentDirectory + `Divergencia_${supervisorAtivo}.csv`;
    await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(uri);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerAzul}>
        <Text style={styles.titlePrincipal}>Divergência de Inventário</Text>
        <View style={styles.barraFiltro}>
          <TouchableOpacity style={styles.dataContainer} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#FFF" />
            <Text style={styles.txtData}>{dataSelecionada.toLocaleDateString('pt-BR')}</Text>
          </TouchableOpacity>
          <View style={styles.acoesHeader}>
            <TouchableOpacity onPress={exportarCSV} style={styles.iconBtn}>
              <MaterialCommunityIcons name="file-excel" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={buscarDados} style={styles.iconBtn}>
              <Ionicons name="refresh-circle" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={dataSelecionada}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      <View style={styles.containerSupervisores}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
          {supervisores.map(sup => (
            <TouchableOpacity 
              key={sup} 
              onPress={() => setSupervisorAtivo(sup)}
              style={[styles.badge, supervisorAtivo === sup && styles.badgeAtivo]}
            >
              <Text style={[styles.txtBadge, supervisorAtivo === sup && styles.txtBadgeAtivo]}>{sup}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.txtHead, { flex: COL_ITEM, textAlign: 'left' }]}>Item</Text>
        <Text style={[styles.txtHead, { flex: COL_FISICO, textAlign: 'center' }]}>Físico</Text>
        <Text style={[styles.txtHead, { flex: COL_SAP, textAlign: 'center' }]}>SAP</Text>
        <Text style={[styles.txtHead, { flex: COL_DESVIO, textAlign: 'right' }]}>Desvio</Text>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color="#005b9f" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={lista}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: COL_ITEM }}>
                <Text style={styles.itemCode}>{item.id}</Text>
                <Text style={styles.itemDesc} numberOfLines={1}>{item.descricao}</Text>
              </View>

              <View style={{ flex: COL_FISICO, alignItems: 'center' }}>
                <Text style={styles.valFisico}>{formatarPeso(item.fisico)}</Text>
              </View>

              <View style={{ flex: COL_SAP, alignItems: 'center' }}>
                <Text style={styles.valSap}>{formatarPeso(item.sap)}</Text>
              </View>

              <View style={{ flex: COL_DESVIO, alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {item.desvio !== 0 && (
                    <Ionicons 
                      name="alert-circle" 
                      size={14} 
                      color={item.desvio < 0 ? "#EF4444" : "#F59E0B"} 
                      style={{ marginRight: 4 }} 
                    />
                  )}
                  <Text style={[styles.valDesvio, { color: item.desvio < 0 ? '#EF4444' : item.desvio > 0 ? '#F59E0B' : '#10B981' }]}>
                    {item.desvio > 0 ? `+${formatarPeso(item.desvio)}` : formatarPeso(item.desvio)}
                  </Text>
                </View>
                
                <Text style={[styles.valGrana, { color: item.impacto < 0 ? '#EF4444' : '#64748B' }]}>
                  {formatarMoedaManual(item.impacto)}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Sem dados para este filtro.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerAzul: { backgroundColor: '#005b9f', paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20 },
  titlePrincipal: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  barraFiltro: { 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 12 
  },
  dataContainer: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  txtData: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  acoesHeader: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 2 },
  
  containerSupervisores: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  badge: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', marginRight: 8 },
  badgeAtivo: { backgroundColor: '#005b9f' },
  txtBadge: { fontSize: 14, fontWeight: 'bold', color: '#64748B' },
  txtBadgeAtivo: { color: '#FFF' },

  tableHeader: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  txtHead: { fontSize: 11, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase' },

  row: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9',
    alignItems: 'center' 
  },
  itemCode: { fontSize: 15, fontWeight: 'bold', color: '#005b9f' },
  itemDesc: { fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', marginTop: 2 },
  valFisico: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  valSap: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  valDesvio: { fontSize: 14, fontWeight: 'bold' },
  valGrana: { fontSize: 10, fontWeight: 'bold', marginTop: 2 }, 
  
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8' }
});