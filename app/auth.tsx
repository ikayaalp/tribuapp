import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authApi } from '../services/api/auth';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Custom Input Component
// ─────────────────────────────────────────────
function AuthInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2A2A2A', '#1DB954'],
  });

  return (
    <Animated.View style={[styles.inputWrapper, { borderColor }]}>
      <Ionicons name={icon as any} size={20} color={focused ? '#1DB954' : '#555'} style={styles.inputIcon} />
      <TextInput
        style={styles.inputField}
        placeholder={placeholder}
        placeholderTextColor="#555"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showPass}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
          <Ionicons name={showPass ? 'eye' : 'eye-off'} size={20} color="#555" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function AuthScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Animations
  const tabAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // If the user logs in, auth state will update and we can redirect to tabs
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user, router]);

  useEffect(() => {
    Animated.stagger(150, [
      Animated.spring(logoAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.spring(formAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.spring(tabAnim, {
      toValue: isLogin ? 0 : 1,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  }, [isLogin]);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }
    if (!isLogin) {
      if (!displayName.trim()) {
        Alert.alert('Eksik Bilgi', 'Lütfen adınızı girin.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Hata', 'Şifreler eşleşmiyor.');
        return;
      }
      if (password.length < 8) {
        Alert.alert('Hata', 'Şifre en az 8 karakter uzunluğunda olmalıdır.');
        return;
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
        Alert.alert('Hata', 'Şifre en az bir büyük ve bir küçük harf içermelidir.');
        return;
      }
    }
    setAuthLoading(true);
    try {
      if (isLogin) {
        await authApi.login(email.trim(), password);
      } else {
        await authApi.register(email.trim(), password, displayName.trim());
      }
      // On success, useEffect with `user` will handle the redirect
    } catch (error: any) {
      const msg = error.code === 'auth/invalid-credential'
        ? 'E-posta veya şifre hatalı.'
        : error.code === 'auth/email-already-in-use'
        ? 'Bu e-posta zaten kayıtlı.'
        : error.code === 'auth/weak-password'
        ? 'Şifre en az 6 karakter olmalı.'
        : error.message;
      Alert.alert('Hata', msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const tabTranslate = tabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, (width - 64) / 2] });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.authRoot}
    >
      <StatusBar barStyle="light-content" />

      {/* Background decorative circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <ScrollView
        contentContainerStyle={styles.authScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo & Branding */}
        <Animated.View style={[styles.logoArea, {
          opacity: logoAnim,
          transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }]
        }]}>
          <View style={styles.logoCircle}>
            <Ionicons name="stats-chart" size={36} color="#1DB954" />
          </View>
          <Text style={styles.brandName}>BetAnaliz</Text>
          <Text style={styles.brandTagline}>Akıllı Tahmin · Doğru Analiz</Text>
        </Animated.View>

        {/* Card */}
        <Animated.View style={[styles.authCard, {
          opacity: cardAnim,
          transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }]
        }]}>
          {/* Tab Switcher */}
          <View style={styles.tabBar}>
            <Animated.View style={[styles.tabIndicator, { transform: [{ translateX: tabTranslate }] }]} />
            <TouchableOpacity style={styles.tabBtn} onPress={() => setIsLogin(true)}>
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Giriş Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabBtn} onPress={() => setIsLogin(false)}>
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <Animated.View style={{ opacity: formAnim }}>
            {!isLogin && (
              <AuthInput
                icon="person-outline"
                placeholder="Ad Soyad"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            )}
            <AuthInput
              icon="mail-outline"
              placeholder="E-posta Adresi"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <AuthInput
              icon="lock-closed-outline"
              placeholder="Şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {!isLogin && (
              <AuthInput
                icon="lock-closed-outline"
                placeholder="Şifreyi Onayla"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            )}

            {isLogin && (
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Şifremi Unuttum</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, authLoading && { opacity: 0.7 }]}
              onPress={handleAuth}
              disabled={authLoading}
              activeOpacity={0.85}
            >
              {authLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>{isLogin ? 'Giriş Yap' : 'Hesap Oluştur'}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#000" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Switch mode */}
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
              <Text style={styles.switchText}>
                {isLogin ? 'Hesabınız yok mu? ' : 'Zaten üye misiniz? '}
                <Text style={styles.switchAccent}>{isLogin ? 'Kayıt Olun' : 'Giriş Yapın'}</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Footer */}
        <Text style={styles.authFooter}>Giriş yaparak Kullanım Koşulları'nı kabul etmiş olursunuz.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Auth Root ──
  authRoot: { flex: 1, backgroundColor: '#080808' },
  authScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 },

  bgCircle1: {
    position: 'absolute', width: 350, height: 350, borderRadius: 175,
    backgroundColor: 'rgba(29,185,84,0.06)', top: -80, right: -80,
  },
  bgCircle2: {
    position: 'absolute', width: 250, height: 250, borderRadius: 125,
    backgroundColor: 'rgba(29,185,84,0.04)', bottom: -60, left: -60,
  },

  // ── Logo ──
  logoArea: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(29,185,84,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(29,185,84,0.25)',
  },
  brandName: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  brandTagline: { fontSize: 13, color: '#555', marginTop: 4, letterSpacing: 0.8 },

  // ── Card ──
  authCard: {
    backgroundColor: '#111111',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },

  // ── Tab Bar ──
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 4,
    marginBottom: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4, left: 4, bottom: 4,
    width: (width - 64 - 8) / 2,
    backgroundColor: '#1DB954',
    borderRadius: 11,
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', zIndex: 1 },
  tabText: { fontSize: 15, fontWeight: '600', color: '#555' },
  tabTextActive: { color: '#000' },

  // ── Inputs ──
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#161616',
    borderRadius: 14, borderWidth: 1.5,
    marginBottom: 14, paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: { marginRight: 12 },
  inputField: { flex: 1, color: '#FFF', fontSize: 16 },
  eyeBtn: { padding: 4 },

  // ── Forgot ──
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -6 },
  forgotText: { color: '#1DB954', fontSize: 13, fontWeight: '500' },

  // ── Submit ──
  submitBtn: {
    backgroundColor: '#1DB954', borderRadius: 14, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnText: { color: '#000', fontSize: 17, fontWeight: '700' },

  // ── Divider ──
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#222' },
  dividerText: { color: '#444', fontSize: 13, marginHorizontal: 12 },

  // ── Switch mode ──
  switchBtn: { alignItems: 'center' },
  switchText: { color: '#666', fontSize: 14 },
  switchAccent: { color: '#1DB954', fontWeight: '700' },

  // ── Footer ──
  authFooter: { textAlign: 'center', color: '#333', fontSize: 11, marginTop: 24, lineHeight: 16 },
});
