PRAGMA foreign_keys=OFF;

ALTER TABLE "Invoice" ADD COLUMN "sourceEstimateId" TEXT;

CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "publicToken" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientName" TEXT,
    "description" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "taxPercent" REAL NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "brandBusinessName" TEXT,
    "brandLogoUrl" TEXT,
    "brandColor" TEXT,
    "brandSupportEmail" TEXT,
    "brandAddressLine1" TEXT,
    "brandAddressLine2" TEXT,
    "brandCity" TEXT,
    "brandState" TEXT,
    "brandPostalCode" TEXT,
    "brandCountry" TEXT,
    "brandFooter" TEXT,
    "clientTerms" TEXT,
    "clientNote" TEXT,
    "privateMemo" TEXT,
    "expiresAt" DATETIME,
    "sentAt" DATETIME,
    "viewedAt" DATETIME,
    "acceptedAt" DATETIME,
    "declinedAt" DATETIME,
    "canceledAt" DATETIME,
    "convertedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Estimate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Estimate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "EstimateLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estimateId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "productName" TEXT,
    "productType" TEXT,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitAmount" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "EstimateLineItem_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EstimateLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Invoice_sourceEstimateId_key" ON "Invoice"("sourceEstimateId");
CREATE UNIQUE INDEX "Estimate_publicToken_key" ON "Estimate"("publicToken");
CREATE INDEX "Estimate_userId_idx" ON "Estimate"("userId");
CREATE INDEX "Estimate_clientId_idx" ON "Estimate"("clientId");
CREATE INDEX "EstimateLineItem_estimateId_idx" ON "EstimateLineItem"("estimateId");
CREATE INDEX "EstimateLineItem_productId_idx" ON "EstimateLineItem"("productId");

PRAGMA foreign_keys=ON;
