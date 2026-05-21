'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Barcode, Heart, Loader2, Plus, Search, Star } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function FoodDatabasePage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [page, setPage] = useState(1)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [form, setForm] = useState({
    name: '', brand: '', barcode: '', calories: '', protein: '', carbs: '', fats: '',
    fiber: '', servingSize: '100', servingUnit: 'g', isPublic: false,
  })

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setPage(1)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => setDebouncedQuery(value), 300)
    setDebounceTimer(timer)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['foods', debouncedQuery, page],
    queryFn: () =>
      api.get(`/foods?q=${encodeURIComponent(debouncedQuery)}&page=${page}&limit=20`).then((r) => r.data),
  })

  const lookupBarcode = useMutation({
    mutationFn: (barcode: string) => api.get(`/foods/barcode/${barcode}`).then((r) => r.data),
    onSuccess: (data) => {
      if (data.food) {
        toast.success(`Found: ${data.food.name}`)
        // Pre-fill form with found data
        setForm({
          name: data.food.name || '',
          brand: data.food.brand || '',
          barcode: data.food.barcode || '',
          calories: data.food.calories?.toString() || '',
          protein: data.food.protein?.toString() || '',
          carbs: data.food.carbs?.toString() || '',
          fats: data.food.fats?.toString() || '',
          fiber: data.food.fiber?.toString() || '',
          servingSize: '100',
          servingUnit: 'g',
          isPublic: false,
        })
      }
    },
    onError: () => toast.error('Product not found. You can add it manually.'),
  })

  const createFood = useMutation({
    mutationFn: () =>
      api.post('/foods', {
        name: form.name,
        brand: form.brand || undefined,
        barcode: form.barcode || undefined,
        calories: parseFloat(form.calories),
        protein: parseFloat(form.protein),
        carbs: parseFloat(form.carbs),
        fats: parseFloat(form.fats),
        fiber: form.fiber ? parseFloat(form.fiber) : undefined,
        servingSize: parseFloat(form.servingSize),
        servingUnit: form.servingUnit,
        isPublic: form.isPublic,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] })
      setShowAddForm(false)
      setForm({ name: '', brand: '', barcode: '', calories: '', protein: '', carbs: '', fats: '', fiber: '', servingSize: '100', servingUnit: 'g', isPublic: false })
      toast.success('Food added to database! 🍎')
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create food'),
  })

  const toggleFavorite = useMutation({
    mutationFn: (foodId: string) => api.post(`/foods/${foodId}/favorite`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['foods'] }),
  })

  const foods = data?.foods || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 1

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Food Database</h1>
          <p className="text-nt-text-secondary text-sm">{total.toLocaleString()} foods available</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Food
          </button>
        </div>
      </div>

      {/* Barcode Lookup */}
      <div className="glass-card p-4 flex items-center gap-3">
        <Barcode className="w-5 h-5 text-nt-text-secondary" />
        <input
          type="text"
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          placeholder="Enter barcode number..."
          className="flex-1 bg-transparent text-sm text-white placeholder:text-nt-text-muted focus:outline-none"
          onKeyDown={(e) => e.key === 'Enter' && barcodeInput && lookupBarcode.mutate(barcodeInput)}
        />
        <button
          onClick={() => barcodeInput && lookupBarcode.mutate(barcodeInput)}
          disabled={lookupBarcode.isPending || !barcodeInput}
          className="text-sm px-4 py-1.5 bg-nt-accent hover:bg-nt-accent-hover rounded-lg text-white transition-colors disabled:opacity-50"
        >
          {lookupBarcode.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lookup'}
        </button>
      </div>

      {/* Add Food Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold mb-4">Add Custom Food</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Name *', key: 'name', placeholder: 'Chicken Breast' },
              { label: 'Brand', key: 'brand', placeholder: 'Optional' },
              { label: 'Barcode', key: 'barcode', placeholder: 'Optional' },
              { label: 'Calories (per 100g) *', key: 'calories', placeholder: '165', type: 'number' },
              { label: 'Protein (g) *', key: 'protein', placeholder: '31', type: 'number' },
              { label: 'Carbs (g) *', key: 'carbs', placeholder: '0', type: 'number' },
              { label: 'Fats (g) *', key: 'fats', placeholder: '3.6', type: 'number' },
              { label: 'Fiber (g)', key: 'fiber', placeholder: '0', type: 'number' },
              { label: 'Serving Size', key: 'servingSize', placeholder: '100', type: 'number' },
            ].map((field) => (
              <div key={field.key}>
                <label className="text-xs text-nt-text-secondary mb-1 block">{field.label}</label>
                <input
                  type={field.type || 'text'}
                  value={(form as any)[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full bg-nt-bg border border-nt-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-nt-accent transition-colors"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-nt-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                className="w-4 h-4 accent-nt-accent"
              />
              Make public (share with community)
            </label>
            <button
              onClick={() => createFood.mutate()}
              disabled={createFood.isPending || !form.name || !form.calories || !form.protein || !form.carbs || !form.fats}
              className="ml-auto flex items-center gap-2 bg-nt-accent hover:bg-nt-accent-hover text-white px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            >
              {createFood.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Food
            </button>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-nt-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search by name or brand..."
          className="w-full bg-nt-card border border-nt-border rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder:text-nt-text-muted focus:outline-none focus:border-nt-accent focus:ring-1 focus:ring-nt-accent/30 transition-all"
        />
      </div>

      {/* Food Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-4 h-24 shimmer" />
          ))}
        </div>
      ) : foods.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-nt-text-secondary">No foods found for "{query}"</p>
          <button onClick={() => setShowAddForm(true)} className="text-nt-accent text-sm hover:underline mt-2 block mx-auto">
            Add it to the database →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {foods.map((food: any) => (
            <motion.div
              key={food.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card-hover p-4 flex items-center justify-between group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{food.name}</span>
                  {food.isVerified && (
                    <span className="text-xs bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-md">✓</span>
                  )}
                </div>
                {food.brand && <div className="text-xs text-nt-text-muted">{food.brand}</div>}
                <div className="flex gap-3 mt-1.5 text-xs">
                  <span className="text-purple-400">{food.calories} kcal</span>
                  <span className="text-blue-400">P: {food.protein}g</span>
                  <span className="text-amber-400">C: {food.carbs}g</span>
                  <span className="text-red-400">F: {food.fats}g</span>
                </div>
                <div className="text-xs text-nt-text-muted mt-0.5">per {food.servingSize}{food.servingUnit}</div>
              </div>
              <button
                onClick={() => toggleFavorite.mutate(food.id)}
                className="ml-3 p-2 rounded-lg hover:bg-nt-card-hover transition-all opacity-60 hover:opacity-100"
              >
                <Heart
                  className={`w-4 h-4 ${food.isFavorite ? 'text-red-400 fill-red-400' : 'text-nt-text-muted'}`}
                />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-nt-border text-sm hover:bg-nt-card-hover transition-colors disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-sm text-nt-text-secondary">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl border border-nt-border text-sm hover:bg-nt-card-hover transition-colors disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
