import React from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { api } from '../../lib/api'
import { Colors, Spacing, BorderRadius } from '../../constants/theme'

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const percent = Math.min(100, (consumed / goal) * 100)
  const remaining = Math.max(0, goal - consumed)
  const size = 140
  const radius = 55
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (circumference * percent) / 100

  return (
    <View style={styles.ringContainer}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={StyleSheet.absoluteFillObject}>
          {/* Rendered as a simple progress indicator since SVG is complex in RN */}
          <View style={[styles.ringBg, { borderColor: Colors.border }]} />
          <View
            style={[
              styles.ringProgress,
              {
                borderColor: Colors.accent,
                transform: [{ rotate: `${-90 + (360 * percent) / 100}deg` }],
              },
            ]}
          />
        </View>
        <Text style={styles.ringCalories}>{Math.round(consumed)}</Text>
        <Text style={styles.ringLabel}>kcal</Text>
      </View>
      <View style={styles.ringStats}>
        <Text style={[styles.ringStatValue, { color: Colors.success }]}>{Math.round(remaining)}</Text>
        <Text style={styles.ringStatLabel}>remaining</Text>
      </View>
    </View>
  )
}

export default function DashboardScreen() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: todayData, isLoading, refetch } = useQuery({
    queryKey: ['meals', 'today'],
    queryFn: () => api.get('/meals').then((r) => r.data),
  })

  const { data: waterData } = useQuery({
    queryKey: ['water', 'today'],
    queryFn: () => api.get('/water/today').then((r) => r.data),
  })

  const addWater = useMutation({
    mutationFn: (amount: number) => api.post('/water', { amount }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['water', 'today'] }),
  })

  const totals = todayData?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 }
  const waterTotal = waterData?.total || 0
  const waterGoal = user?.dailyWater || 2000
  const dailyGoal = user?.dailyCalories || 2000

  const macros = [
    { label: 'Protein', value: totals.protein, goal: user?.dailyProtein || 150, color: Colors.protein, unit: 'g' },
    { label: 'Carbs', value: totals.carbs, goal: user?.dailyCarbs || 200, color: Colors.carbs, unit: 'g' },
    { label: 'Fats', value: totals.fats, goal: user?.dailyFat || 67, color: Colors.fats, unit: 'g' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning, {user?.username} 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          {user?.streak > 0 && (
            <View style={styles.streak}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>{user.streak}</Text>
            </View>
          )}
        </View>

        {/* Calorie Card */}
        <LinearGradient
          colors={['rgba(124, 77, 255, 0.15)', 'rgba(124, 77, 255, 0.05)']}
          style={styles.calorieCard}
        >
          <Text style={styles.cardLabel}>TODAY'S CALORIES</Text>
          <View style={styles.calorieRow}>
            <CalorieRing consumed={totals.calories} goal={dailyGoal} />
            <View style={styles.macros}>
              {macros.map((macro) => {
                const pct = Math.min(100, (macro.value / macro.goal) * 100)
                return (
                  <View key={macro.label} style={styles.macroRow}>
                    <Text style={[styles.macroLabel, { color: macro.color }]}>{macro.label}</Text>
                    <View style={styles.macroBarBg}>
                      <View style={[styles.macroBarFill, { width: `${pct}%`, backgroundColor: macro.color }]} />
                    </View>
                    <Text style={styles.macroValue}>{Math.round(macro.value)}/{macro.goal}g</Text>
                  </View>
                )
              })}
            </View>
          </View>
        </LinearGradient>

        {/* Water */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="water-outline" size={18} color={Colors.water} />
            <Text style={styles.cardTitle}>Water</Text>
            <Text style={styles.cardSubtitle}>{waterTotal}/{waterGoal} ml</Text>
          </View>
          <View style={styles.waterProgress}>
            <View style={[styles.waterFill, { width: `${Math.min(100, (waterTotal / waterGoal) * 100)}%` }]} />
          </View>
          <View style={styles.waterButtons}>
            {[150, 250, 350, 500].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.waterBtn}
                onPress={() => addWater.mutate(amount)}
                disabled={addWater.isPending}
              >
                <Text style={styles.waterBtnText}>+{amount}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Meals Preview */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="restaurant-outline" size={18} color={Colors.accent} />
            <Text style={styles.cardTitle}>Today's Meals</Text>
          </View>
          {todayData?.entries?.length === 0 ? (
            <Text style={styles.emptyText}>No meals logged today. Tap Food Log to start!</Text>
          ) : (
            todayData?.entries?.slice(0, 3).map((entry: any) => (
              <View key={entry.id} style={styles.mealEntry}>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{entry.food?.name || 'Unknown'}</Text>
                  <Text style={styles.mealMeta}>{entry.grams}g • {entry.mealType}</Text>
                </View>
                <Text style={styles.mealCal}>{Math.round(entry.calories)} kcal</Text>
              </View>
            ))
          )}
        </View>

        {/* Level Card */}
        <LinearGradient
          colors={[Colors.card, Colors.cardHover]}
          style={styles.card}
        >
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{user?.level || 1}</Text>
              <Text style={styles.levelLabel}>LEVEL</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Level {user?.level || 1}</Text>
              <Text style={styles.levelXp}>{user?.xp || 0} XP total</Text>
              <View style={styles.xpBar}>
                <View
                  style={[
                    styles.xpFill,
                    { width: `${(((user?.xp || 0) % 500) / 500) * 100}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: { fontSize: 18, fontWeight: '700', color: Colors.text },
  date: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  streak: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,100,0,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full },
  streakEmoji: { fontSize: 16 },
  streakText: { fontSize: 16, fontWeight: '700', color: '#ff6400', marginLeft: 4 },
  calorieCard: { margin: Spacing.md, borderRadius: BorderRadius.xl, padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(124, 77, 255, 0.2)' },
  cardLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1, marginBottom: Spacing.sm },
  calorieRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  ringContainer: { alignItems: 'center', width: 140 },
  ringBg: { width: 120, height: 120, borderRadius: 60, borderWidth: 10, position: 'absolute' },
  ringProgress: { width: 120, height: 120, borderRadius: 60, borderWidth: 10, borderColor: Colors.accent, borderRightColor: 'transparent', borderBottomColor: 'transparent', position: 'absolute' },
  ringCalories: { fontSize: 28, fontWeight: '800', color: Colors.text },
  ringLabel: { fontSize: 11, color: Colors.textSecondary },
  ringStats: { alignItems: 'center', marginTop: 6 },
  ringStatValue: { fontSize: 16, fontWeight: '700' },
  ringStatLabel: { fontSize: 10, color: Colors.textMuted },
  macros: { flex: 1, gap: 10 },
  macroRow: { gap: 4 },
  macroLabel: { fontSize: 11, fontWeight: '600' },
  macroBarBg: { height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 3 },
  macroValue: { fontSize: 10, color: Colors.textSecondary },
  card: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm, backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
  cardSubtitle: { fontSize: 12, color: Colors.textSecondary },
  waterProgress: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: Spacing.sm },
  waterFill: { height: '100%', backgroundColor: Colors.water, borderRadius: 4 },
  waterButtons: { flexDirection: 'row', gap: 8 },
  waterBtn: { flex: 1, paddingVertical: 7, backgroundColor: 'rgba(6, 182, 212, 0.1)', borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.2)' },
  waterBtnText: { fontSize: 11, color: Colors.water, fontWeight: '600' },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.md },
  mealEntry: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  mealInfo: { flex: 1 },
  mealName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  mealMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  mealCal: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  levelBadge: { width: 56, height: 56, borderRadius: 14, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  levelNumber: { fontSize: 22, fontWeight: '800', color: Colors.text },
  levelLabel: { fontSize: 8, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  levelXp: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  xpBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginTop: 8 },
  xpFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 2 },
})
