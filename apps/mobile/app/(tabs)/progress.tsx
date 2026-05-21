import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { Colors, Spacing, BorderRadius } from '../../constants/theme'

export default function ProgressScreen() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [weightInput, setWeightInput] = useState(user?.weight?.toString() || '')
  const [showWeightForm, setShowWeightForm] = useState(false)

  const { data: weightData, isLoading, refetch } = useQuery({
    queryKey: ['weight'],
    queryFn: () => api.get('/weight?limit=30').then((r) => r.data),
  })

  const { data: achievementData } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get('/achievements').then((r) => r.data),
  })

  const addWeight = useMutation({
    mutationFn: (weight: number) => api.post('/weight', { weight }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight'] })
      setShowWeightForm(false)
    },
  })

  const stats = weightData?.stats
  const entries = weightData?.entries || []
  const achievements = achievementData?.achievements || []
  const unlockedAchievements = achievements.filter((a: any) => a.unlocked)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.accent} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Track your journey</Text>
        </View>

        {/* Level & Streak */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: 'rgba(124, 77, 255, 0.3)' }]}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={[styles.statValue, { color: Colors.accent }]}>Lv.{user?.level || 1}</Text>
            <Text style={styles.statLabel}>{user?.xp || 0} XP</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(255, 100, 0, 0.3)' }]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={[styles.statValue, { color: '#ff6400' }]}>{user?.streak || 0}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>{unlockedAchievements.length}</Text>
            <Text style={styles.statLabel}>achievements</Text>
          </View>
        </View>

        {/* Weight section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Weight Tracking</Text>
            <TouchableOpacity onPress={() => setShowWeightForm(!showWeightForm)}>
              <Ionicons name="add-circle" size={24} color={Colors.accent} />
            </TouchableOpacity>
          </View>

          {showWeightForm && (
            <View style={styles.weightForm}>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder="Enter weight (kg)"
                placeholderTextColor={Colors.textMuted}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                style={styles.logWeightBtn}
                onPress={() => addWeight.mutate(parseFloat(weightInput))}
                disabled={!weightInput || addWeight.isPending}
              >
                <Text style={styles.logWeightBtnText}>Log Weight</Text>
              </TouchableOpacity>
            </View>
          )}

          {stats && (
            <View style={styles.weightStats}>
              <View style={styles.weightStat}>
                <Text style={styles.weightStatValue}>{stats.current} kg</Text>
                <Text style={styles.weightStatLabel}>Current</Text>
              </View>
              <View style={styles.weightStat}>
                <Text style={[styles.weightStatValue, { color: stats.change <= 0 ? Colors.success : Colors.error }]}>
                  {stats.change > 0 ? '+' : ''}{stats.change?.toFixed(1)} kg
                </Text>
                <Text style={styles.weightStatLabel}>Change</Text>
              </View>
              <View style={styles.weightStat}>
                <Text style={styles.weightStatValue}>{stats.min} kg</Text>
                <Text style={styles.weightStatLabel}>Lowest</Text>
              </View>
            </View>
          )}

          {entries.slice(0, 5).map((entry: any) => (
            <View key={entry.id} style={styles.weightEntry}>
              <Text style={styles.weightEntryDate}>
                {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.weightEntryValue}>{entry.weight} kg</Text>
              {entry.bodyFat && <Text style={styles.weightEntryFat}>{entry.bodyFat}% BF</Text>}
            </View>
          ))}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Recent Achievements ({unlockedAchievements.length}/{achievements.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {unlockedAchievements.slice(0, 8).map((achievement: any) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <Text style={styles.achievementName} numberOfLines={2}>
                  {achievement.name.replace(/_/g, ' ')}
                </Text>
                <Text style={styles.achievementXp}>+{achievement.xp} XP</Text>
              </View>
            ))}
            {unlockedAchievements.length === 0 && (
              <View style={styles.emptyAchievements}>
                <Text style={styles.emptyText}>🔒 Log meals to unlock achievements!</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, gap: Spacing.sm, marginVertical: Spacing.sm },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.md, alignItems: 'center', borderWidth: 1 },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  section: { marginHorizontal: Spacing.md, marginBottom: Spacing.md, backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  weightForm: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  weightInput: { flex: 1, backgroundColor: Colors.bg, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: 10, color: Colors.text, borderWidth: 1, borderColor: Colors.border, fontSize: 14 },
  logWeightBtn: { backgroundColor: Colors.accent, borderRadius: BorderRadius.lg, paddingHorizontal: 16, paddingVertical: 10, justifyContent: 'center' },
  logWeightBtnText: { color: Colors.text, fontWeight: '700', fontSize: 13 },
  weightStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md },
  weightStat: { alignItems: 'center' },
  weightStatValue: { fontSize: 18, fontWeight: '800', color: Colors.text },
  weightStatLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  weightEntry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  weightEntryDate: { fontSize: 13, color: Colors.textSecondary },
  weightEntryValue: { fontSize: 15, fontWeight: '700', color: Colors.text },
  weightEntryFat: { fontSize: 12, color: Colors.textMuted },
  achievementCard: { width: 90, backgroundColor: Colors.bg, borderRadius: BorderRadius.lg, padding: 12, alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: Colors.accent + '30' },
  achievementIcon: { fontSize: 28, marginBottom: 6 },
  achievementName: { fontSize: 10, color: Colors.text, textAlign: 'center', fontWeight: '600', textTransform: 'capitalize' },
  achievementXp: { fontSize: 10, color: Colors.accent, marginTop: 4, fontWeight: '700' },
  emptyAchievements: { padding: Spacing.md },
  emptyText: { color: Colors.textSecondary, fontSize: 13 },
})
