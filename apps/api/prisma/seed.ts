import { PrismaClient, Goal, ActivityLevel, MealType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const achievements = [
  { name: 'first_log', description: 'Log your first meal', icon: '🍎', xp: 50, category: 'logging' },
  { name: 'week_streak', description: 'Log meals 7 days in a row', icon: '🔥', xp: 100, category: 'streak' },
  { name: 'month_streak', description: 'Log meals 30 days in a row', icon: '💪', xp: 500, category: 'streak' },
  { name: 'calorie_master', description: 'Hit your calorie goal 5 days in a row', icon: '🎯', xp: 200, category: 'nutrition' },
  { name: 'protein_champion', description: 'Hit your protein goal 7 days in a row', icon: '🥩', xp: 200, category: 'nutrition' },
  { name: 'hydration_hero', description: 'Hit your water goal 7 days in a row', icon: '💧', xp: 150, category: 'hydration' },
  { name: 'weight_loss_5', description: 'Lose 5kg from your starting weight', icon: '📉', xp: 300, category: 'weight' },
  { name: 'step_champion', description: 'Walk 10,000 steps in a day', icon: '👟', xp: 100, category: 'fitness' },
  { name: 'food_explorer', description: 'Log 50 different foods', icon: '🌍', xp: 250, category: 'logging' },
  { name: 'social_butterfly', description: 'Add 5 friends', icon: '👥', xp: 150, category: 'social' },
  { name: 'meal_planner', description: 'Create your first meal plan', icon: '📋', xp: 100, category: 'planning' },
  { name: 'ai_explorer', description: 'Use AI meal analysis for the first time', icon: '🤖', xp: 75, category: 'ai' },
  { name: 'scanner_pro', description: 'Scan 10 barcodes', icon: '📷', xp: 100, category: 'scanning' },
  { name: 'level_5', description: 'Reach level 5', icon: '⭐', xp: 500, category: 'level' },
  { name: 'level_10', description: 'Reach level 10', icon: '🌟', xp: 1000, category: 'level' },
]

const dailyChallenges = [
  { name: 'Hit Your Protein Goal', description: 'Meet your daily protein target', icon: '🥩', xp: 30, type: 'nutrition' },
  { name: 'Stay Hydrated', description: 'Drink at least 2L of water today', icon: '💧', xp: 25, type: 'hydration' },
  { name: 'Log All Meals', description: 'Log breakfast, lunch, and dinner', icon: '📝', xp: 40, type: 'logging' },
  { name: '10K Steps', description: 'Walk 10,000 steps today', icon: '👟', xp: 35, type: 'fitness' },
  { name: 'Stay Within Calories', description: 'Keep calories within 100kcal of your goal', icon: '🎯', xp: 50, type: 'nutrition' },
]

const foods = [
  { name: 'Chicken Breast', brand: null, calories: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Brown Rice', brand: null, calories: 216, protein: 5, carbs: 45, fats: 1.8, fiber: 3.5, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Broccoli', brand: null, calories: 34, protein: 2.8, carbs: 7, fats: 0.4, fiber: 2.6, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Eggs', brand: null, calories: 155, protein: 13, carbs: 1.1, fats: 11, fiber: 0, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Greek Yogurt', brand: null, calories: 59, protein: 10, carbs: 3.6, fats: 0.4, fiber: 0, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Oatmeal', brand: null, calories: 389, protein: 17, carbs: 66, fats: 7, fiber: 10.6, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Banana', brand: null, calories: 89, protein: 1.1, carbs: 23, fats: 0.3, fiber: 2.6, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Apple', brand: null, calories: 52, protein: 0.3, carbs: 14, fats: 0.2, fiber: 2.4, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Salmon', brand: null, calories: 208, protein: 20, carbs: 0, fats: 13, fiber: 0, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Sweet Potato', brand: null, calories: 86, protein: 1.6, carbs: 20, fats: 0.1, fiber: 3, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Almonds', brand: null, calories: 579, protein: 21, carbs: 22, fats: 50, fiber: 12.5, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Whole Milk', brand: null, calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, fiber: 0, servingSize: 100, servingUnit: 'ml', isVerified: true },
  { name: 'Avocado', brand: null, calories: 160, protein: 2, carbs: 9, fats: 15, fiber: 7, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'White Rice', brand: null, calories: 130, protein: 2.7, carbs: 28, fats: 0.3, fiber: 0.4, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Beef (Ground, 80%)', brand: null, calories: 254, protein: 17, carbs: 0, fats: 20, fiber: 0, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Cottage Cheese', brand: null, calories: 98, protein: 11, carbs: 3.4, fats: 4.3, fiber: 0, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Spinach', brand: null, calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, fiber: 2.2, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Whey Protein Powder', brand: 'Generic', calories: 400, protein: 80, carbs: 10, fats: 5, fiber: 0, servingSize: 30, servingUnit: 'g', isVerified: true },
  { name: 'Whole Wheat Bread', brand: null, calories: 247, protein: 13, carbs: 41, fats: 4.2, fiber: 6, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Orange Juice', brand: null, calories: 45, protein: 0.7, carbs: 10, fats: 0.2, fiber: 0.2, servingSize: 100, servingUnit: 'ml', isVerified: true },
  { name: 'Tuna (Canned)', brand: null, calories: 116, protein: 26, carbs: 0, fats: 1, fiber: 0, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Peanut Butter', brand: null, calories: 588, protein: 25, carbs: 20, fats: 50, fiber: 6, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Coffee (Black)', brand: null, calories: 2, protein: 0.3, carbs: 0, fats: 0, fiber: 0, servingSize: 240, servingUnit: 'ml', isVerified: true },
  { name: 'Blueberries', brand: null, calories: 57, protein: 0.7, carbs: 14, fats: 0.3, fiber: 2.4, servingSize: 100, servingUnit: 'g', isVerified: true },
  { name: 'Pasta (Cooked)', brand: null, calories: 158, protein: 5.8, carbs: 31, fats: 0.9, fiber: 1.8, servingSize: 100, servingUnit: 'g', isVerified: true },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Seed achievements
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: {},
      create: achievement,
    })
  }
  console.log(`✅ Created ${achievements.length} achievements`)

  // Seed daily challenges
  for (const challenge of dailyChallenges) {
    await prisma.dailyChallenge.upsert({
      where: { id: challenge.name },
      update: {},
      create: { id: challenge.name, ...challenge },
    })
  }
  console.log(`✅ Created ${dailyChallenges.length} daily challenges`)

  // Seed foods
  for (const food of foods) {
    const existing = await prisma.food.findFirst({ where: { name: food.name, brand: food.brand } })
    if (!existing) {
      await prisma.food.create({ data: food })
    }
  }
  console.log(`✅ Created ${foods.length} foods`)

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123456', 12)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@nutritrack.app' },
    update: {},
    create: {
      email: 'demo@nutritrack.app',
      username: 'demo_user',
      passwordHash,
      weight: 75,
      height: 175,
      age: 28,
      gender: 'male',
      goal: Goal.MAINTAIN,
      activityLevel: ActivityLevel.MODERATE,
      dailyCalories: 2200,
      dailyProtein: 165,
      dailyCarbs: 275,
      dailyFat: 73,
      xp: 1250,
      level: 4,
      streak: 12,
    },
  })
  console.log(`✅ Created demo user: demo@nutritrack.app / demo123456`)

  console.log('🎉 Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
