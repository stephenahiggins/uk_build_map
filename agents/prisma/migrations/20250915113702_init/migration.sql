/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `EvidenceItem` table. All the data in the column will be lost.
  - You are about to alter the column `submittedById` on the `EvidenceItem` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to drop the column `updatedAt` on the `Project` table. All the data in the column will be lost.
  - You are about to alter the column `createdById` on the `Project` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- CreateTable
CREATE TABLE "User" (
    "user_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_name" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "user_password" TEXT NOT NULL,
    "user_refreshToken" TEXT,
    "reset_token" TEXT,
    "reset_token_expiration" DATETIME,
    "user_active" BOOLEAN NOT NULL DEFAULT true,
    "user_deleted" BOOLEAN NOT NULL DEFAULT false,
    "user_created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_updated_at" DATETIME NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'USER'
);

-- CreateTable
CREATE TABLE "LocalAuthority" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "website" TEXT,
    "countryCode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "regionId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Objective" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "orderIndex" INTEGER NOT NULL,
    CONSTRAINT "Objective_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KeyResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "objectiveId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "targetMetric" REAL,
    "currentMetric" REAL,
    "unit" TEXT,
    "dueDate" DATETIME,
    "ragStatus" TEXT NOT NULL,
    CONSTRAINT "KeyResult_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "boundingPolygon" JSONB
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EvidenceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "submittedById" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "source" TEXT,
    "url" TEXT,
    "datePublished" DATETIME,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moderationState" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "EvidenceItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvidenceItem_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EvidenceItem" ("createdAt", "description", "id", "projectId", "source", "submittedById", "summary", "title", "type") SELECT "createdAt", "description", "id", "projectId", "source", "submittedById", "summary", "title", "type" FROM "EvidenceItem";
DROP TABLE "EvidenceItem";
ALTER TABLE "new_EvidenceItem" RENAME TO "EvidenceItem";
CREATE INDEX "EvidenceItem_projectId_idx" ON "EvidenceItem"("projectId");
CREATE INDEX "EvidenceItem_submittedById_idx" ON "EvidenceItem"("submittedById");
CREATE INDEX "EvidenceItem_moderationState_idx" ON "EvidenceItem"("moderationState");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "regionId" TEXT,
    "localAuthorityId" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedCompletion" DATETIME,
    "status" TEXT NOT NULL,
    "statusUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusRationale" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "imageUrl" TEXT,
    CONSTRAINT "Project_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_localAuthorityId_fkey" FOREIGN KEY ("localAuthorityId") REFERENCES "LocalAuthority" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("createdAt", "createdById", "description", "id", "status", "title", "type") SELECT "createdAt", "createdById", "description", "id", "status", "title", "type" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_regionId_idx" ON "Project"("regionId");
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_localAuthorityId_idx" ON "Project"("localAuthorityId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_user_email_key" ON "User"("user_email");

-- CreateIndex
CREATE INDEX "User_user_active_idx" ON "User"("user_active");

-- CreateIndex
CREATE INDEX "User_user_deleted_idx" ON "User"("user_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "LocalAuthority_code_key" ON "LocalAuthority"("code");

-- CreateIndex
CREATE INDEX "Objective_projectId_orderIndex_idx" ON "Objective"("projectId", "orderIndex");

-- CreateIndex
CREATE INDEX "KeyResult_objectiveId_idx" ON "KeyResult"("objectiveId");

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");
