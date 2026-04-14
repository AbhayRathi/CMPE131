-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "test_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "typed_text" TEXT NOT NULL,
    "duration_sec" INTEGER NOT NULL,
    "wpm" REAL NOT NULL,
    "accuracy" REAL NOT NULL,
    "error_count" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'easy',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "test_sessions_username_fkey" FOREIGN KEY ("username") REFERENCES "users" ("username") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
