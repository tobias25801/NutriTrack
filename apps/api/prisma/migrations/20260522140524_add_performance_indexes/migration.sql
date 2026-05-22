-- CreateIndex
CREATE INDEX "ai_analyses_userId_type_idx" ON "ai_analyses"("userId", "type");

-- CreateIndex
CREATE INDEX "foods_createdById_idx" ON "foods"("createdById");

-- CreateIndex
CREATE INDEX "foods_isPublic_name_idx" ON "foods"("isPublic", "name");

-- CreateIndex
CREATE INDEX "friendships_friendId_idx" ON "friendships"("friendId");

-- CreateIndex
CREATE INDEX "meal_entries_foodId_idx" ON "meal_entries"("foodId");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "user_achievements_userId_idx" ON "user_achievements"("userId");

-- CreateIndex
CREATE INDEX "user_challenges_userId_date_idx" ON "user_challenges"("userId", "date");
