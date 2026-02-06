-- CreateTable
CREATE TABLE "Paste" (
    "id" BIGSERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "key" VARCHAR(32) NOT NULL,
    "content" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "passwordProtected" BOOLEAN NOT NULL DEFAULT false,
    "initVector" VARCHAR(64),
    "language" VARCHAR(64) NOT NULL DEFAULT 'plaintext',
    "expiresAt" TIMESTAMP(3),
    "expiresCount" INTEGER,
    "readCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Paste_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Paste_key_key" ON "Paste"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Paste_initVector_key" ON "Paste"("initVector");

-- CreateIndex
CREATE INDEX "Paste_key_idx" ON "Paste"("key");
