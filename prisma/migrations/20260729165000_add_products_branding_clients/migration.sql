PRAGMA foreign_keys=OFF;

CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "stripeCustomerId" TEXT,
    "lastInvoicedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unitAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "type" TEXT NOT NULL DEFAULT 'service',
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "businessName" TEXT,
    "logoUrl" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#c81010',
    "supportEmail" TEXT,
    "website" TEXT,
    "invoiceFooter" TEXT,
    "defaultTermsDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BusinessProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Invoice_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "publicToken" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "invoicePdfUrl" TEXT,
    "stripeNumber" TEXT,
    "clientEmail" TEXT NOT NULL,
    "clientName" TEXT,
    "description" TEXT NOT NULL,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "taxPercent" REAL NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL,
    "feeAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "hostedInvoiceUrl" TEXT,
    "deliveryMode" TEXT NOT NULL DEFAULT 'stripe_email',
    "brandBusinessName" TEXT,
    "brandLogoUrl" TEXT,
    "brandColor" TEXT,
    "brandSupportEmail" TEXT,
    "brandFooter" TEXT,
    "dueDate" DATETIME,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "Invoice_new" (
    "id",
    "userId",
    "clientId",
    "publicToken",
    "stripeInvoiceId",
    "stripeCustomerId",
    "invoicePdfUrl",
    "stripeNumber",
    "clientEmail",
    "clientName",
    "description",
    "subtotal",
    "taxPercent",
    "taxAmount",
    "amount",
    "feeAmount",
    "currency",
    "status",
    "hostedInvoiceUrl",
    "deliveryMode",
    "brandBusinessName",
    "brandLogoUrl",
    "brandColor",
    "brandSupportEmail",
    "brandFooter",
    "dueDate",
    "paidAt",
    "createdAt"
)
SELECT
    "id",
    "userId",
    NULL,
    lower(hex(randomblob(16))),
    "stripeInvoiceId",
    "stripeCustomerId",
    NULL,
    NULL,
    "clientEmail",
    "clientName",
    "description",
    "subtotal",
    "taxPercent",
    "taxAmount",
    "amount",
    "feeAmount",
    "currency",
    "status",
    "hostedInvoiceUrl",
    'stripe_email',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    "dueDate",
    "paidAt",
    "createdAt"
FROM "Invoice";

CREATE TABLE "InvoiceLineItem_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "description" TEXT NOT NULL,
    "productName" TEXT,
    "productType" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitAmount" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice_new" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvoiceLineItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "InvoiceLineItem_new" (
    "id",
    "invoiceId",
    "productId",
    "description",
    "productName",
    "productType",
    "quantity",
    "unitAmount",
    "amount",
    "position"
)
SELECT
    "id",
    "invoiceId",
    NULL,
    "description",
    "description",
    NULL,
    "quantity",
    "unitAmount",
    "amount",
    "position"
FROM "InvoiceLineItem";

DROP TABLE "InvoiceLineItem";
DROP TABLE "Invoice";
ALTER TABLE "Invoice_new" RENAME TO "Invoice";
ALTER TABLE "InvoiceLineItem_new" RENAME TO "InvoiceLineItem";

CREATE INDEX "Client_userId_idx" ON "Client"("userId");
CREATE UNIQUE INDEX "Client_userId_email_key" ON "Client"("userId", "email");
CREATE INDEX "Product_userId_idx" ON "Product"("userId");
CREATE UNIQUE INDEX "Product_userId_name_key" ON "Product"("userId", "name");
CREATE UNIQUE INDEX "BusinessProfile_userId_key" ON "BusinessProfile"("userId");
CREATE UNIQUE INDEX "Invoice_publicToken_key" ON "Invoice"("publicToken");
CREATE UNIQUE INDEX "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId");
CREATE INDEX "Invoice_userId_idx" ON "Invoice"("userId");
CREATE INDEX "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");
CREATE INDEX "InvoiceLineItem_productId_idx" ON "InvoiceLineItem"("productId");

PRAGMA foreign_keys=ON;
