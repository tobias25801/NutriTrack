# API Contracts

Base URL: `http://localhost:3001`
Auth: `Authorization: Bearer <accessToken>` (all protected routes)
On auth failure: `401 { error: string }`

---

## Common Error Codes

| Code | Meaning |
|------|---------|
| 400 | Validation failure (Zod), missing required fields, invalid range |
| 401 | Missing / invalid / expired JWT or refresh token |
| 404 | Resource not found |
| 409 | Conflict — duplicate email/username/barcode, friendship exists, challenge already completed |
| 500 | Internal server error |
| 503 | OpenAI API not configured |

---

## Auth — `/auth`

### POST `/auth/register` — public
```json
// Request
{ "email": "string", "username": "string (3-20, alphanumeric+_)", "password": "string (8+)" }

// Response 201
{ "accessToken": "string", "refreshToken": "string", "user": { "id", "email", "username", "level", "xp", "streak" } }
// 409 if email or username taken
```

### POST `/auth/login` — public
```json
// Request
{ "email": "string", "password": "string" }

// Response 200
{ "accessToken": "string", "refreshToken": "string", "user": { "id", "email", "username", "level", "xp", "streak", "goal", "dailyCalories", "dailyProtein", "dailyCarbs", "dailyFat", "weight", "height", "avatarUrl" } }
// 401 invalid credentials
```

### POST `/auth/google-login` — public
```json
// Request
{ "idToken": "string" }
// Response 200 — same shape as /login
```

### POST `/auth/refresh` — public
```json
// Request
{ "refreshToken": "string" }
// Response 200
{ "accessToken": "string" }
// 401 if expired or invalid
```

### POST `/auth/logout` — protected
```json
// Request (optional)
{ "refreshToken": "string" }
// Response 200
{ "success": true }
```

### GET `/auth/me` — protected
```json
// Response 200
{ "id", "email", "username", "weight", "height", "age", "gender", "goal", "activityLevel", "dailyCalories", "dailyProtein", "dailyCarbs", "dailyFat", "dailyWater", "dailySteps", "avatarUrl", "xp", "level", "streak", "lastLogDate", "units", "timezone", "notifications", "theme", "createdAt", "_count": { "achievements", "mealEntries", "friendships" } }
```

### PUT `/auth/me` — protected
Any subset of: `username`, `weight`, `height`, `age`, `gender`, `goal`, `activityLevel`, `dailyCalories`, `dailyProtein`, `dailyCarbs`, `dailyFat`, `dailyWater`, `dailySteps`, `units`, `timezone`, `notifications`, `theme`, `avatarUrl`
```json
// Response 200
{ "success": true, "user": { ...updated full user } }
```

---

## Foods — `/foods`

### GET `/foods` — protected
Query: `q?`, `page=1`, `limit=20`, `category?`
```json
// Response 200
{ "foods": [{ "id", "name", "brand?", "calories", "protein", "carbs", "fats", "fiber?", "sugar?", "sodium?", "servingSize", "servingUnit", "imageUrl?", "isPublic", "isFavorite" }], "total", "page", "totalPages" }
```

### GET `/foods/:id` — protected
```json
// Response 200 — food object with isFavorite bool
// 404 if not found
```

### GET `/foods/barcode/:barcode` — protected
```json
// Response 200
{ "food": { ...food object }, "source": "database" | "openfoodfacts" }
// 404 if not found anywhere
```

### POST `/foods` — protected
```json
// Request
{ "name": "string (1-100)", "brand?": "string", "barcode?": "string", "calories": "number (0+)", "protein": "number (0+)", "carbs": "number (0+)", "fats": "number (0+)", "fiber?": "number", "sugar?": "number", "sodium?": "number", "servingSize": "number (default 100)", "servingUnit": "string (default 'g')", "imageUrl?": "string", "isPublic?": "boolean" }
// Response 201 — created food object
// 409 if barcode already exists
```

### PUT `/foods/:id` — protected (owned foods only)
Any subset of food fields.
```json
// Response 200 — updated food
// 404 if not found or not owned
```

### DELETE `/foods/:id` — protected (owned foods only)
```json
// Response 200
{ "success": true }
```

### GET `/foods/recent/list` — protected
Returns 20 most recently logged foods.

### GET `/foods/favorites/list` — protected
Returns all favorite foods with `isFavorite: true`.

### POST `/foods/:id/favorite` — protected
```json
// Response 200
{ "isFavorite": boolean }
```

### POST `/foods/ai-estimate` — protected
```json
// Request
{ "name": "string" }
// Response 200
{ "name", "calories", "protein", "carbs", "fats", ...estimated nutrition }
```

---

## Meals — `/meals`

### GET `/meals` — protected
Query: `date?` (YYYY-MM-DD, defaults to today)
```json
// Response 200
{ "entries": [...], "grouped": { "BREAKFAST": [], "LUNCH": [], "DINNER": [], "SNACK": [] }, "totals": { "calories", "protein", "carbs", "fats" }, "date": "string" }
```

### POST `/meals` — protected
```json
// Request
{ "foodId": "string", "grams": "number (1+)", "mealType": "BREAKFAST|LUNCH|DINNER|SNACK", "date?": "string" }
// Response 201
{ "entry": { "id", "userId", "foodId", "grams", "mealType", "calories", "protein", "carbs", "fats", "date" }, "streak": "number", "xp": { "totalXP", "newLevel?", "leveledUp?" } }
// 404 if food not found
```

