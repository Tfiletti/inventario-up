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
// 1. IMPORTAÇÃO DO INSETS PARA RESOLVER O CORTE DA TELA
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 

const COLORS = {
  background: '#FAFAFA',
  primary: '#E6A23C', 
  secondary: '#1E3A8A', 
  success: '#10B981',
  danger: '#EF4444', 
  text: '#1A202C', 
  border: '#DDDDDD',
  white: '#FFFFFF',
  placeholder: '#94A3B8', 
  inputBg: '#FFFFFF',     
};

export default function ItensAdminScreen() {
  const { organizacao_id, role } = useAuth();
  
  // 2. INICIANDO O INSETS
  const insets = useSafeAreaInsets(); 
  
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  const [itens, setItens] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [codigoErp, setCodigoErp] = useState('');
  const [descricao, setDescricao] = useState('');
  
  // 3. CORREÇÃO DO CRASH DO PICKER: Usando string vazia no lugar de null
  const [familiaId, setFamiliaId] = useState<string>(''); 
  
  const [unidade, setUnidade] = useState('UN');
  const [supervisor, setSupervisor] = useState('');
  const [precoUnitario, setPrecoUnitario] = useState('');
  
  const [usaFator, setUsaFator] = useState(false);
  const [nomeEmbalagem, setNomeEmbalagem] = useState('');
  const [fatorConversao, setFatorConversao] = useState('1');

  useEffect(() => {
    carregarDados();
  }, [organizacao_id]);

  const carregarDados = async () => {
    if (!organizacao_id) return;
    setLoading(true);
    try {
      const [resItens, resFamilias] = await Promise.all([
        supabase.from('itens').select('*').eq('organizacao_id', organizacao_id).order('descricao'),
        supabase.from('familias').select('id, nome').eq('organizacao_id', organizacao_id)
      ]);
      if (resItens.data) setItens(resItens.data);
      if (resFamilias.data) setFamilias(resFamilias.data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (!descricao.trim() || !codigoErp.trim()) {
      return Alert.alert('Erro', 'Código e Descrição são obrigatórios.');
    }
    setSalvando(true);
    
    const precoTratado = parseFloat(precoUnitario.replace(',', '.'));
    const fatorTratado = parseFloat(fatorConversao.replace(',', '.'));

    const dados = {
      organizacao_id,
      codigo_sap: codigoErp.trim(),
      descricao: descricao.trim(),
      // Transforma a string vazia de volta para nulo pro banco aceitar
      familia_id: familiaId === '' ? null : familiaId, 
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

  const handleExcluir = (id: string, nome: string) => {
    if (role !== 'ADMIN') {
        Alert.alert("Acesso Negado", "Apenas administradores podem excluir materiais do sistema.");
        return;
    }

    Alert.alert(
      'Atenção',
      `Deseja realmente excluir o material "${nome}"? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { error } = await supabase
                .from('itens')
                .delete()
                .eq('id', id)
                .eq('organizacao_id', organizacao_id);
                
              if (error) throw error;
              
              if (editandoId === id) limparForm(); 
              carregarDados();
            } catch (e: any) {
              Alert.alert('Erro ao excluir', e.message);
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const limparForm = () => {
    setCodigoErp(''); setDescricao(''); 
    setFamiliaId(''); // Limpa com string vazia para evitar crash
    setUnidade('UN'); setSupervisor(''); 
    setPrecoUnitario(''); 
    setUsaFator(false); setNomeEmbalagem(''); setFatorConversao('1');
    setEditandoId(null);
  };

  const iniciarEdicao = (item: any) => {
    setEditandoId(item.id);
    setCodigoErp(item.codigo_sap || '');
    setDescricao(item.descricao || '');
    setFamiliaId(item.familia_id || ''); // Garante string vazia se for null
    setUnidade(item.unidade_medida || 'UN');
    setSupervisor(item.supervisor || '');
    setPrecoUnitario(item.preco_unitario != null && item.preco_unitario !== 0 ? item.preco_unitario.toString().replace('.', ',') : '');
    setUsaFator(item.usa_fator || false);
    setNomeEmbalagem(item.nome_embalagem || '');
    setFatorConversao(item.fator_conversao?.toString().replace('.', ',') || '1');
  };

  const itensFiltrados = itens.filter(i => {
    const descStr = i.descricao ? String(i.descricao).toLowerCase() : '';
    const codStr = i.codigo_sap ? String(i.codigo_sap).toLowerCase() : '';
    const filtroLimpo = filtro.toLowerCase();
    return descStr.includes(filtroLimpo) || codStr.includes(filtroLimpo);
  });

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
              placeholder="Cód. Sistema / SKU" 
              placeholderTextColor={COLORS.placeholder} 
              value={codigoErp} 
              onChangeText={setCodigoErp} 
            />
            <View style={[styles.pickerWrap, { flex: 1 }]}>
              <Picker 
                selectedValue={unidade} 
                onValueChange={(val) => setUnidade(val)} 
                style={styles.picker}
              >
                <Picker.Item label="UN" value="UN" color={COLORS.text}/>
                <Picker.Item label="KG" value="KG" color={COLORS.text}/>
                <Picker.Item label="M" value="M" color={COLORS.text}/>
                <Picker.Item label="L" value="L" color={COLORS.text}/>
              </Picker>
            </View>
          </View>

          <TextInput 
            style={[styles.input, { marginBottom: 8 }]} 
            placeholder="Descrição do Material" 
            placeholderTextColor={COLORS.placeholder}
            value={descricao} 
            onChangeText={setDescricao} 
          />

          <View style={styles.row}>
            <TextInput 
              style={[styles.input, { flex: 2, marginRight: 8 }]} 
              placeholder="Responsável" 
              placeholderTextColor={COLORS.placeholder}
              value={supervisor} 
              onChangeText={setSupervisor} 
            />
            <TextInput 
              style={[styles.input, { flex: 1 }]} 
              placeholder="Preço R$" 
              placeholderTextColor={COLORS.placeholder}
              keyboardType="numeric" 
              value={precoUnitario} 
              onChangeText={setPrecoUnitario} 
            />
          </View>

          <View style={styles.pickerWrapFull}>
            <Picker selectedValue={familiaId} onValueChange={(val) => setFamiliaId(val)}>
              {/* O value aqui agora é string vazia, evitando crash no Android */}
              <Picker.Item label="Selecione a Família" value="" color={COLORS.placeholder} />
              {familias.map(f => <Picker.Item key={f.id} label={f.nome} value={f.id} color={COLORS.text} />)}
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
                <TextInput 
                  style={[styles.input, { flex: 2, marginRight: 8 }]} 
                  placeholder="Embalagem" 
                  placeholderTextColor={COLORS.placeholder}
                  value={nomeEmbalagem} 
                  onChangeText={setNomeEmbalagem} 
                />
                <TextInput 
                  style={[styles.input, { flex: 1 }]} 
                  placeholder="Fator" 
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="numeric" 
                  value={fatorConversao} 
                  onChangeText={setFatorConversao} 
                />
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
          <Ionicons name="search" size={16} color={COLORS.placeholder} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Filtrar materiais..." 
            placeholderTextColor={COLORS.placeholder}
            value={filtro} 
            onChangeText={setFiltro} 
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={itensFiltrados}
            keyExtractor={(item) => String(item.id)} // Evita crash de chave não-string
            showsVerticalScrollIndicator={false}
            // 4. AQUI ESTÁ A SOLUÇÃO DO CORTE DA LISTA!
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 120, 150) }} 
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemCode}>{String(item.codigo_sap || 'S/C')} • {String(item.supervisor || 'S/ Resp.')}</Text>
                  <Text style={styles.itemName} numberOfLines={1}>{String(item.descricao || 'Sem descrição')}</Text>
                </View>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => iniciarEdicao(item)} style={styles.editBtn}>
                    <Ionicons name="pencil" size={14} color={COLORS.secondary} />
                  </TouchableOpacity>
                  
                  {role === 'ADMIN' && (
                    <TouchableOpacity onPress={() => handleExcluir(item.id, item.descricao)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          />
        )}
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
    backgroundColor: COLORS.inputBg, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 6, 
    paddingHorizontal: 10, 
    fontSize: 13,
    color: COLORS.text, 
  },
  pickerWrap: { height: 40, backgroundColor: COLORS.inputBg, borderRadius: 6, justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  pickerWrapFull: { height: 40, backgroundColor: COLORS.inputBg, borderRadius: 6, justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  picker: { width: '100%' },
  fatorSwitchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 12, color: '#666', fontWeight: '500' },
  fatorBox: { paddingVertical: 5 },
  saveButton: { height: 44, backgroundColor: COLORS.secondary, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  cancelLink: { marginTop: 10, alignItems: 'center' },
  cancelText: { color: '#EF4444', fontSize: 12, fontWeight: '500' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, paddingHorizontal: 10, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, height: 38 },
  searchInput: { flex: 1, height: 38, marginLeft: 5, fontSize: 13, color: COLORS.text },
  
  itemCard: { flexDirection: 'row', backgroundColor: COLORS.white, padding: 10, borderRadius: 8, marginBottom: 6, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemInfo: { flex: 1, paddingRight: 10 },
  itemCode: { fontSize: 9, color: COLORS.primary, fontWeight: 'bold', textTransform: 'uppercase' },
  itemName: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  
  actionButtons: { flexDirection: 'row', gap: 6 },
  editBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 6 },
  deleteBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 6 } 
});