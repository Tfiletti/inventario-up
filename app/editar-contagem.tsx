import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../src/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 

export default function TelaEditarContagem() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [carregando, setCarregando] = useState(true);
  const [itemData, setItemData] = useState<any>(null);

  // Estados aceitando string/number para fluidez na digitação
  const [tubetes, setTubetes] = useState<any>(0);
  const [tara, setTara] = useState('0');
  const [laminas, setLaminas] = useState<any>(0);
  const [paletes, setPaletes] = useState<any>(0);
  const [pesoBruto, setPesoBruto] = useState('0');
  const [emLinha, setEmLinha] = useState('0');
  const [obs, setObs] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [pesoLiquido, setPesoLiquido] = useState(0);

  const formatarPeso = (valor: number) => {
    return valor.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  };

  const carregarDados = async () => {
    try {
      const { data, error } = await supabase
        .from('contagens')
        .select('*, itens(descricao)')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setItemData(data);
        const detalhes = data.detalhes_contagem || {};
        setTubetes(detalhes.tubetes || 0);
        setTara(String(detalhes.tara_tubete || '0'));
        setLaminas(detalhes.laminas || 0);
        setPaletes(detalhes.paletes || 0);
        setPesoBruto(String(data.peso_bruto || '0'));
        setEmLinha(String(data.em_linha || '0'));
        setObs(data.observacao || '');

        if (data.foto_url) {
          const { data: urlData } = supabase.storage
            .from('fotos_contagem')
            .getPublicUrl(data.foto_url);
          setFotoUrl(urlData.publicUrl);
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar:", err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregarDados(); }, [id]);

  // Matemática Protegida para strings vazias durante o delete
  useEffect(() => {
    const paraNum = (valor: any) => {
      if (valor === '' || valor === null || valor === undefined) return 0;
      return parseFloat(valor.toString().replace(',', '.')) || 0;
    };

    const bruto = paraNum(pesoBruto);
    const tUnitaria = paraNum(tara);
    const nTubetes = paraNum(tubetes);
    const nLaminas = paraNum(laminas);
    const nPaletes = paraNum(paletes);
    const somaLinha = paraNum(emLinha);

    const descTubetes = nTubetes * tUnitaria;
    const descLaminas = nLaminas * 0.4;
    const descPaletes = nPaletes * 20;

    const calculo = bruto - descTubetes - descLaminas - descPaletes + somaLinha;
    setPesoLiquido(calculo);
  }, [pesoBruto, tubetes, tara, emLinha, laminas, paletes]);

  const salvar = async () => {
    try {
      const { error } = await supabase
        .from('contagens')
        .update({
          peso_bruto: parseFloat(pesoBruto.replace(',', '.')),
          em_linha: parseFloat(emLinha.replace(',', '.')),
          peso_liquido_calculado: pesoLiquido,
          observacao: obs,
          detalhes_contagem: {
            tubetes: parseInt(tubetes) || 0,
            tara_tubete: parseFloat(tara.replace(',', '.')),
            laminas: parseInt(laminas) || 0,
            paletes: parseInt(paletes) || 0
          }
        })
        .eq('id', id);

      if (error) throw error;
      Alert.alert("Sucesso", "Alterações salvas!");
      router.back();
    } catch (err: any) {
      Alert.alert("Erro ao salvar", err.message);
    }
  };

  const excluir = () => {
    Alert.alert("🗑️ Excluir", "Deseja apagar este registro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        await supabase.from('contagens').delete().eq('id', id);
        router.back();
      }}
    ]);
  };

  if (carregando) return <ActivityIndicator size="large" color="#005b9f" style={{flex:1}} />;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}>
        <View style={styles.header}>
            <View style={styles.sapBadge}>
                <MaterialCommunityIcons name="package-variant" size={18} color="#B45309" />
                <Text style={styles.sapText}>{itemData?.item_id}</Text>
            </View>
            <TouchableOpacity onPress={excluir}>
                <Ionicons name="trash-outline" size={26} color="#EF4444" />
            </TouchableOpacity>
        </View>
        <Text style={styles.itemDesc}>{itemData?.itens?.descricao}</Text>

        <View style={styles.grid}>
          <CardStepper 
            label="N° Tubetes" 
            value={tubetes} 
            onChangeText={setTubetes}
            onAdd={() => setTubetes((p: any) => (parseInt(p) || 0) + 1)} 
            onSub={() => setTubetes((p: any) => Math.max(0, (parseInt(p) || 0) - 1))} 
          />
          <CardInput label="Tara Tubete" value={tara} onChange={setTara} color="#F59E0B" />
          
          <CardStepper 
            label="Lâminas (-0.4)" 
            value={laminas} 
            onChangeText={setLaminas}
            onAdd={() => setLaminas((p: any) => (parseInt(p) || 0) + 1)} 
            onSub={() => setLaminas((p: any) => Math.max(0, (parseInt(p) || 0) - 1))} 
          />
          
          <CardStepper 
            label="Paletes (-20)" 
            value={paletes} 
            onChangeText={setPaletes}
            onAdd={() => setPaletes((p: any) => (parseInt(p) || 0) + 1)} 
            onSub={() => setPaletes((p: any) => Math.max(0, (parseInt(p) || 0) - 1))} 
          />
          
          <CardInput label="Peso Bruto" value={pesoBruto} onChange={setPesoBruto} color="#F59E0B" />
          <CardInput label="Em Linha" value={emLinha} onChange={setEmLinha} color="#10B981" />
        </View>

        <TextInput style={styles.obsInput} placeholder="Observação..." value={obs} onChangeText={setObs} multiline />

        <View style={styles.photoContainer}>
            <Text style={styles.photoLabel}>📸 Evidência da Contagem:</Text>
            <View style={styles.photoFrame}>
                {fotoUrl ? <Image source={{ uri: fotoUrl }} style={styles.image} /> : <Text style={styles.noPhoto}>Foto não encontrada</Text>}
            </View>
        </View>

        <View style={styles.finalCard}>
            <Text style={styles.finalLabel}>Peso Líquido Final:</Text>
            <Text style={styles.finalValue}>{formatarPeso(pesoLiquido)}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), paddingTop: 15 }]}>
        <TouchableOpacity style={styles.btnCancel} onPress={() => router.back()}>
          <Text style={styles.txtCancel}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSave} onPress={salvar}>
          <Text style={styles.txtSave}>Salvar Alterações</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// COMPONENTE STEPPER HÍBRIDO (Sem Auto-Clear para Edição)
