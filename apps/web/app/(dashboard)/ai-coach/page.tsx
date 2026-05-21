'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Loader2, Sparkles, Upload, Camera } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface MealAnalysis {
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  healthScore: number
  suggestions: string[]
  healthierAlternatives: string[]
  foods: Array<{ name: string; estimatedGrams: number; calories: number }>
}

export default function AICoachPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi ${user?.username || 'there'}! 👋 I'm your NutriCoach, powered by AI. I can help you with:\n\n• Nutrition questions\n• Meal suggestions\n• Understanding macros\n• Weight loss/gain tips\n• Analyzing your meal photos\n\nWhat would you like to know today?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [mealAnalysis, setMealAnalysis] = useState<MealAnalysis | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const { data } = await api.post('/ai/chat', {
        messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.content })),
        context: {
          goal: user?.goal,
          weight: user?.weight,
          dailyGoal: user?.dailyCalories,
        },
      })

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message, timestamp: new Date() },
      ])
    } catch (err: any) {
      if (err.response?.status === 503) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'AI service is not configured. Please add an OpenAI API key to enable the AI coach.',
            timestamp: new Date(),
          },
        ])
      } else {
        toast.error('Failed to get response')
      }
    } finally {
      setLoading(false)
    }
  }

  const analyzeMeal = async (file: File) => {
    setAnalyzing(true)
    setMealAnalysis(null)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1]
        try {
          const { data } = await api.post('/ai/analyze-meal', { imageBase64: base64 })
          setMealAnalysis(data)
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `I analyzed your meal! 🍽️\n\n**Estimated nutrition:**\n• Calories: ${data.totalCalories} kcal\n• Protein: ${data.totalProtein}g\n• Carbs: ${data.totalCarbs}g\n• Fats: ${data.totalFats}g\n\n**Health Score: ${data.healthScore}/10**\n\n${data.suggestions.slice(0, 2).join('\n')}`,
              timestamp: new Date(),
            },
          ])
        } catch {
          toast.error('Failed to analyze meal photo')
        } finally {
          setAnalyzing(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setAnalyzing(false)
    }
  }

  const quickPrompts = [
    'What should I eat for breakfast?',
    'How do I increase my protein intake?',
    'Suggest a high-protein snack',
    'What are the best foods for weight loss?',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="glass-card p-4 mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nt-accent to-purple-500 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold">NutriCoach AI</h1>
          <p className="text-xs text-nt-text-secondary flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Online • Powered by GPT-4
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={analyzing}
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-nt-accent/10 hover:bg-nt-accent/20 text-nt-accent rounded-xl transition-colors border border-nt-accent/20"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Analyze Meal
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && analyzeMeal(e.target.files[0])}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-1">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-nt-accent text-white rounded-2xl rounded-tr-sm'
                    : 'glass-card rounded-2xl rounded-tl-sm'
                } px-4 py-3`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3 h-3 text-nt-accent" />
                    <span className="text-xs text-nt-accent font-medium">NutriCoach</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <div className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-white/60' : 'text-nt-text-muted'}`}>
                  {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start">
            <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-nt-accent" />
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-nt-accent"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="text-xs px-3 py-1.5 bg-nt-card border border-nt-border rounded-xl text-nt-text-secondary hover:text-white hover:border-nt-accent/50 transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="glass-card p-3 flex items-end gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder="Ask me anything about nutrition..."
          rows={1}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-nt-text-muted focus:outline-none resize-none min-h-[36px] max-h-32"
          style={{ lineHeight: '1.5' }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="flex-shrink-0 w-9 h-9 bg-nt-accent hover:bg-nt-accent-hover disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}
