PRAGMA foreign_keys=OFF;

CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "payType" TEXT NOT NULL,
    "payRate" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "PtoBalance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "hoursAccrued" REAL NOT NULL DEFAULT 0,
    "hoursUsed" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PtoBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PayRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "payPeriodStart" DATETIME NOT NULL,
    "payPeriodEnd" DATETIME NOT NULL,
    "payDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "PayRunItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "grossPay" INTEGER NOT NULL,
    "federalTax" INTEGER NOT NULL DEFAULT 0,
    "stateTax" INTEGER NOT NULL DEFAULT 0,
    "socialSecurity" INTEGER NOT NULL DEFAULT 0,
    "medicare" INTEGER NOT NULL DEFAULT 0,
    "otherDeductions" INTEGER NOT NULL DEFAULT 0,
    "netPay" INTEGER NOT NULL,
    CONSTRAINT "PayRunItem_payRunId_fkey" FOREIGN KEY ("payRunId") REFERENCES "PayRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayRunItem_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "FxRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "asOf" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FxRate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "unitCost" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "InventoryAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventoryItemId" TEXT NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryAdjustment_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Employee_userId_idx" ON "Employee"("userId");
CREATE UNIQUE INDEX "PtoBalance_employeeId_key" ON "PtoBalance"("employeeId");
CREATE INDEX "PayRun_userId_idx" ON "PayRun"("userId");
CREATE INDEX "PayRunItem_payRunId_idx" ON "PayRunItem"("payRunId");
CREATE INDEX "PayRunItem_employeeId_idx" ON "PayRunItem"("employeeId");
CREATE UNIQUE INDEX "FxRate_userId_fromCurrency_toCurrency_asOf_key" ON "FxRate"("userId", "fromCurrency", "toCurrency", "asOf");
CREATE INDEX "FxRate_userId_idx" ON "FxRate"("userId");
CREATE UNIQUE INDEX "InventoryItem_productId_key" ON "InventoryItem"("productId");
CREATE INDEX "InventoryItem_userId_idx" ON "InventoryItem"("userId");
CREATE INDEX "InventoryAdjustment_inventoryItemId_idx" ON "InventoryAdjustment"("inventoryItemId");

PRAGMA foreign_keys=ON;
