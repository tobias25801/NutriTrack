import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../stores/authStore'
import { useRouter } from 'expo-router'
import { Colors, Spacing, BorderRadius } from '../../constants/theme'

export default function ProfileScreen() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { logout(); router.replace('/auth/login') } },
    ])
  }

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', onPress: () => {} },
    { icon: 'flag-outline', label: 'Nutrition Goals', onPress: () => {} },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => {} },
    { icon: 'cloud-download-outline', label: 'Export Data', onPress: () => {} },
    { icon: 'shield-outline', label: 'Privacy', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & FAQ', onPress: () => {} },
  ]

  const xpForNextLevel = (user?.level || 1) * 500
  const xpProgress = (user?.xp || 0) % 500
  const xpPercent = (xpProgress / 500) * 100

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar & Info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          {/* Level Badge */}
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>⭐ Level {user?.level} • {user?.xp?.toLocaleString()} XP</Text>
          </View>

          {/* XP Bar */}
          <View style={styles.xpBarContainer}>
            <View style={[styles.xpBarFill, { width: `${xpPercent}%` }]} />
          </View>
          <Text style={styles.xpLabel}>{xpProgress}/500 XP to Level {(user?.level || 1) + 1}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { icon: '🔥', label: 'Streak', value: `${user?.streak || 0} days` },
            { icon: '⚖️', label: 'Weight', value: user?.weight ? `${user.weight} kg` : '--' },
            { icon: '🎯', label: 'Goal', value: user?.dailyCalories ? `${user.dailyCalories} kcal` : '--' },
            { icon: '💪', label: 'Protein', value: user?.dailyProtein ? `${user.dailyProtein}g` : '--' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statEmoji}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={20} color={Colors.textSecondary} />
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>NutriTrack v1.0.0 • Free forever</Text>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  profileHeader: { alignItems: 'center', padding: Spacing.xl },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm, shadowColor: Colors.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  avatarText: { fontSize: 36, fontWeight: '800', color: Colors.text },
  username: { fontSize: 22, fontWeight: '800', color: Colors.text },
  email: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  levelBadge: { marginTop: Spacing.md, backgroundColor: 'rgba(124, 77, 255, 0.15)', paddingHorizontal: 16, paddingVertical: 7, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(124, 77, 255, 0.3)' },
  levelText: { fontSize: 13, color: Colors.accent, fontWeight: '700' },
  xpBarContainer: { width: '70%', height: 6, backgroundColor: Colors.border, borderRadius: 3, marginTop: Spacing.sm, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 3 },
  xpLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.md },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 17, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  menu: { marginHorizontal: Spacing.md, backgroundColor: Colors.card, borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuItemLabel: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: Spacing.md, paddingVertical: 14, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', marginBottom: Spacing.md },
  logoutText: { color: Colors.error, fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', fontSize: 11, color: Colors.textMuted, marginBottom: Spacing.md },
})
