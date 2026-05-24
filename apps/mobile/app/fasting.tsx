import { useEffect, useRef, useState } from 'react'
import {
  Alert, Dimensions, FlatList, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Circle, G } from 'react-native-svg'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { api } from '../lib/api'
import { Colors, Spacing, BorderRadius } from '../constants/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const PRESETS = [
  { label: '12:12', hours: 12, desc: 'Beginner' },
  { label: '16:8', hours: 16, desc: 'Popular' },
  { label: '18:6', hours: 18, desc: 'Intermediate' },
  { label: '20:4', hours: 20, desc: 'Advanced' },
  { label: '24h', hours: 24, desc: 'Extended' },
  { label: '36h', hours: 36, desc: 'Extreme' },
]

function formatTimer(ms: number) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatHours(ms: number) {
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return `${h}h ${m}m`
}

function CircularProgress({
  pct, size = 220, stroke = 16, elapsed, target,
}: {
  pct: number; size?: number; stroke?: number; elapsed: number; target: number
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct / 100, 1))
  const color = pct >= 100 ? '#22c55e' : '#f97316'

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <G>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="#1e2130" strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={color} strokeWidth={stroke} fill="none"
            strokeDasharray={`${circ} ${circ}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 36, fontWeight: '800', color: color, fontVariant: ['tabular-nums'] }}>
          {formatTimer(elapsed)}
        </Text>
        <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 4 }}>
          {Math.round(pct)}% of {target}h goal
        </Text>
        <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>
          {formatHours(target * 3600000 - elapsed > 0 ? target * 3600000 - elapsed : 0)} remaining
        </Text>
      </View>
    </View>
  )
}

export default function FastingScreen() {
  const queryClient = useQueryClient()
  const [tick, setTick] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: activeData, isLoading } = useQuery({
    queryKey: ['fasting', 'active'],
    queryFn: () => api.get('/fasting/active').then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: statsData } = useQuery({
    queryKey: ['fasting', 'stats'],
    queryFn: () => api.get('/fasting/stats').then((r) => r.data),
  })

  const { data: historyData } = useQuery({
    queryKey: ['fasting', 'history'],
    queryFn: () => api.get('/fasting/history?limit=10').then((r) => r.data),
  })

  const activeFast = activeData?.active

  useEffect(() => {
    if (activeFast) {
      intervalRef.current = setInterval(() => setTick((t) => t + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [activeFast?.id])

  const elapsed = activeFast ? Date.now() - new Date(activeFast.startTime).getTime() : 0
  const pct = activeFast ? Math.min(100, (elapsed / (activeFast.targetHours * 3600000)) * 100) : 0

  const startFast = useMutation({
    mutationFn: (hours: number) => api.post('/fasting/start', { targetHours: hours }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fasting'] }),
    onError: () => Alert.alert('Error', 'Failed to start fast'),
  })

  const stopFast = useMutation({
    mutationFn: (id: string) => api.put(`/fasting/${id}/stop`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fasting'] })
      Alert.alert('Fast ended!', 'Great work staying committed. Your stats have been updated.')
    },
    onError: () => Alert.alert('Error', 'Failed to end fast'),
  })

  const handleStop = () => {
    if (!activeFast) return
    Alert.alert('End Fast?', 'Are you sure you want to end your fasting session?', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'End Fast', style: 'destructive', onPress: () => stopFast.mutate(activeFast.id) },
    ])
  }

  const stats = statsData || {}
  const history: any[] = historyData?.records || []

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Intermittent Fasting</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Active fast / Start section */}
        {activeFast ? (
          <View style={styles.activeSection}>
            {/* Ring */}
            <View style={styles.ringWrapper}>
              <CircularProgress
                pct={pct} size={220} stroke={16}
                elapsed={elapsed} target={activeFast.targetHours}
                key={tick}
              />
            </View>

            {/* Status */}
            <View style={[styles.statusBadge, pct >= 100 && styles.statusBadgeComplete]}>
              <Ionicons name={pct >= 100 ? 'checkmark-circle' : 'timer-outline'} size={14} color={pct >= 100 ? '#22c55e' : '#f97316'} />
              <Text style={[styles.statusText, pct >= 100 && { color: '#22c55e' }]}>
                {pct >= 100 ? 'Goal reached!' : 'Fasting in progress'}
              </Text>
            </View>

            {/* End button */}
            <TouchableOpacity
              onPress={handleStop}
              disabled={stopFast.isPending}
              style={styles.endBtn}>
              <Ionicons name="stop-circle-outline" size={18} color="#ef4444" />
              <Text style={styles.endBtnText}>End Fast</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.startSection}>
            <Text style={styles.sectionTitle}>Start a Fasting Window</Text>
            <Text style={styles.sectionSubtitle}>Choose a preset or tap to begin</Text>

            <View style={styles.presetsGrid}>
              {PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.hours}
                  onPress={() => startFast.mutate(preset.hours)}
                  disabled={startFast.isPending}
                  style={styles.presetCard}>
                  <Text style={styles.presetLabel}>{preset.label}</Text>
                  <Text style={styles.presetHours}>{preset.hours}h fast</Text>
                  <Text style={styles.presetDesc}>{preset.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'Total Fasts', value: stats.totalFasts ?? '—', color: Colors.accent },
              { label: 'Completed', value: stats.completedFasts ?? '—', color: '#22c55e' },
              { label: 'Total Hours', value: stats.totalHours ? `${Math.round(stats.totalHours)}h` : '—', color: '#f97316' },
              { label: 'Avg Duration', value: stats.avgHours ? `${Math.round(stats.avgHours)}h` : '—', color: '#a78bfa' },
              { label: 'Longest Fast', value: stats.longestFast ? `${Math.round(stats.longestFast)}h` : '—', color: '#f59e0b' },
              { label: 'Current Streak', value: stats.currentStreak ? `${stats.currentStreak}d` : '—', color: '#ef4444' },
            ].map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* History */}
        {history.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent Fasts</Text>
            {history.map((record: any, i: number) => {
              const durationMs = record.endTime
                ? new Date(record.endTime).getTime() - new Date(record.startTime).getTime()
                : 0
              const durationHours = Math.round((durationMs / 3600000) * 10) / 10
              const startDate = new Date(record.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return (
                <View key={record.id ?? i} style={styles.historyRow}>
                  <View style={[styles.historyDot, { backgroundColor: record.completed ? '#22c55e' : Colors.textMuted }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyDate}>{startDate}</Text>
                    <Text style={styles.historyGoal}>{record.targetHours}h goal</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.historyDuration, { color: record.completed ? '#22c55e' : Colors.textSecondary }]}>
                      {durationHours}h
                    </Text>
                    <Text style={styles.historyStatus}>{record.completed ? 'Completed' : 'Ended early'}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
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
  activeSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  ringWrapper: {
    width: 240, height: 240, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(249, 115, 22, 0.1)', borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)', borderRadius: BorderRadius.full,
    paddingHorizontal: 14, paddingVertical: 6, marginBottom: Spacing.lg,
  },
  statusBadgeComplete: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusText: { fontSize: 13, fontWeight: '600', color: '#f97316' },
  endBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: BorderRadius.lg,
    paddingHorizontal: 28, paddingVertical: 12, marginHorizontal: Spacing.md,
  },
  endBtnText: { fontSize: 15, fontWeight: '700', color: '#ef4444' },
  startSection: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.text,
    paddingHorizontal: Spacing.md, marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13, color: Colors.textSecondary,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
  },
  presetsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: Spacing.md, marginTop: 4,
  },
  presetCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 30) / 3,
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, alignItems: 'center',
  },
  presetLabel: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  presetHours: { fontSize: 11, color: Colors.textSecondary },
  presetDesc: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  statsSection: { paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    paddingHorizontal: Spacing.md, marginTop: Spacing.sm,
  },
  statCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 20) / 3,
    backgroundColor: Colors.card, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 3, textAlign: 'center' },
  historySection: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginTop: Spacing.sm,
  },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
  historyDate: { fontSize: 14, fontWeight: '600', color: Colors.text },
  historyGoal: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  historyDuration: { fontSize: 15, fontWeight: '700' },
  historyStatus: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
})
