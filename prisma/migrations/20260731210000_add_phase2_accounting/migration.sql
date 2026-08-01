PRAGMA foreign_keys=OFF;

CREATE TABLE "InvoiceAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceAuditLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "SaleReceipt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerAddress" TEXT,
    "saleDate" DATETIME NOT NULL,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "taxPercent" REAL NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SaleReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SaleReceipt_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "SaleReceiptLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleReceiptId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitAmount" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SaleReceiptLineItem_saleReceiptId_fkey" FOREIGN KEY ("saleReceiptId") REFERENCES "SaleReceipt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PaymentReminderSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "daysBeforeDue" TEXT NOT NULL DEFAULT '[]',
    "daysAfterDue" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentReminderSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "PaymentReminderSent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "daysOffset" INTEGER NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentReminderSent_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "InvoiceAuditLog_invoiceId_idx" ON "InvoiceAuditLog"("invoiceId");
CREATE UNIQUE INDEX "SaleReceipt_userId_receiptNumber_key" ON "SaleReceipt"("userId", "receiptNumber");
CREATE INDEX "SaleReceipt_userId_idx" ON "SaleReceipt"("userId");
CREATE INDEX "SaleReceipt_clientId_idx" ON "SaleReceipt"("clientId");
CREATE INDEX "SaleReceiptLineItem_saleReceiptId_idx" ON "SaleReceiptLineItem"("saleReceiptId");
CREATE UNIQUE INDEX "PaymentReminderSettings_userId_key" ON "PaymentReminderSettings"("userId");
CREATE UNIQUE INDEX "PaymentReminderSent_invoiceId_daysOffset_key" ON "PaymentReminderSent"("invoiceId", "daysOffset");
CREATE INDEX "PaymentReminderSent_invoiceId_idx" ON "PaymentReminderSent"("invoiceId");

PRAGMA foreign_keys=ON;
