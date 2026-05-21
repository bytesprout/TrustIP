-- CreateEnum
CREATE TYPE "DatasetStatus" AS ENUM ('PENDING', 'DOWNLOADING', 'VALIDATING', 'ACTIVE', 'FAILED', 'ROLLING_BACK');

-- CreateTable
CREATE TABLE "DatasetRegistry" (
    "id" TEXT NOT NULL,
    "datasetName" TEXT NOT NULL,
    "datasetType" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "version" TEXT,
    "checksum" TEXT,
    "size" BIGINT,
    "status" "DatasetStatus" NOT NULL DEFAULT 'PENDING',
    "lastUpdatedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "rollbackVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatasetRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetUpdateLog" (
    "id" TEXT NOT NULL,
    "datasetName" TEXT NOT NULL,
    "version" TEXT,
    "status" "DatasetStatus" NOT NULL,
    "durationMs" INTEGER,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatasetUpdateLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatasetRegistry_datasetName_key" ON "DatasetRegistry"("datasetName");

-- CreateIndex
CREATE INDEX "DatasetRegistry_datasetType_idx" ON "DatasetRegistry"("datasetType");

-- CreateIndex
CREATE INDEX "DatasetRegistry_status_idx" ON "DatasetRegistry"("status");

-- CreateIndex
CREATE INDEX "DatasetUpdateLog_datasetName_idx" ON "DatasetUpdateLog"("datasetName");

-- CreateIndex
CREATE INDEX "DatasetUpdateLog_status_idx" ON "DatasetUpdateLog"("status");

-- CreateIndex
CREATE INDEX "DatasetUpdateLog_createdAt_idx" ON "DatasetUpdateLog"("createdAt");
