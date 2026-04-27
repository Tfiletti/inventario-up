// app/(auth)/login.tsx - ATUALIZADO (Links Essenciais)
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Image, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { supabase } from '../../src/supabase'; // AJUSTE O CAMINHO
import { useRouter, Link } from 'expo-router'; // Importou 'Link'

// Cores Corporativas da vibe image_9.png / image_19.png / image_21.png
const COLORS = {
  background: '#FAFAFA',
  industrialOrange: '#E6A23C',
  techBlue: '#1E3A8A',
  black: '#333333',
  gray: '#666666',
  white: '#FFFFFF',
  border: '#DDDDDD',
  textSubtle: '#888888', // Nova cor sutil
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Erro de Login', error.message);
      setEmail(''); // Limpa email pra UX casca grossa
      setPassword(''); // Limpa senha
      setLoading(false);
    } else {
      console.log('Login efetuado com sucesso no Smart Count SaaS!');
    }
  }

  // Funções de navegação (Comentadas até criarmos as telas)
  const handleForgotPassword = () => {
    Alert.alert('Aviso', 'Fluxo de recuperação de senha será implementado em breve.');
    // router.push('/(auth)/forgot-password');
  };

  const handleSignUp = () => {
    Alert.alert('Aviso', 'Fluxo de cadastro será implementado em breve.');
    // router.push('/(auth)/register');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.container}>
          
          {/* LOGO UNIFICADA E EMPILHADA */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/sc_icon.png')} // AJUSTE O CAMINHO
              style={styles.logoIcon} 
              resizeMode="contain"
            />
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoTextSmart}>SMART</Text>
              <Text style={styles.logoTextCount}>COUNT</Text>
            </View>
          </View>
          
          <Text style={styles.title}>BEM-VINDO</Text>
          <Text style={styles.subtitle}>Faça login para acessar seu inventário</Text>

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor={COLORS.gray}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={COLORS.gray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
          />

          {/* 🔗 LINK: Esqueci minha senha (Sutil e Azul Tech) */}
          <TouchableOpacity style={styles.forgotPasswordContainer} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button} 
            onPress={signInWithEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>ENTRAR</Text>
            )}
          </TouchableOpacity>

          {/* 🔗 LINK: Cadastre-se (Integrado no final) */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Não tem uma conta?</Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signUpLinkText}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Blindagem SaaS Multi-tenant Ativada</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    width: 90,
    height: 90,
    marginBottom: 20,
  },
  logoTextContainer: {
    alignItems: 'center',
  },
  logoTextSmart: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.industrialOrange,
    textAlign: 'center',
  },
  logoTextCount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.techBlue,
    textAlign: 'center',
    marginTop: -2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 35,
  },
  input: {
    height: 55,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: COLORS.black,
  },
  
  // NOVOS ESTILOS PARA OS LINKS
  forgotPasswordContainer: {
    alignSelf: 'flex-end', // Alinha à direita, embaixo da senha
    marginBottom: 20,
    marginTop: -5,        // Ajuste sutil para colar na senha
  },
  forgotPasswordText: {
    color: COLORS.techBlue, // Azul Tech (segurança/corp)
    fontSize: 14,
    fontWeight: '500',
  },
  
  signUpContainer: {
    flexDirection: 'row', // Exibe lado a lado
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 20,     // Espaço antes do footer
  },
  signUpText: {
    color: COLORS.textSubtle, // Cor sutil
    fontSize: 15,
  },
  signUpLinkText: {
    color: COLORS.industrialOrange, // Laranja Industrial (ação/dinamismo)
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 5,        // Pequeno espaço entre os textos
  },
  // FIM DOS NOVOS ESTILOS

  button: {
    height: 55,
    backgroundColor: COLORS.industrialOrange,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 12,
  },
});