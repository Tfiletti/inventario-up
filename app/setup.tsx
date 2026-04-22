import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const HeaderSetup = ({ title }) => {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
};

export default function SetupContagem() {
  const { id, nome } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <HeaderSetup title="Setup de Inventário" />

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Família: {nome}</Text>
        <Text style={styles.subtitle}>Escolha o método de contagem:</Text>

        <TouchableOpacity style={styles.cardMetodo} onPress={() => router.push({ pathname: '/area', params: { id, nome } })}>
          <Ionicons name="map-outline" size={32} color="#F59E0B" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Por Mapa</Text>
            <Text style={styles.cardDesc}>Selecionar sala, setor ou linha física.</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cardMetodo} onPress={() => router.push({ pathname: '/itens', params: { id, nome, usaMapa: 'nao' } })}>
          <Ionicons name="location-outline" size={32} color="#005b9f" />
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Sem Mapa</Text>
            <Text style={styles.cardDesc}>Digitar local manualmente por material.</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#FFFFFF', paddingTop: 60, paddingBottom: 15, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 4 },
  headerTitle: { fontSize: 18, color: '#1F2937', fontWeight: 'bold' },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 25 },
  cardMetodo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 25, borderRadius: 12, marginBottom: 20, elevation: 4, borderLeftWidth: 4, borderLeftColor: '#E5E7EB' },
  cardText: { marginLeft: 20, flex: 1 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  cardDesc: { fontSize: 14, color: '#6B7280', marginTop: 4 },
});