const CardStepper = ({ label, value, onAdd, onSub, onChangeText }: any) => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}:</Text>
      <View style={styles.stepper}>
          <TouchableOpacity onPress={onSub} style={styles.stepBtnContainer}><Text style={styles.stepBtn}>-</Text></TouchableOpacity>
          
          <TextInput 
            style={styles.stepInput} 
            value={String(value)} 
            onChangeText={onChangeText}
            keyboardType="numeric"
            selectTextOnFocus // Seleciona tudo ao clicar, mas não apaga sozinho
            onBlur={() => {
              if (value === '') onChangeText('0');
            }}
          />

          <TouchableOpacity onPress={onAdd} style={styles.stepBtnContainer}><Text style={styles.stepBtn}>+</Text></TouchableOpacity>
      </View>
    </View>
);

const CardInput = ({ label, value, onChange, color }: any) => (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: color }]}>
      <Text style={styles.cardLabel}>{label}:</Text>
      <TextInput 
        style={styles.cardInput} 
        value={value} 
        onChangeText={onChange} 
        keyboardType="numeric"
        selectTextOnFocus
      />
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { padding: 15, paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  sapBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E9ECEF', padding: 10, borderRadius: 12 },
  sapText: { marginLeft: 5, fontWeight: 'bold', fontSize: 18 },
  itemDesc: { fontSize: 14, color: '#6C757D', fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: '#FFF', width: '48%', padding: 15, borderRadius: 16, marginBottom: 15, elevation: 2 },
  cardLabel: { fontSize: 12, fontWeight: 'bold', color: '#6C757D', marginBottom: 10 },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F1F3F5', borderRadius: 20, padding: 2 },
  stepBtnContainer: { padding: 5, minWidth: 40, alignItems: 'center' },
  stepBtn: { fontSize: 24, fontWeight: 'bold', color: '#005b9f' },
  stepInput: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', minWidth: 40, padding: 0 },
  cardInput: { fontSize: 22, fontWeight: 'bold', textAlign: 'right', color: '#1F2937' },
  obsInput: { backgroundColor: '#FFF', padding: 15, borderRadius: 12, height: 60, marginVertical: 10, elevation: 2, textAlignVertical: 'top' },
  photoContainer: { backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginVertical: 10, elevation: 2 },
  photoLabel: { fontSize: 14, fontWeight: 'bold', color: '#4B5563', marginBottom: 10 },
  photoFrame: { height: 220, backgroundColor: '#F3F4F6', borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  noPhoto: { color: '#9CA3AF' },
  finalCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 6, borderLeftColor: '#005b9f', marginTop: 10, elevation: 4 },
  finalLabel: { fontSize: 16, fontWeight: 'bold', color: '#005b9f' },
  finalValue: { fontSize: 32, fontWeight: 'bold' },
  footer: { flexDirection: 'row', backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#DEE2E6', paddingHorizontal: 20, gap: 15 },
  btnCancel: { flex: 1, height: 55, alignItems: 'center', justifyContent: 'center' },
  btnSave: { flex: 1.5, backgroundColor: '#F59E0B', height: 55, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  txtCancel: { fontSize: 16, fontWeight: 'bold', color: '#ADB5BD' },
  txtSave: { fontSize: 16, fontWeight: 'bold', color: '#FFF' }
});