### PUT `/meals/:id` — protected
```json
// Request (any subset)
{ "grams?": "number", "mealType?": "string" }
// Response 200 — updated entry with recalculated macros
```

### DELETE `/meals/:id` — protected
```json
// Response 200
{ "success": true }
```

### GET `/meals/nutrition/summary` — protected
Query: `startDate?`, `endDate?`, `groupBy=day`
```json
// Response 200
{ "dailySummaries": [{ "date", "calories", "protein", "carbs", "fats", "count" }], "totals": { ... }, "averages": { ... }, "days": "number" }
```

---

## Weight — `/weight`

### GET `/weight` — protected
Query: `limit=90`, `startDate?`, `endDate?`
```json
// Response 200
{ "entries": [{ "id", "userId", "weight", "bodyFat?", "muscleMass?", "note?", "date" }], "stats?": { "current", "starting", "change", "min", "max", "average", "weeklyAverages": [{ "week", "average" }] } }
```

### POST `/weight` — protected
```json
// Request
{ "weight": "number (20-500)", "bodyFat?": "number (1-70)", "muscleMass?": "number (1+)", "note?": "string (max 200)", "date?": "string" }
// Response 201 — created entry
```

### PUT `/weight/:id` / DELETE `/weight/:id` — protected
Standard update/delete. 404 if not found.

### GET `/weight/bmi` — protected
```json
// Response 200
{ "bmi": "number", "category": "string", "weight": "number", "height": "number" }
// 400 if user missing weight or height
```

---

## Water — `/water`

### GET `/water/today` — protected
```json
// Response 200
{ "entries": [...], "total": "number", "goal": "number" }
```

### POST `/water` — protected
```json
// Request
{ "amount?": "number (1-5000, default 250)", "date?": "string" }
// Response 201 — created entry
```

### DELETE `/water/:id` — protected
```json
// Response 200
{ "success": true }
```

### GET `/water/history` — protected
Returns last 7 days: `[{ "date": "YYYY-MM-DD", "total": "number" }]`

---

## AI — `/ai`

### POST `/ai/analyze-meal` — protected
```json
// Request (one of imageBase64 or imageUrl required)
{ "imageBase64?": "string", "imageUrl?": "string", "description?": "string" }
// Response 200 — GPT-4o analysis object
// 503 if OPENAI_API_KEY not set
```

### POST `/ai/generate-plan` — protected
```json
// Request
{ "age": "number", "height": "number", "weight": "number", "gender": "string", "goal": "string", "activityLevel": "string", "dietaryPreferences?": ["string"], "allergies?": ["string"], "budget?": "string", "days?": "number" }
// Response 200 — GPT-4o meal plan object
```

### GET `/ai/tip` — protected
```json
// Response 200
{ "tip": "string" }
// Returns fallback tip even if no API key
```

### POST `/ai/chat` — protected
```json
// Request
{ "messages": [{ "role": "user|assistant", "content": "string" }], "context?": { "todayCalories?", "dailyGoal?", "weight?", "goal?" } }
// Response 200
{ "message": "string" }
```

### GET `/ai/history` — protected
Query: `type?`, `limit=10`
```json
// Response 200
[{ "id", "userId", "type", "response", "prompt?", "imageUrl?", "createdAt" }]
```

---

## Achievements — `/achievements`

### GET `/achievements` — protected
```json
// Response 200
{ "achievements": [{ "id", "name", "description", "category", "points", "unlocked": "boolean", "unlockedAt?" }], "unlockedCount", "totalCount" }
```

### GET `/achievements/my` — protected
Returns only unlocked achievements with full achievement details.

### GET `/achievements/progress` — protected
```json
// Response 200
{ "xp", "level", "streak", "xpProgress", "xpNeeded", "progressPercent", "nextLevel" }
```

### GET `/achievements/challenges` — protected
Returns today's daily challenges with `completed` boolean.

### POST `/achievements/challenges/:id/complete` — protected
```json
// Response 200
{ "success": true, "xp": { "totalXP", "newLevel?", "leveledUp?" } }
// 409 if already completed today
```

### GET `/achievements/leaderboard` — protected
Query: `type=streak|xp` (default: `streak`), `limit=20`
```json
// Response 200
[{ "id", "username", "avatarUrl", "xp", "level", "streak" }]
```

---

## Social — `/social`

### GET `/social/users/search` — protected
Query: `q` (min 2 chars)
```json
// Response 200 — max 10 results
[{ "id", "username", "avatarUrl", "level", "streak" }]
```

### GET `/social/friends` — protected
Returns accepted friends list.

### GET `/social/friends/requests` — protected
Returns pending incoming friend requests.

### POST `/social/friends/request` — protected
```json
// Request
{ "friendId": "string" }
// Response 201 — friendship record
// 400 self-request | 404 user not found | 409 already exists
```

### PUT `/social/friends/request/:id/accept` — protected
```json
// Response 200 — updated friendship record
// 404 if request not found
```

### DELETE `/social/friends/:id` — protected
```json
// Response 200
{ "success": true }
```
