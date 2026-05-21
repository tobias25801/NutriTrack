import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { Colors, Spacing, BorderRadius } from '../../constants/theme'

export default function LoginScreen() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')

    try {
      const { data } = await api.post('/auth/login', { email, password })
      await setAuth(data.accessToken, data.refreshToken, data.user)
      router.replace('/(tabs)')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    setEmail('demo@nutritrack.app')
    setPassword('demo123456')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email: 'demo@nutritrack.app', password: 'demo123456' })
      await setAuth(data.accessToken, data.refreshToken, data.user)
      router.replace('/(tabs)')
    } catch {
      setError('Demo login failed. Please register.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <LinearGradient colors={['rgba(124, 77, 255, 0.1)', 'transparent']} style={styles.gradientBg} />

        {/* Logo */}
        <View style={styles.logo}>
          <LinearGradient colors={[Colors.accent, '#a855f7']} style={styles.logoIcon}>
            <Ionicons name="flame" size={24} color={Colors.text} />
          </LinearGradient>
          <Text style={styles.logoText}>NutriTrack</Text>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue your journey</Text>

        {/* Form */}
        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPw}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading || !email || !password}
          >
            <LinearGradient colors={[Colors.accent, '#9c6fff']} style={styles.loginBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoBtn} onPress={handleDemo} disabled={loading}>
            <Text style={styles.demoBtnText}>Try Demo Account</Text>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.registerLink}>Sign up free</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'center' },
  gradientBg: { position: 'absolute', top: -100, left: -100, right: -100, height: 400, borderRadius: 400 },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.xl, justifyContent: 'center' },
  logoIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 28, fontWeight: '800', color: Colors.text },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  form: { gap: Spacing.md },
  errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  errorText: { color: Colors.error, fontSize: 13, textAlign: 'center' },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  loginBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginTop: 4 },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  demoBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  demoBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 14 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  registerText: { color: Colors.textSecondary, fontSize: 13 },
  registerLink: { color: Colors.accent, fontWeight: '700', fontSize: 13 },
})
