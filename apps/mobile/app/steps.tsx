import { useState } from 'react'
import {
  Alert, Dimensions, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useAuthStore } from '../stores/authStore'
import { api } from '../lib/api'
import { Colors, Spacing, BorderRadius } from '../constants/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

function ProgressRing({
  steps, goal, size = 180, stroke = 14,
}: {
  steps: number; goal: number; size?: number; stroke?: number
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(steps / goal, 1)
  const offset = circ * (1 - pct)
  const color = steps >= goal ? '#22c55e' : Colors.accent

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <G>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="#1e2130" strokeWidth={stroke} fill="none" />
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
            strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset} strokeLinecap="round" />
        </G>
      </Svg>
      <Text style={{ fontSize: 30, fontWeight: '800', color, fontVariant: ['tabular-nums'] }}>
        {steps.toLocaleString()}
      </Text>
      <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>
        / {goal.toLocaleString()} steps
      </Text>
      <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 1 }}>
        {Math.round(pct * 100)}%
      </Text>
    </View>
  )
}

function BarChart({ data, goal }: { data: { date: string; steps: number }[]; goal: number }) {
  const chartW = SCREEN_WIDTH - Spacing.md * 2 - 32
  const chartH = 100
  const maxVal = Math.max(...data.map((d) => d.steps), goal, 1)
  const barW = Math.max((chartW - (data.length - 1) * 4) / data.length, 4)

  return (
    <Svg width={chartW} height={chartH + 16}>
      {data.map((d, i) => {
        const h = Math.max((d.steps / maxVal) * chartH, 2)
        const x = i * (barW + 4)
        const y = chartH - h
        const color = d.steps >= goal ? '#22c55e' : Colors.accent
        const dayLetter = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)
        return (
          <G key={d.date}>
            <Rect x={x} y={y} width={barW} height={h} fill={color} rx={3} opacity={0.85} />
            <SvgText x={x + barW / 2} y={chartH + 12} textAnchor="middle" fill={Colors.textMuted} fontSize={9}>
              {dayLetter}
            </SvgText>
          </G>
        )
      })}
    </Svg>
  )
}

