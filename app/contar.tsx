import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, StatusBar, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import InputSpinner from 'react-native-input-spinner';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context'; // Importação essencial para o rodapé

// Usando o caminho 'legacy' para aceitar o readAsStringAsync
import * as FileSystem from 'expo-file-system/legacy'; 

import { Buffer } from 'buffer';
import { supabase } from '../src/supabase';

const HeaderContagem = () => {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#1F2937" /></TouchableOpacity>
      <View style={styles.logoSC}><Text style={styles.logoSCText}>SC</Text></View>
      <Text style={styles.headerTitle}>Formulário de Contagem</Text>
      <View style={{ width: 24 }} />
    </View>
  );
};

export default function TelaDeContagem() {
  const params = useLocalSearchParams(); 
  const router = useRouter();
  const cameraRef = useRef(null);
  
  const [localSelecionadoId, setLocalSelecionadoId] = useState(null);
  const [localSelecionadoNome, setLocalSelecionadoNome] = useState('');
  const [modalLocalVisivel, setModalLocalVisivel] = useState(false);
  const [modalCameraVisivel, setModalCameraVisivel] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [carregando, setCarregando] = useState(false);
  const [areasBd, setAreasBd] = useState([]);

  const [numTubetes, setNumTubetes] = useState(0);
  const [taraTubete, setTaraTubete] = useState('0');
  const [numLaminas, setNumLaminas] = useState(0);
  const [numPaletes, setNumPaletes] = useState(1);
  const [pesoBruto, setPesoBruto] = useState('0');
  const [pesoEmLinha, setPesoEmLinha] = useState('0');
  const [pesoLiquido, setPesoLiquido] = useState('0,00');
  const [observacao, setObservacao] = useState('');
  const [fotoUri, setFotoUri] = useState(null);

  useEffect(() => {
    async function buscarAreas() {
      const { data } = await supabase.from('areas').select('*').order('nome');
      if (data) setAreasBd(data);
    }
    buscarAreas();
  }, []);

  useEffect(() => {
    const paraNum = (valor) => parseFloat(valor.toString().replace(',', '.')) || 0;
    const bruto = paraNum(pesoBruto);
    const emLinha = paraNum(pesoEmLinha);
    const taraUnitaria = paraNum(taraTubete);
    const descontoTaras = (numTubetes * taraUnitaria) + (numLaminas * 0.40) + (numPaletes * 20.00);
    let saldoBalanca = Math.max(0, bruto - descontoTaras);
    const resultado = saldoBalanca + emLinha;
    setPesoLiquido(resultado.toFixed(2).replace('.', ','));
  }, [numTubetes, taraTubete, numLaminas, numPaletes, pesoBruto, pesoEmLinha]);

  const abrirCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Atenção", "Autorize a câmera nas configurações.");
        return;
      }
    }
    setModalCameraVisivel(true);
  };

  const tirarFoto = async () => {
    if (cameraRef.current) {
      try {
        const foto = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        setFotoUri(foto.uri);
        setModalCameraVisivel(false);
      } catch (e) {
        Alert.alert("Erro", e.message);
      }
    }
  };

  const salvarRegistro = async () => {
    const idFinal = params.areaId || localSelecionadoId;
    if (!idFinal) { Alert.alert("Atenção", "Selecione o local."); return; }
    
    setCarregando(true);
    try {
      let nomeArquivoFoto = null;

      if (fotoUri) {
        const base64 = await FileSystem.readAsStringAsync(fotoUri, { 
          encoding: 'base64' 
        });
        
        nomeArquivoFoto = `foto_${Date.now()}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('fotos_contagem')
          .upload(nomeArquivoFoto, Buffer.from(base64, 'base64'), {
            contentType: 'image/jpeg'
          });

        if (uploadError) throw uploadError;
      }

      const { error } = await supabase.from('contagens').insert([{
        item_id: params.itemId,
        area_id: idFinal, 
        peso_bruto: parseFloat(pesoBruto.replace(',', '.')) || 0,
        em_linha: parseFloat(pesoEmLinha.replace(',', '.')) || 0,
        peso_liquido_calculado: parseFloat(pesoLiquido.replace(',', '.')),
        observacao: observacao,
        foto_url: nomeArquivoFoto,
        detalhes_contagem: {
          tubetes: numTubetes,
          tara_tubete: parseFloat(taraTubete.replace(',', '.')),
          laminas: numLaminas,
          paletes: numPaletes
        }
      }]);

      if (error) throw error;
      Alert.alert("Sucesso", "Contagem registrada!");
      router.back();
    } catch (err) {
      Alert.alert("Erro no salvamento", err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <HeaderContagem />
      
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.infoBox}>
          {params.areaNome ? (
            <Text style={styles.infoLocal}>📍 {params.areaNome}</Text>
          ) : (
            <TouchableOpacity style={styles.inputLocalContainer} onPress={() => setModalLocalVisivel(true)}>
              <Text style={localSelecionadoNome ? styles.inputTextSelected : styles.inputTextPlaceholder}>
                📍 {localSelecionadoNome || "Selecionar Local..."}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.infoMaterial}>📦 {params.codigo}</Text>
        </View>

        <View style={styles.rowDupla}>
          <View style={styles.colunaSpinner}>
            <Text style={styles.label}>Nº Tubetes:</Text>
            <InputSpinner max={500} min={0} step={1} skin="clean" value={numTubetes} onChange={setNumTubetes} width={110} color="#005b9f" />
          </View>
          <View style={styles.colunaInput}>
            <Text style={styles.labelInput}>Tara Tubete:</Text>
            <TextInput style={styles.inputCompacto} keyboardType="numeric" value={taraTubete} onChangeText={setTaraTubete} selectTextOnFocus />
          </View>
        </View>

        <View style={styles.rowDupla}>
          <View style={styles.colunaSpinner}>
            <Text style={styles.label}>Lâminas:</Text>
            <InputSpinner max={200} min={0} step={1} skin="clean" value={numLaminas} onChange={setNumLaminas} width={110} color="#005b9f" />
          </View>
          <View style={styles.colunaSpinner}>
            <Text style={styles.label}>Paletes:</Text>
            <InputSpinner max={10} min={0} step={1} skin="clean" value={numPaletes} onChange={setNumPaletes} width={110} color="#005b9f" />
          </View>
        </View>

        <View style={styles.rowDupla}>
          <View style={styles.colunaPesoBruto}>
            <Text style={styles.labelInput}>Peso Bruto:</Text>
            <TextInput style={styles.inputGigante} keyboardType="numeric" value={pesoBruto} onChangeText={setPesoBruto} selectTextOnFocus />
          </View>
          <View style={styles.colunaEmLinha}>
            <Text style={styles.labelInput}>Em Linha:</Text>
            <TextInput style={styles.inputGigante} keyboardType="numeric" value={pesoEmLinha} onChangeText={setPesoEmLinha} selectTextOnFocus />
          </View>
        </View>

        <View style={styles.obsContainer}>
          <TextInput style={styles.inputObs} placeholder="Observação..." value={observacao} onChangeText={setObservacao} />
          <TouchableOpacity style={[styles.btnFoto, fotoUri && styles.btnFotoAtivo]} onPress={abrirCamera}>
            <Ionicons name={fotoUri ? "checkmark-circle" : "camera-outline"} size={28} color={fotoUri ? "#10B981" : "#6B7280"} />
          </TouchableOpacity>
        </View>

        <View style={styles.rowFinal}>
          <Text style={styles.labelFinal}>Peso Líquido Final:</Text>
          <Text style={styles.valorLiquido}>{pesoLiquido}</Text>
        </View>
      </ScrollView>

      {/* RODAPÉ PROTEGIDO PELO SAFEAREAVIEW */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {carregando ? (
          <ActivityIndicator size="large" color="#F59E0B" style={{ flex: 1 }} />
        ) : (
          <>
            <TouchableOpacity style={styles.btnCancel} onPress={() => router.back()}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnSave} onPress={salvarRegistro}>
              <Text style={styles.btnSaveText}>Salvar Contagem</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>

      {/* MODAIS */}
      <Modal visible={modalCameraVisivel} animationType="slide">
        <CameraView style={{ flex: 1 }} ref={cameraRef} active={modalCameraVisivel}>
          <View style={styles.cameraOverlay}>
            <TouchableOpacity onPress={() => setModalCameraVisivel(false)} style={styles.btnFecharCam}><Ionicons name="close" size={40} color="#FFF" /></TouchableOpacity>
            <TouchableOpacity style={styles.btnCapturar} onPress={tirarFoto}><View style={styles.circuloExterno}><View style={styles.circuloInterno} /></View></TouchableOpacity>
          </View>
        </CameraView>
      </Modal>

      <Modal visible={modalLocalVisivel} transparent animationType="slide">
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Localização</Text>
          <FlatList data={areasBd} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => (
            <TouchableOpacity style={styles.modalItem} onPress={() => { setLocalSelecionadoNome(item.nome); setLocalSelecionadoId(item.id); setModalLocalVisivel(false); }}><Text style={styles.modalItemText}>{item.nome}</Text></TouchableOpacity>
          )} />
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalLocalVisivel(false)}><Text style={styles.modalCloseText}>Fechar</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { backgroundColor: '#FFFFFF', paddingTop: 60, paddingBottom: 15, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 4 },
  headerTitle: { fontSize: 16, color: '#F59E0B', fontWeight: 'bold' },
  logoSC: { width: 30, height: 30, backgroundColor: '#F59E0B', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  logoSCText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  scrollContent: { padding: 12 },
  infoBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E5E7EB', padding: 10, borderRadius: 8, marginBottom: 10 },
  infoLocal: { fontSize: 13, fontWeight: 'bold', color: '#4B5563', flex: 1 },
  infoMaterial: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  inputLocalContainer: { flex: 1 },
  inputTextSelected: { fontSize: 13, fontWeight: 'bold', color: '#005b9f' },
  inputTextPlaceholder: { fontSize: 13, color: '#9CA3AF' },
  rowDupla: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  colunaSpinner: { flex: 1.2, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, marginHorizontal: 3, alignItems: 'center' },
  label: { fontSize: 12, color: '#6B7280', fontWeight: 'bold', marginBottom: 5, alignSelf: 'flex-start' },
  colunaInput: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, marginHorizontal: 3, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  colunaPesoBruto: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, marginHorizontal: 3, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  colunaEmLinha: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, marginHorizontal: 3, borderLeftWidth: 4, borderLeftColor: '#10B981' },
  labelInput: { fontSize: 12, color: '#6B7280', fontWeight: 'bold', marginBottom: 3 },
  inputCompacto: { fontSize: 18, fontWeight: 'bold', color: '#F59E0B', textAlign: 'right' },
  inputGigante: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', textAlign: 'right' },
  obsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, marginBottom: 8, marginHorizontal: 3 },
  inputObs: { flex: 1, fontSize: 14, height: 40 },
  btnFoto: { padding: 5, marginLeft: 10 },
  btnFotoAtivo: { backgroundColor: '#D1FAE5', borderRadius: 20 },
  rowFinal: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 10, borderLeftWidth: 6, borderLeftColor: '#005b9f', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 3 },
  labelFinal: { fontSize: 14, color: '#005b9f', fontWeight: 'bold' },
  valorLiquido: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
  
  // ESTILO DO FOOTER CORRIGIDO
  footer: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: '#E5E7EB', 
    backgroundColor: '#FFF', 
    paddingTop: 12,
    paddingBottom: 8, 
    paddingHorizontal: 15,
    alignItems: 'center'
  },
  btnCancel: { 
    flex: 1, 
    height: 50, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  btnCancelText: { fontSize: 16, color: '#6B7280' },
  btnSave: { 
    flex: 1.5, 
    height: 50, 
    backgroundColor: '#F59E0B', 
    borderRadius: 10, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  btnSaveText: { fontSize: 18, color: '#FFF', fontWeight: 'bold' },

  cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 30 },
  btnFecharCam: { alignSelf: 'flex-end', marginTop: 20 },
  btnCapturar: { alignSelf: 'center', marginBottom: 20 },
  circuloExterno: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  circuloInterno: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalItemText: { fontSize: 16, textAlign: 'center' },
  modalCloseBtn: { marginTop: 10, padding: 15, alignItems: 'center' },
  modalCloseText: { color: '#EF4444', fontWeight: 'bold' }
});