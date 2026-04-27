// app/admin/itens.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  FlatList, Alert, ActivityIndicator, Switch, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; 
import { supabase } from '../../src/supabase'; 
import { useAuth } from '../../src/context/AuthContext';

const COLORS = {
  background: '#FAFAFA',
  primary: '#E6A23C', 
  secondary: '#1E3A8A', 
  success: '#10B981',
  text: '#333333',
  border: '#DDDDDD',
  white: '#FFFFFF',
};

export default function ItensAdminScreen() {
  const { organizacao_id } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  const [itens, setItens] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [codigoSap, setCodigoSap] = useState('');
  const [descricao, setDescricao] = useState('');
  const [familiaId, setFamiliaId] = useState<string | null>(null);
  const [unidade, setUnidade] = useState('UN');
  const [supervisor, setSupervisor] = useState('');
  const [precoUnitario, setPrecoUnitario] = useState('0');
  
  const [usaFator, setUsaFator] = useState(false);
  const [nomeEmbalagem, setNomeEmbalagem] = useState('');
  const [fatorConversao, setFatorConversao] = useState('1');

  useEffect(() => {
    carregarDados();
  }, [organizacao_id]);

  const carregarDados = async () => {
    if (!organizacao_id) return;
    setLoading(true);
    const [resItens, resFamilias] = await Promise.all([
      supabase.from('itens').select('*').eq('organizacao_id', organizacao_id).order('descricao'),
      supabase.from('familias').select('id, nome').eq('organizacao_id', organizacao_id)
    ]);
    if (resItens.data) setItens(resItens.data);
    if (resFamilias.data) setFamilias(resFamilias.data);
    setLoading(false);
  };

  const handleSalvar = async () => {
    if (!descricao.trim() || !codigoSap.trim()) {
      return Alert.alert('Erro', 'Código e Descrição são obrigatórios.');
    }
    setSalvando(true);
    const precoTratado = parseFloat(precoUnitario.replace(',', '.'));
    const fatorTratado = parseFloat(fatorConversao.replace(',', '.'));

    const dados = {
      organizacao_id,
      codigo_sap: codigoSap.trim(),
      descricao: descricao.trim(),
      familia_id: familiaId,
      unidade_medida: unidade,
      supervisor: supervisor.trim() || null,
      preco_unitario: isNaN(precoTratado) ? 0 : precoTratado,
      usa_fator: usaFator,
      nome_embalagem: usaFator ? nomeEmbalagem.trim() : null,
      fator_conversao: usaFator ? (isNaN(fatorTratado) ? 1 : fatorTratado) : 1,
      ativo: true
    };

    try {
      if (editandoId) {
        const { error } = await supabase.from('itens').update(dados).eq('id', editandoId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('itens').insert(dados);
        if (error) throw error;
      }
      limparForm();
      carregarDados();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message);
    } finally {
      setSalvando(false);
    }
  };

  const limparForm = () => {
    setCodigoSap(''); setDescricao(''); setFamiliaId(null);
    setUnidade('UN'); setSupervisor(''); setPrecoUnitario('0');
    setUsaFator(false); setNomeEmbalagem(''); setFatorConversao('1');
    setEditandoId(null);
  };

  const iniciarEdicao = (item: any) => {
    setEditandoId(item.id);
    setCodigoSap(item.codigo_sap || '');
    setDescricao(item.descricao || '');
    setFamiliaId(item.familia_id);
    setUnidade(item.unidade_medida || 'UN');
    setSupervisor(item.supervisor || '');
    setPrecoUnitario(item.preco_unitario?.toString().replace('.', ',') || '0');
    setUsaFator(item.usa_fator || false);
    setNomeEmbalagem(item.nome_embalagem || '');
    setFatorConversao(item.fator_conversao?.toString().replace('.', ',') || '1');
  };

  const itensFiltrados = itens.filter(i => 
    i.descricao.toLowerCase().includes(filtro.toLowerCase()) || 
    i.codigo_sap?.includes(filtro)
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Gestão de Itens' }} />

        <View style={[styles.card, editandoId && { borderColor: COLORS.success, borderWidth: 2 }]}>
          <Text style={styles.cardTitle}>{editandoId ? '✏️ Editando' : '📦 Novo Item'}</Text>
          
          <View style={styles.row}>
            <TextInput 
              style={[styles.input, { flex: 2, marginRight: 8 }]} 
              placeholder="SKU / Código" 
              value={codigoSap} 
              onChangeText={setCodigoSap} 
            />
            <View style={[styles.pickerWrap, { flex: 1 }]}>
              <Picker selectedValue={unidade} onValueChange={(val) => setUnidade(val)} style={styles.picker}>
                <Picker.Item label="UN" value="UN" /><Picker.Item label="KG" value="KG" />
                <Picker.Item label="M" value="M" /><Picker.Item label="L" value="L" />
              </Picker>
            </View>
          </View>

          <TextInput style={[styles.input, { marginBottom: 8 }]} placeholder="Descrição do Material" value={descricao} onChangeText={setDescricao} />

          <View style={styles.row}>
            <TextInput style={[styles.input, { flex: 2, marginRight: 8 }]} placeholder="Responsável" value={supervisor} onChangeText={setSupervisor} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Preço R$" keyboardType="numeric" value={precoUnitario} onChangeText={setPrecoUnitario} />
          </View>

          <View style={styles.pickerWrapFull}>
            <Picker selectedValue={familiaId} onValueChange={(val) => setFamiliaId(val)}>
              <Picker.Item label="Selecione a Família" value={null} />
              {familias.map(f => <Picker.Item key={f.id} label={f.nome} value={f.id} />)}
            </Picker>
          </View>

          <View style={styles.fatorSwitchRow}>
            <Text style={styles.label}>Habilitar Fator?</Text>
            <Switch 
              value={usaFator} 
              onValueChange={setUsaFator} 
              thumbColor={usaFator ? COLORS.primary : '#f4f3f4'} 
              trackColor={{ false: '#d1d1d1', true: COLORS.secondary }}
            />
          </View>

          {usaFator && (
            <View style={styles.fatorBox}>
              <View style={styles.row}>
                <TextInput style={[styles.input, { flex: 2, marginRight: 8 }]} placeholder="Embalagem" value={nomeEmbalagem} onChangeText={setNomeEmbalagem} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Fator" keyboardType="numeric" value={fatorConversao} onChangeText={setFatorConversao} />
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={handleSalvar} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{editandoId ? 'ATUALIZAR' : 'CADASTRAR'}</Text>}
          </TouchableOpacity>
          {editandoId && (
            <TouchableOpacity onPress={limparForm} style={styles.cancelLink}>
              <Text style={styles.cancelText}>Cancelar Edição</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color="#999" />
          <TextInput style={styles.searchInput} placeholder="Filtrar materiais..." value={filtro} onChangeText={setFiltro} />
        </View>

        <FlatList
          data={itensFiltrados}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemCode}>{item.codigo_sap} • {item.supervisor || 'S/ Resp.'}</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.descricao}</Text>
              </View>
              <TouchableOpacity onPress={() => iniciarEdicao(item)} style={styles.editBtn}>
                <Ionicons name="pencil" size={14} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: COLORS.background },
  card: { 
    backgroundColor: COLORS.white, 
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 10, 
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
  },
  cardTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: COLORS.secondary },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  input: { 
    height: 40, 
    backgroundColor: '#F9FAFB', 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 6, 
    paddingHorizontal: 10, 
    fontSize: 13,
  },
  pickerWrap: { height: 40, backgroundColor: '#F3F4F6', borderRadius: 6, justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  pickerWrapFull: { height: 40, backgroundColor: '#F3F4F6', borderRadius: 6, justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  picker: { width: '100%' },
  fatorSwitchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 12, color: '#666', fontWeight: '500' },
  fatorBox: { paddingVertical: 5 },
  saveButton: { height: 44, backgroundColor: COLORS.secondary, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  cancelLink: { marginTop: 10, alignItems: 'center' },
  cancelText: { color: COLORS.danger || '#666', fontSize: 12, fontWeight: '500' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 10, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: '#EEE', height: 38 },
  searchInput: { flex: 1, height: 38, marginLeft: 5, fontSize: 13 },
  itemCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 10, borderRadius: 8, marginBottom: 6, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemInfo: { flex: 1 },
  itemCode: { fontSize: 9, color: COLORS.primary, fontWeight: 'bold', textTransform: 'uppercase' },
  itemName: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  editBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 6 }
});