import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../src/supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// DEFINIÇÃO DE LARGURA DAS COLUNAS (PARA SIMETRIA TOTAL)
const COL_ITEM = 4;    // Código e Descrição
const COL_FISICO = 2;  // Valor Físico
const COL_SAP = 2;     // Valor SAP
const COL_DESVIO = 2.5; // Desvio + Ícone

export default function TelaDivergencia() {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [supervisorAtivo, setSupervisorAtivo] = useState('Edevandro');
  const [lista, setLista] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const supervisores = ['Edevandro', 'Everaldo', 'Fabio', 'Joel', 'Marcelo', 'Samuel'];

  // 1. LÓGICA DE TURNO 05H ÀS 05H
  const obterFiltroTurno = (dataBase: Date) => {
    const inicio = new Date(dataBase);
    inicio.setHours(5, 0, 0, 0);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 1);
    fim.setHours(5, 0, 0, 0);
    return { inicio: inicio.toISOString(), fim: fim.toISOString() };
  };

  // 2. BUSCA DE DADOS COM CRUZAMENTO (FISICO vs SAP)
  const buscarDados = async () => {
    setCarregando(true);
    const { inicio, fim } = obterFiltroTurno(dataSelecionada);

    try {
      // Busca todos os itens do supervisor selecionado
      const { data: itens, error: errItens } = await supabase
        .from('itens')
        .select('id, descricao, saldo_sap')
        .eq('supervisor', supervisorAtivo);

      if (errItens) throw errItens;

      // Busca as contagens do turno
      const { data: contagens, error: errCont } = await supabase
        .from('contagens')
        .select('item_id, peso_liquido_calculado')
        .gte('data_hora', inicio)
        .lt('data_hora', fim);

      if (errCont) throw errCont;

      // Consolida os dados
      const listaConsolidada = itens.map(item => {
        const totalFisico = contagens
          ?.filter(c => c.item_id === item.id)
          .reduce((acc, curr) => acc + (curr.peso_liquido_calculado || 0), 0);

        const sap = item.saldo_sap || 0;
        const desvio = (totalFisico || 0) - sap;

        return {
          id: item.id,
          descricao: item.descricao,
          fisico: totalFisico || 0,
          sap: sap,
          desvio: desvio
        };
      });

      setLista(listaConsolidada);
    } catch (err: any) {
      Alert.alert("Erro", err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { buscarDados(); }, [supervisorAtivo, dataSelecionada]);

  // 3. EXPORTAÇÃO CSV SIMÉTRICA
  const exportarCSV = async () => {
    if (lista.length === 0) return;
    
    let csv = "ITEM;DESCRICAO;FISICO;SAP;DESVIO\n";
    lista.forEach(i => {
      csv += `${i.id};${i.descricao?.replace(/;/g, ",")};${i.fisico.toFixed(2).replace(".", ",")};${i.sap.toFixed(2).replace(".", ",")};${i.desvio.toFixed(2).replace(".", ",")}\n`;
    });

    const uri = FileSystem.documentDirectory + `Divergencia_${supervisorAtivo}.csv`;
    await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(uri);
  };

  return (
    <View style={styles.container}>
      {/* HEADER AZUL PADRÃO YPÊ */}
      <View style={styles.headerAzul}>
        <Text style={styles.titlePrincipal}>Divergência de Inventário</Text>
        
        <View style={styles.barraFiltro}>
          <View style={styles.dataContainer}>
            <Ionicons name="calendar-outline" size={20} color="#FFF" />
            <Text style={styles.txtData}>{dataSelecionada.toLocaleDateString('pt-BR')}</Text>
          </View>
          
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

      {/* FILTRO DE SUPERVISORES (BADGES) */}
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

      {/* CABEÇALHO DA TABELA (SIMETRIA) */}
      <View style={styles.tableHeader}>
        <Text style={[styles.txtHead, { flex: COL_ITEM, textAlign: 'left' }]}>Item</Text>
        <Text style={[styles.txtHead, { flex: COL_FISICO }]}>Físico</Text>
        <Text style={[styles.txtHead, { flex: COL_SAP }]}>SAP</Text>
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
              {/* COLUNA ITEM */}
              <View style={{ flex: COL_ITEM }}>
                <Text style={styles.itemCode}>{item.id}</Text>
                <Text style={styles.itemDesc} numberOfLines={1}>{item.descricao}</Text>
              </View>

              {/* COLUNA FÍSICO */}
              <View style={{ flex: COL_FISICO, alignItems: 'center' }}>
                <Text style={styles.valFisico}>{item.fisico.toFixed(2)}</Text>
              </View>

              {/* COLUNA SAP */}
              <View style={{ flex: COL_SAP, alignItems: 'center' }}>
                <Text style={styles.valSap}>{item.sap.toFixed(2)}</Text>
              </View>

              {/* COLUNA DESVIO COM ALERTA */}
              <View style={{ flex: COL_DESVIO, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                {item.desvio !== 0 && (
                  <Ionicons 
                    name="alert-circle" 
                    size={16} 
                    color={item.desvio < 0 ? "#EF4444" : "#F59E0B"} 
                    style={{ marginRight: 4 }} 
                  />
                )}
                <Text style={[styles.valDesvio, { color: item.desvio < 0 ? '#EF4444' : item.desvio > 0 ? '#F59E0B' : '#10B981' }]}>
                  {item.desvio.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
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
  dataContainer: { flexDirection: 'row', alignItems: 'center' },
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
    paddingVertical: 18, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9',
    alignItems: 'center' 
  },
  itemCode: { fontSize: 15, fontWeight: 'bold', color: '#005b9f' },
  itemDesc: { fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', marginTop: 2 },
  valFisico: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  valSap: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  valDesvio: { fontSize: 14, fontWeight: 'bold', textAlign: 'right' }
});