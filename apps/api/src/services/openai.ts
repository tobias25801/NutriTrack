import OpenAI from 'openai'

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return client
}

export interface MealAnalysisResult {
  foods: Array<{
    name: string
    estimatedGrams: number
    calories: number
    protein: number
    carbs: number
    fats: number
    confidence: number
  }>
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFats: number
  healthScore: number
  suggestions: string[]
  healthierAlternatives: string[]
}

export async function analyzeMealImage(imageBase64: string): Promise<MealAnalysisResult> {
  const openai = getClient()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a nutrition expert and food recognition AI. When given a food image, analyze it and provide detailed nutritional information. Always respond with valid JSON matching the specified structure.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'high' },
          },
          {
            type: 'text',
            text: `Analyze this meal image and return a JSON object with this exact structure:
{
  "foods": [
    {
      "name": "food name",
      "estimatedGrams": 150,
      "calories": 200,
      "protein": 10,
      "carbs": 25,
      "fats": 8,
      "confidence": 0.9
    }
  ],
  "totalCalories": 200,
  "totalProtein": 10,
  "totalCarbs": 25,
  "totalFats": 8,
  "healthScore": 7,
  "suggestions": ["suggestion 1", "suggestion 2"],
  "healthierAlternatives": ["alternative 1", "alternative 2"]
}

Be realistic with portion sizes. Health score is 1-10. Return only the JSON, no other text.`,
          },
        ],
      },
    ],
    max_tokens: 1000,
  })

  const content = response.choices[0].message.content || '{}'
  try {
    return JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    throw new Error('Failed to parse AI response')
  }
}

export interface MealPlanResult {
  name: string
  description: string
  targetCalories: number
  targetProtein: number
  targetCarbs: number
  targetFat: number
  days: Array<{
    dayNumber: number
    dayName: string
    meals: Array<{
      name: string
      mealType: string
      time: string
      foods: Array<{
        name: string
        grams: number
        calories: number
        protein: number
        carbs: number
        fats: number
      }>
      totalCalories: number
    }>
    totalCalories: number
  }>
  tips: string[]
  shoppingList: string[]
}

export async function generateMealPlan(params: {
  age: number
  height: number
  weight: number
  gender: string
  goal: string
  activityLevel: string
  dietaryPreferences?: string[]
  allergies?: string[]
  budget?: string
  days?: number
}): Promise<MealPlanResult> {
  const openai = getClient()

  const { age, height, weight, gender, goal, activityLevel, dietaryPreferences, allergies, budget, days = 7 } = params

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a professional nutritionist and meal planning expert. Create detailed, realistic meal plans with specific foods and portions. Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: `Create a ${days}-day meal plan for:
- Age: ${age}, Height: ${height}cm, Weight: ${weight}kg, Gender: ${gender}
- Goal: ${goal}
- Activity Level: ${activityLevel}
- Dietary Preferences: ${dietaryPreferences?.join(', ') || 'none'}
- Allergies/Restrictions: ${allergies?.join(', ') || 'none'}
- Budget: ${budget || 'moderate'}

Return a JSON object matching this structure:
{
  "name": "Plan Name",
  "description": "Brief description",
  "targetCalories": 2000,
  "targetProtein": 150,
  "targetCarbs": 200,
  "targetFat": 67,
  "days": [
    {
      "dayNumber": 1,
      "dayName": "Monday",
      "meals": [
        {
          "name": "Breakfast",
          "mealType": "BREAKFAST",
          "time": "8:00 AM",
          "foods": [
            {"name": "Oatmeal", "grams": 80, "calories": 300, "protein": 10, "carbs": 55, "fats": 5}
          ],
          "totalCalories": 300
        }
      ],
      "totalCalories": 2000
    }
  ],
  "tips": ["tip 1", "tip 2"],
  "shoppingList": ["item 1", "item 2"]
}

Return only valid JSON, no other text.`,
      },
    ],
    max_tokens: 4000,
  })

  const content = response.choices[0].message.content || '{}'
  try {
    return JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    throw new Error('Failed to parse AI meal plan response')
  }
}

export async function getAITip(userContext: {
  goal: string
  streak: number
  todayCalories: number
  dailyGoal: number
}): Promise<string> {
  const openai = getClient()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a friendly nutrition coach. Give ONE short, actionable, motivating tip (1-2 sentences max). Be specific and practical.',
      },
      {
        role: 'user',
        content: `User context: Goal: ${userContext.goal}, Streak: ${userContext.streak} days, Today's calories: ${userContext.todayCalories}/${userContext.dailyGoal}. Give a relevant tip.`,
      },
    ],
    max_tokens: 100,
  })

  return response.choices[0].message.content || 'Stay consistent with your nutrition tracking for the best results!'
}

export async function chatWithCoach(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  userContext?: {
    todayCalories?: number
    dailyGoal?: number
    weight?: number
    goal?: string
  }
): Promise<string> {
  const openai = getClient()

  const systemPrompt = `You are NutriCoach, an expert AI nutrition and fitness coach built into the NutriTrack app.
You provide personalized, evidence-based nutrition advice. You're friendly, motivating, and practical.
${userContext ? `Current user context: Calories today: ${userContext.todayCalories || 0}/${userContext.dailyGoal || 2000}, Weight: ${userContext.weight || 'unknown'}kg, Goal: ${userContext.goal || 'maintain'}` : ''}
Keep responses concise (under 150 words) unless detailed explanation is needed.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    max_tokens: 500,
  })

  return response.choices[0].message.content || "I'm here to help with your nutrition journey!"
}

export async function estimateFoodFromName(name: string): Promise<{
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  servingSize: number
  servingUnit: string
}> {
  const openai = getClient()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a nutrition database. Return nutritional info per 100g as JSON only.',
      },
      {
        role: 'user',
        content: `Estimate nutrition per 100g for: "${name}". Return JSON: {"calories":0,"protein":0,"carbs":0,"fats":0,"fiber":0,"servingSize":100,"servingUnit":"g"}`,
      },
    ],
    max_tokens: 200,
  })

  const content = response.choices[0].message.content || '{}'
  try {
    return JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    return { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, servingSize: 100, servingUnit: 'g' }
  }
}
