import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { Colors, Spacing, BorderRadius } from '../../constants/theme'

export default function RegisterScreen() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordValid = form.password.length >= 8 && /[A-Z0-9]/.test(form.password)

  const handleRegister = async () => {
    if (!form.email || !form.username || !form.password) return
    setLoading(true)
    setError('')

    try {
      const { data } = await api.post('/auth/register', form)
      await setAuth(data.accessToken, data.refreshToken, data.user)
      router.replace('/(tabs)')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['rgba(124, 77, 255, 0.1)', 'transparent']} style={styles.gradientBg} />

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.logo}>
            <LinearGradient colors={[Colors.accent, '#a855f7']} style={styles.logoIcon}>
              <Ionicons name="flame" size={24} color={Colors.text} />
            </LinearGradient>
            <Text style={styles.logoText}>NutriTrack</Text>
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your free nutrition journey today</Text>

          <View style={styles.perks}>
            {['100% Free', 'No Ads', 'AI Powered', 'No Paywalls'].map((perk) => (
              <View key={perk} style={styles.perk}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                <Text style={styles.perkText}>{perk}</Text>
              </View>
            ))}
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {[
              { label: 'Email', key: 'email', placeholder: 'you@example.com', icon: 'mail-outline', keyboard: 'email-address', autoCapitalize: 'none' },
              { label: 'Username', key: 'username', placeholder: 'cooluser123', icon: 'person-outline', autoCapitalize: 'none' },
            ].map((field) => (
              <View key={field.key} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name={field.icon as any} size={18} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={(form as any)[field.key]}
                    onChangeText={(v) => setForm({ ...form, [field.key]: v })}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType={(field.keyboard as any) || 'default'}
                    autoCapitalize={(field.autoCapitalize as any) || 'none'}
                  />
                </View>
              </View>
            ))}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={form.password}
                  onChangeText={(v) => setForm({ ...form, password: v })}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              {form.password.length > 0 && (
                <View style={styles.passwordChecks}>
                  <View style={styles.check}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={form.password.length >= 8 ? Colors.success : Colors.textMuted}
                    />
                    <Text style={[styles.checkText, { color: form.password.length >= 8 ? Colors.success : Colors.textMuted }]}>
                      At least 8 characters
                    </Text>
                  </View>
                  <View style={styles.check}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={/[A-Z0-9]/.test(form.password) ? Colors.success : Colors.textMuted}
                    />
                    <Text style={[styles.checkText, { color: /[A-Z0-9]/.test(form.password) ? Colors.success : Colors.textMuted }]}>
                      Contains number or uppercase
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, (!passwordValid || loading) && styles.registerBtnDisabled]}
              onPress={handleRegister}
              disabled={loading || !passwordValid || !form.email || !form.username}
            >
              <LinearGradient colors={[Colors.accent, '#9c6fff']} style={styles.registerBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? (
                  <ActivityIndicator color={Colors.text} />
                ) : (
                  <Text style={styles.registerBtnText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, paddingHorizontal: Spacing.xl },
  gradientBg: { position: 'absolute', top: -50, left: -100, right: -100, height: 300, borderRadius: 300 },
  backBtn: { paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.xl, justifyContent: 'center' },
  logoIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 28, fontWeight: '800', color: Colors.text },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md },
  perks: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.xl },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  perkText: { fontSize: 12, color: Colors.textSecondary },
  form: { gap: Spacing.md },
  errorBox: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  errorText: { color: Colors.error, fontSize: 13, textAlign: 'center' },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.text, fontSize: 14, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  passwordChecks: { gap: 4, marginTop: 6 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkText: { fontSize: 11 },
  registerBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginTop: 4 },
  registerBtnDisabled: { opacity: 0.5 },
  registerBtnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  registerBtnText: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  loginText: { color: Colors.textSecondary, fontSize: 13 },
  loginLink: { color: Colors.accent, fontWeight: '700', fontSize: 13 },
})
