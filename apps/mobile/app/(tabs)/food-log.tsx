import React, { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Colors, Spacing, BorderRadius } from '../../constants/theme'
import { toast } from 'sonner-native'

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const
const MEAL_EMOJIS = { BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙', SNACK: '🍎' }

export default function FoodLogScreen() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedMeal, setSelectedMeal] = useState<string>('BREAKFAST')
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const { data: todayData, isLoading } = useQuery({
    queryKey: ['meals', 'today'],
    queryFn: () => api.get('/meals').then((r) => r.data),
  })

  const { data: searchResults } = useQuery({
    queryKey: ['foods', 'search', debouncedQuery],
    queryFn: () =>
      debouncedQuery.length >= 1
        ? api.get(`/foods?q=${encodeURIComponent(debouncedQuery)}&limit=10`).then((r) => r.data.foods)
        : api.get('/foods/recent/list').then((r) => r.data),
    enabled: true,
  })

  const handleSearchChange = (text: string) => {
    setSearchQuery(text)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => setDebouncedQuery(text), 300)
    setDebounceTimer(timer)
  }

  const logFood = useMutation({
    mutationFn: ({ foodId, grams, mealType }: { foodId: string; grams: number; mealType: string }) =>
      api.post('/meals', { foodId, grams, mealType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] })
      setSearchQuery('')
      setDebouncedQuery('')
    },
    onError: () => {}, // silent fail
  })

  const deleteFood = useMutation({
    mutationFn: (id: string) => api.delete(`/meals/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meals'] }),
  })

  const totals = todayData?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Food Log</Text>
        <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
      </View>

      {/* Totals */}
      <View style={styles.totalsBar}>
        {[
          { label: 'Cal', value: Math.round(totals.calories), color: Colors.accent },
          { label: 'Pro', value: `${Math.round(totals.protein)}g`, color: Colors.protein },
          { label: 'Carb', value: `${Math.round(totals.carbs)}g`, color: Colors.carbs },
          { label: 'Fat', value: `${Math.round(totals.fats)}g`, color: Colors.fats },
        ].map((item) => (
          <View key={item.label} style={styles.totalItem}>
            <Text style={[styles.totalValue, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.totalLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Meal selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealSelector}>
          {MEAL_TYPES.map((mealType) => (
            <TouchableOpacity
              key={mealType}
              onPress={() => setSelectedMeal(mealType)}
              style={[
                styles.mealTab,
                selectedMeal === mealType && styles.mealTabActive,
              ]}
            >
              <Text style={styles.mealTabEmoji}>{MEAL_EMOJIS[mealType]}</Text>
              <Text style={[
                styles.mealTabText,
                selectedMeal === mealType && styles.mealTabTextActive,
              ]}>
                {mealType}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search foods to add..."
            placeholderTextColor={Colors.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setDebouncedQuery('') }}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {(searchResults?.length > 0) && (
          <View style={styles.searchResults}>
            {searchResults.slice(0, 8).map((food: any) => (
              <TouchableOpacity
                key={food.id}
                style={styles.searchResult}
                onPress={() => logFood.mutate({ foodId: food.id, grams: 100, mealType: selectedMeal })}
                disabled={logFood.isPending}
              >
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultName}>{food.name}</Text>
                  {food.brand && <Text style={styles.searchResultBrand}>{food.brand}</Text>}
                </View>
                <View style={styles.searchResultRight}>
                  <Text style={styles.searchResultCal}>{food.calories} kcal</Text>
                  <Text style={styles.searchResultPer}>per 100g</Text>
                </View>
                {logFood.isPending ? (
                  <ActivityIndicator size="small" color={Colors.accent} />
                ) : (
                  <Ionicons name="add-circle" size={24} color={Colors.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Logged meals for selected type */}
        <View style={styles.loggedSection}>
          <Text style={styles.loggedTitle}>
            {MEAL_EMOJIS[selectedMeal as keyof typeof MEAL_EMOJIS]} {selectedMeal}
          </Text>

          {isLoading ? (
            <ActivityIndicator color={Colors.accent} />
          ) : (
            (todayData?.grouped?.[selectedMeal] || []).map((entry: any) => (
              <View key={entry.id} style={styles.loggedEntry}>
                <View style={styles.loggedInfo}>
                  <Text style={styles.loggedName}>{entry.food?.name || entry.user?.name || 'Food'}</Text>
                  <Text style={styles.loggedMeta}>{entry.grams}g • P: {Math.round(entry.protein)}g • C: {Math.round(entry.carbs)}g</Text>
                </View>
                <Text style={styles.loggedCal}>{Math.round(entry.calories)} kcal</Text>
                <TouchableOpacity
                  onPress={() => deleteFood.mutate(entry.id)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}

          {(todayData?.grouped?.[selectedMeal] || []).length === 0 && !isLoading && (
            <Text style={styles.emptyMeal}>No {selectedMeal.toLowerCase()} logged yet</Text>
          )}
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
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  totalsBar: { flexDirection: 'row', margin: Spacing.md, backgroundColor: Colors.card, borderRadius: BorderRadius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  totalItem: { flex: 1, alignItems: 'center' },
  totalValue: { fontSize: 17, fontWeight: '800' },
  totalLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  mealSelector: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  mealTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.full, backgroundColor: Colors.card, marginRight: 8, borderWidth: 1, borderColor: Colors.border },
  mealTabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  mealTabEmoji: { fontSize: 14 },
  mealTabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  mealTabTextActive: { color: Colors.text },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.md, paddingVertical: 12, marginHorizontal: Spacing.md, marginBottom: Spacing.sm, gap: 10, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14 },
  searchResults: { marginHorizontal: Spacing.md, backgroundColor: Colors.card, borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  searchResult: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10 },
  searchResultInfo: { flex: 1 },
  searchResultName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  searchResultBrand: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  searchResultRight: { alignItems: 'flex-end' },
  searchResultCal: { fontSize: 13, fontWeight: '700', color: Colors.accent },
  searchResultPer: { fontSize: 10, color: Colors.textMuted },
  loggedSection: { marginHorizontal: Spacing.md },
  loggedTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  loggedEntry: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  loggedInfo: { flex: 1 },
  loggedName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  loggedMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  loggedCal: { fontSize: 14, fontWeight: '700', color: Colors.accent },
  deleteBtn: { padding: 6 },
  emptyMeal: { textAlign: 'center', color: Colors.textMuted, fontSize: 13, paddingVertical: Spacing.md },
})
