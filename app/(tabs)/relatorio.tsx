import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../src/supabase'; 
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 

// 1. IMPORTANDO O CRACHÁ (SaaS e Papel do Usuário)
import { useAuth } from '../../src/context/AuthContext'; 

// Ajuste das larguras das colunas para caber a lixeira
const COL_ITEM = 3;
const COL_FISICO = 2;
const COL_SAP = 2;
const COL_DESVIO = 2;
const COL_ACAO = 1;

type SortConfig = {
  key: 'id' | 'fisico' | 'sap' | 'desvio';
  direction: 'asc' | 'desc';
}

export default function TelaDivergencia() {
  const insets = useSafeAreaInsets();
  
  // 2. PEGANDO OS DADOS DO USUÁRIO LOGADO
  const { organizacao_id, role } = useAuth(); 

  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [supervisorAtivo, setSupervisorAtivo] = useState('Edevandro');
  const [lista, setLista] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  
  const [busca, setBusca] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'desvio', direction: 'desc' });

  const supervisores = ['Edevandro', 'Everaldo', 'Fabio', 'Joel', 'Marcelo', 'Samuel'];

  const formatarPeso = (valor: number) => {
    if (valor === undefined || valor === null) return "0,00";
    return valor.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  };

  const formatarMoedaManual = (valor: number) => "R$ " + formatarPeso(valor);

  const obterFiltroTurno = (dataBase: Date) => {
    const inicio = new Date(dataBase);
    inicio.setHours(5, 0, 0, 0);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 1);
    fim.setHours(5, 0, 0, 0);
    return { inicio: inicio.toISOString(), fim: fim.toISOString() };
  };

  const buscarDados = async () => {
    if (!organizacao_id) return; // Trava SaaS

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

      // 3. Pegando a data_hora da contagem para saber a idade do registro
      const { data: contagens, error: errCont } = await supabase
        .from('contagens')
        .select('item_id, peso_liquido_calculado, data_hora')
        .eq('organizacao_id', organizacao_id)
        .gte('data_hora', inicio)
        .lt('data_hora', fim);

      if (errCont) throw errCont;

      // 4. Pegando a data_atualizacao do SAP também
      const { data: estoqueSap, error: errSap } = await supabase
        .from('estoque_sap')
        .select('codigo_sap, saldo_sap, data_atualizacao')
        .eq('organizacao_id', organizacao_id)
        .gte('data_atualizacao', sapInicio)
        .lte('data_atualizacao', sapFim);

      if (errSap) throw errSap;

      const listaConsolidada = itens.map(item => {
        const itensFisicos = contagens?.filter(c => c.item_id === item.id) || [];
        const totalFisico = itensFisicos.reduce((acc, curr) => acc + (curr.peso_liquido_calculado || 0), 0);
        
        const itensSapArr = estoqueSap?.filter(e => String(e.codigo_sap) === String(item.id)) || [];
        const itemSap = itensSapArr[0];
        const sap = itemSap ? (itemSap.saldo_sap || 0) : 0; 
        
        const desvio = (totalFisico || 0) - sap;
        const impacto = desvio * (item.preco_unitario || 0);

        // 5. Calcula o timestamp da última movimentação (Físico ou SAP) desse item
        let ultimaModificacao = 0;
        if (itensFisicos.length > 0) {
            ultimaModificacao = Math.max(...itensFisicos.map(c => new Date(c.data_hora).getTime()));
        } else if (itensSapArr.length > 0) {
            ultimaModificacao = Math.max(...itensSapArr.map(s => new Date(s.data_atualizacao).getTime()));
        }

        return {
          id: item.id,
          descricao: item.descricao,
          fisico: totalFisico || 0,
          sap: sap,
          desvio: desvio,
          impacto: impacto,
          ultimaModificacao: ultimaModificacao 
        };
      }); // <-- REMOVIDO O FILTRO PARA MANTER OS ZERADOS NA LISTA

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
    }, [supervisorAtivo, dataSelecionada, organizacao_id])
  );

  const listaProcessada = useMemo(() => {
    let resultado = [...lista];

    if (busca) {
      const termo = busca.toLowerCase();
      resultado = resultado.filter(i => 
        i.id.toLowerCase().includes(termo) || 
        i.descricao.toLowerCase().includes(termo)
      );
    }

    if (sortConfig.key) {
      resultado.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return resultado;
  }, [lista, busca, sortConfig]);

  const alternarOrdem = (key: SortConfig['key']) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortIcon = (key: SortConfig['key']) => {
    if (sortConfig.key !== key) return <Ionicons name="swap-vertical" size={12} color="#CBD5E1" />;
    return <Ionicons name={sortConfig.direction === 'asc' ? "arrow-up" : "arrow-down"} size={12} color="#005b9f" />;
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDataSelecionada(selectedDate);
  };

  // --- REGRA DE EXCLUSÃO (5 HORAS OU ADMIN) ---
  const confirmarExclusao = (item: any) => {
    if (!organizacao_id) return;

    const cincoHorasEmMs = 5 * 60 * 60 * 1000;
    const tempoDecorrido = Date.now() - item.ultimaModificacao;

    // Se passou de 5 horas E não é admin, bloqueia.
    if (tempoDecorrido > cincoHorasEmMs && role !== 'ADMIN') {
        Alert.alert(
            "⏳ Tempo Expirado", 
            "O prazo de 5 horas para exclusão deste registro expirou. Apenas o Administrador pode apagar esta contagem agora."
        );
        return;
    }

    Alert.alert(
        "Zerar Contagem", 
        `Deseja realmente apagar todo o registro Físico e SAP do item ${item.id} deste turno?\n\nEsta ação não pode ser desfeita.`, 
        [
            { text: "Cancelar", style: "cancel" },
            { text: "Sim, Zerar Item", style: "destructive", onPress: () => executarExclusao(item) }
        ]
    );
  };

  const executarExclusao = async (item: any) => {
    setCarregando(true);
    const { inicio, fim } = obterFiltroTurno(dataSelecionada);
    
    // Filtro para a tabela SAP (que usa YYYY-MM-DD apenas)
    const ano = dataSelecionada.getFullYear();
    const mes = String(dataSelecionada.getMonth() + 1).padStart(2, '0');
    const dia = String(dataSelecionada.getDate()).padStart(2, '0');
    const dataLocalStr = `${ano}-${mes}-${dia}`;
    const sapInicio = `${dataLocalStr}T00:00:00.000Z`;
    const sapFim = `${dataLocalStr}T23:59:59.999Z`;

    try {
        // 1. Apaga as Contagens Físicas
        const { error: err1 } = await supabase
            .from('contagens')
            .delete()
            .eq('item_id', item.id)
            .eq('organizacao_id', organizacao_id)
            .gte('data_hora', inicio)
            .lt('data_hora', fim);
            
        if (err1) throw err1;

        // 2. Apaga os Lançamentos de SAP
        const { error: err2 } = await supabase
            .from('estoque_sap')
            .delete()
            .eq('codigo_sap', item.id)
            .eq('organizacao_id', organizacao_id)
            .gte('data_atualizacao', sapInicio)
            .lte('data_atualizacao', sapFim);

        if (err2) throw err2;

        Alert.alert("Sucesso", "Registros zerados! Você já pode recontar este item.");
        buscarDados(); // Recarrega a tela instantaneamente
    } catch (error: any) {
        Alert.alert("Erro ao excluir", error.message);
        setCarregando(false);
    }
  };

  const exportarCSV = async () => {
    if (listaProcessada.length === 0) return;
    let csv = "ITEM;DESCRICAO;FISICO;SAP;DESVIO;IMPACTO (R$)\n";
    listaProcessada.forEach(i => {
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
        
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput 
            style={styles.inputBusca}
            placeholder="Buscar por código ou descrição..."
            value={busca}
            onChangeText={setBusca}
            placeholderTextColor="#94A3B8"
          />
          {busca !== '' && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

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
        <DateTimePicker value={dataSelecionada} mode="date" display="default" onChange={onChangeDate} />
      )}

      <View style={styles.containerSupervisores}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
          {supervisores.map(sup => (
            <TouchableOpacity 
              key={sup} 
              onPress={() => { setSupervisorAtivo(sup); setBusca(''); }}
              style={[styles.badge, supervisorAtivo === sup && styles.badgeAtivo]}
            >
              <Text style={[styles.txtBadge, supervisorAtivo === sup && styles.txtBadgeAtivo]}>{sup}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.tableHeader}>
        <TouchableOpacity style={[styles.headBtn, { flex: COL_ITEM }]} onPress={() => alternarOrdem('id')}>
          <Text style={styles.txtHead}>Item</Text>
          {renderSortIcon('id')}
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.headBtn, { flex: COL_FISICO, justifyContent: 'center' }]} onPress={() => alternarOrdem('fisico')}>
          <Text style={styles.txtHead}>Físico</Text>
          {renderSortIcon('fisico')}
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.headBtn, { flex: COL_SAP, justifyContent: 'center' }]} onPress={() => alternarOrdem('sap')}>
          <Text style={styles.txtHead}>SAP</Text>
          {renderSortIcon('sap')}
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.headBtn, { flex: COL_DESVIO, justifyContent: 'flex-end' }]} onPress={() => alternarOrdem('desvio')}>
          <Text style={styles.txtHead}>Desvio</Text>
          {renderSortIcon('desvio')}
        </TouchableOpacity>
        
        <View style={{ flex: COL_ACAO, alignItems: 'flex-end' }}>
             {/* Coluna reservada para o botão de apagar */}
        </View>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color="#005b9f" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={listaProcessada} 
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
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

              <View style={{ flex: COL_DESVIO, alignItems: 'flex-end', paddingRight: 5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {item.desvio !== 0 && (
                    <Ionicons name="alert-circle" size={14} color={item.desvio < 0 ? "#EF4444" : "#F59E0B"} style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.valDesvio, { color: item.desvio < 0 ? '#EF4444' : item.desvio > 0 ? '#F59E0B' : '#10B981' }]}>
                    {item.desvio > 0 ? `+${formatarPeso(item.desvio)}` : formatarPeso(item.desvio)}
                  </Text>
                </View>
                <Text style={[styles.valGrana, { color: item.impacto < 0 ? '#EF4444' : '#64748B' }]}>
                  {formatarMoedaManual(item.impacto)}
                </Text>
              </View>
              
              {/* BOTÃO EXCLUIR CONDICIONAL */}
              <View style={{ flex: COL_ACAO, alignItems: 'flex-end' }}>
                {(item.fisico > 0 || item.sap > 0) && (
                  <TouchableOpacity onPress={() => confirmarExclusao(item)} style={styles.btnTrash}>
                    <Ionicons name="trash-outline" size={20} color="#CBD5E1" />
                  </TouchableOpacity>
                )}
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
  headerAzul: { backgroundColor: '#005b9f', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  titlePrincipal: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  searchBar: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
    marginBottom: 15
  },
  inputBusca: { flex: 1, marginLeft: 10, fontSize: 14, color: '#1E293B' },
  barraFiltro: { 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 10 
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
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  headBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  txtHead: { fontSize: 11, fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase' },
  row: { 
    flexDirection: 'row', 
    paddingHorizontal: 15, 
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
  btnTrash: { padding: 5 }, 
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8' }
});