ALTER TABLE "Invoice" ADD COLUMN "requireSignature" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Invoice" ADD COLUMN "senderSignatureData" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "senderSignerName" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "senderSignatureDate" DATETIME;
ALTER TABLE "Invoice" ADD COLUMN "signatureData" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "signerName" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "signatureDate" DATETIME;
ALTER TABLE "Invoice" ADD COLUMN "signatureIp" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "signatureUserAgent" TEXT;
