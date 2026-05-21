interface OpenFoodFactsProduct {
  product_name?: string
  brands?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
    sugars_100g?: number
    sodium_100g?: number
    'saturated-fat_100g'?: number
  }
  serving_size?: string
  image_url?: string
}

interface BarcodeResult {
  name: string
  brand?: string
  barcode: string
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber?: number
  sugar?: number
  sodium?: number
  saturatedFat?: number
  servingSize: number
  servingUnit: string
  imageUrl?: string
}

export async function lookupBarcode(barcode: string): Promise<BarcodeResult | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,brands,nutriments,serving_size,image_url`

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'NutriTrack/1.0 (nutritrack.app)' },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) return null

    const data = (await response.json()) as { status: number; product?: OpenFoodFactsProduct }

    if (data.status !== 1 || !data.product) return null

    const product = data.product
    const nutriments = product.nutriments || {}

    const name = product.product_name || 'Unknown Product'
    const calories = nutriments['energy-kcal_100g'] || 0
    const protein = nutriments['proteins_100g'] || 0
    const carbs = nutriments['carbohydrates_100g'] || 0
    const fats = nutriments['fat_100g'] || 0

    if (!name || calories === 0) return null

    return {
      name,
      brand: product.brands,
      barcode,
      calories,
      protein,
      carbs,
      fats,
      fiber: nutriments['fiber_100g'],
      sugar: nutriments['sugars_100g'],
      sodium: nutriments['sodium_100g'],
      saturatedFat: nutriments['saturated-fat_100g'],
      servingSize: 100,
      servingUnit: 'g',
      imageUrl: product.image_url,
    }
  } catch {
    return null
  }
}
