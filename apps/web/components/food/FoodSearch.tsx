'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Star, Loader2, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'

interface Food {
  id: string
  name: string
  brand?: string
  calories: number
  protein: number
  carbs: number
  fats: number
  servingSize: number
  servingUnit: string
  isFavorite?: boolean
}

interface FoodSearchProps {
  onSelect: (food: Food, grams: number) => void
  isLoading?: boolean
}

export function FoodSearch({ onSelect, isLoading }: FoodSearchProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [grams, setGrams] = useState(100)
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => setDebouncedQuery(value), 300)
    setDebounceTimer(timer)
  }

  const { data: searchData, isLoading: searching } = useQuery({
    queryKey: ['foods', 'search', debouncedQuery],
    queryFn: () =>
      debouncedQuery.length >= 2
        ? api.get(`/foods?q=${encodeURIComponent(debouncedQuery)}&limit=10`).then((r) => r.data)
        : api.get('/foods/recent/list').then((r) => ({ foods: r.data })),
    enabled: true,
  })

  const foods: Food[] = searchData?.foods || []

  const handleSelect = (food: Food) => {
    setSelectedFood(food)
    setGrams(food.servingSize || 100)
  }

  const handleAdd = () => {
    if (selectedFood) {
      onSelect(selectedFood, grams)
      setSelectedFood(null)
      setQuery('')
      setDebouncedQuery('')
      setGrams(100)
    }
  }

  const calculateNutrition = (food: Food, g: number) => {
    const ratio = g / 100
    return {
      calories: Math.round(food.calories * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fats: Math.round(food.fats * ratio * 10) / 10,
    }
  }

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nt-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search foods, brands..."
          className="w-full bg-nt-bg border border-nt-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-nt-text-muted focus:outline-none focus:border-nt-accent focus:ring-1 focus:ring-nt-accent/50 transition-all"
          autoFocus
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nt-text-muted animate-spin" />
        )}
      </div>

      {/* Selected Food Detail */}
      <AnimatePresence>
        {selectedFood && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-nt-accent/10 rounded-xl border border-nt-accent/20"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold">{selectedFood.name}</div>
                {selectedFood.brand && <div className="text-xs text-nt-text-secondary">{selectedFood.brand}</div>}
              </div>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <label className="text-sm text-nt-text-secondary">Amount (g):</label>
              <input
                type="number"
                value={grams}
                onChange={(e) => setGrams(Number(e.target.value))}
                min={1}
                max={2000}
                className="w-24 bg-nt-bg border border-nt-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-nt-accent"
              />
              {/* Quick amounts */}
              {[50, 100, 150, 200].map((g) => (
                <button
                  key={g}
                  onClick={() => setGrams(g)}
                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                    grams === g ? 'bg-nt-accent text-white' : 'bg-nt-bg text-nt-text-secondary hover:bg-nt-card-hover'
                  }`}
                >
                  {g}g
                </button>
              ))}
            </div>

            {(() => {
              const n = calculateNutrition(selectedFood, grams)
              return (
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm">
                    <span className="text-purple-400 font-semibold">{n.calories} kcal</span>
                    <span className="text-blue-400">P: {n.protein}g</span>
                    <span className="text-amber-400">C: {n.carbs}g</span>
                    <span className="text-red-400">F: {n.fats}g</span>
                  </div>
                  <button
                    onClick={handleAdd}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 bg-nt-accent hover:bg-nt-accent-hover text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {!selectedFood && (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {foods.length === 0 && !searching && query.length >= 2 ? (
            <div className="text-center py-6 text-sm text-nt-text-muted">No foods found for "{query}"</div>
          ) : (
            foods.map((food) => (
              <button
                key={food.id}
                onClick={() => handleSelect(food)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-nt-card-hover transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{food.name}</span>
                    {food.isFavorite && <Star className="w-3 h-3 text-yellow-400" fill="currentColor" flex-shrink-0 />}
                  </div>
                  {food.brand && <div className="text-xs text-nt-text-muted">{food.brand}</div>}
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <div className="text-sm font-semibold">{food.calories} kcal</div>
                  <div className="text-xs text-nt-text-muted">per 100g</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