export default function StepsScreen() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [period, setPeriod] = useState<7 | 30>(7)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [goalInput, setGoalInput] = useState(String(user?.dailySteps || 10000))
  const [stepInput, setStepInput] = useState('')

  const { data: todayData } = useQuery({
    queryKey: ['steps', 'today'],
    queryFn: () => api.get('/steps/today').then((r) => r.data),
  })

  const { data: historyData } = useQuery({
    queryKey: ['steps', 'history', period],
    queryFn: () => api.get(`/steps/history?days=${period}`).then((r) => r.data),
  })

  const logSteps = useMutation({
    mutationFn: (steps: number) => api.post('/steps', { steps }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steps'] })
      setStepInput('')
    },
    onError: () => Alert.alert('Error', 'Failed to log steps'),
  })

  const updateGoal = useMutation({
    mutationFn: (dailySteps: number) => api.put('/auth/me', { dailySteps }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['steps'] })
      setShowGoalModal(false)
      Alert.alert('Goal updated!', `Your daily step goal is now ${parseInt(goalInput).toLocaleString()} steps.`)
    },
    onError: () => Alert.alert('Error', 'Failed to update goal'),
  })

  const steps = todayData?.steps ?? 0
  const goal = todayData?.goal ?? user?.dailySteps ?? 10000
  const entries: { date: string; steps: number }[] = historyData?.entries ?? []
  const hStats = historyData?.stats ?? {}

  const chartData = entries.slice(-7).map((e) => ({
    date: String(e.date).split('T')[0],
    steps: e.steps,
  }))

  const QUICK_VALUES = [2000, 5000, 8000, 10000, 12000, 15000]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Step Tracking</Text>
          <TouchableOpacity onPress={() => { setGoalInput(String(goal)); setShowGoalModal(true) }} style={styles.goalBtn}>
            <Ionicons name="settings-outline" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Today ring + log */}
        <View style={styles.todayCard}>
          <ProgressRing steps={steps} goal={goal} size={180} stroke={14} />

          {steps >= goal && (
            <View style={styles.goalBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
              <Text style={styles.goalBadgeText}>Daily goal reached!</Text>
            </View>
          )}

          {/* Quick log */}
          <View style={styles.quickLog}>
            <Text style={styles.quickLogTitle}>Log Steps</Text>
            <View style={styles.quickBtns}>
              {QUICK_VALUES.map((v) => (
                <TouchableOpacity key={v} onPress={() => logSteps.mutate(v)}
                  disabled={logSteps.isPending} style={styles.quickBtn}>
                  <Text style={styles.quickBtnText}>{v >= 1000 ? `${v / 1000}k` : v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customInput}>
              <TextInput
                value={stepInput}
                onChangeText={setStepInput}
                keyboardType="number-pad"
                placeholder="Custom amount..."
                placeholderTextColor={Colors.textMuted}
                style={styles.input}
              />
              <TouchableOpacity
                onPress={() => { const v = parseInt(stepInput); if (v > 0) logSteps.mutate(v) }}
                disabled={!stepInput || logSteps.isPending}
                style={[styles.logBtn, (!stepInput || logSteps.isPending) && { opacity: 0.4 }]}>
                <Text style={styles.logBtnText}>Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Steps', value: hStats.totalSteps?.toLocaleString() ?? '—', color: Colors.accent },
            { label: 'Daily Avg', value: hStats.avgSteps ? Math.round(hStats.avgSteps).toLocaleString() : '—', color: '#a78bfa' },
            { label: 'Goals Hit', value: hStats.goalsHit != null ? `${hStats.goalsHit}/${entries.length}` : '—', color: '#22c55e' },
            { label: 'Best Day', value: hStats.bestDay?.toLocaleString() ?? '—', color: '#f59e0b' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Daily Steps</Text>
            <View style={styles.periodToggle}>
              {([7, 30] as const).map((p) => (
                <TouchableOpacity key={p} onPress={() => setPeriod(p)}
                  style={[styles.periodBtn, period === p && styles.periodBtnActive]}>
                  <Text style={[styles.periodBtnText, period === p && { color: Colors.text }]}>{p}d</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {chartData.length > 0 ? (
            <View style={{ paddingTop: 8 }}>
              <BarChart data={chartData} goal={goal} />
            </View>
          ) : (
            <Text style={styles.emptyText}>No step data yet. Start logging!</Text>
          )}
        </View>

        {/* History */}
        {entries.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>History</Text>
            {entries.slice(0, 14).map((entry: any, i: number) => {
              const dateStr = String(entry.date).split('T')[0]
              const pct = Math.min(100, Math.round((entry.steps / goal) * 100))
              const achieved = entry.steps >= goal
              return (
                <View key={dateStr + i} style={styles.historyRow}>
                  <View style={[styles.historyDot, { backgroundColor: achieved ? '#22c55e' : Colors.border }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDate}>{dateStr}</Text>
                    <View style={styles.historyBar}>
                      <View style={[styles.historyBarFill, {
                        width: `${pct}%`,
                        backgroundColor: achieved ? '#22c55e' : Colors.accent,
                      }]} />
                    </View>
                  </View>
                  <Text style={[styles.historySteps, { color: achieved ? '#22c55e' : Colors.text }]}>
                    {entry.steps.toLocaleString()}
                  </Text>
                </View>
              )
            })}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Goal edit modal */}
      <Modal visible={showGoalModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowGoalModal(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Daily Step Goal</Text>
            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="number-pad"
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setShowGoalModal(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { const v = parseInt(goalInput); if (v > 0) updateGoal.mutate(v) }}
                disabled={!goalInput || updateGoal.isPending}
                style={[styles.modalSaveBtn, (!goalInput || updateGoal.isPending) && { opacity: 0.5 }]}>
                <Text style={styles.modalSaveText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
  goalBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  todayCard: {
    marginHorizontal: Spacing.md, backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.sm,
  },
  goalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.1)', borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)', borderRadius: BorderRadius.full,
    paddingHorizontal: 12, paddingVertical: 5, marginTop: Spacing.sm,
  },
  goalBadgeText: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  quickLog: { width: '100%', marginTop: Spacing.md },
  quickLogTitle: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  quickBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 },
  quickBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: Colors.bg, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  quickBtnText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  customInput: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 8,
    color: Colors.text, fontSize: 13,
  },
  logBtn: {
    backgroundColor: Colors.accent, borderRadius: BorderRadius.md,
    paddingHorizontal: 20, justifyContent: 'center',
  },
  logBtnText: { color: Colors.text, fontWeight: '700', fontSize: 14 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  statCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 10) / 2,
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  chartCard: {
    marginHorizontal: Spacing.md, backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  periodToggle: { flexDirection: 'row', backgroundColor: Colors.bg, borderRadius: 8, padding: 2 },
  periodBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  periodBtnActive: { backgroundColor: Colors.accent },
  periodBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.md },
  historySection: { paddingHorizontal: Spacing.md },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: Colors.border + '60',
  },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyDate: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  historyBar: { height: 5, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' },
  historyBarFill: { height: '100%', borderRadius: 3 },
  historySteps: { fontSize: 14, fontWeight: '700', minWidth: 60, textAlign: 'right' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.xl, paddingBottom: 40, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  modalInput: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.lg, paddingHorizontal: 16, paddingVertical: 12,
    color: Colors.text, fontSize: 18, fontWeight: '600', textAlign: 'center',
    marginBottom: Spacing.md,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  modalSaveBtn: {
    flex: 2, paddingVertical: 13, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.accent, alignItems: 'center',
  },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: Colors.text },
})
