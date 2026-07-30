ALTER TABLE "BusinessProfile" ADD COLUMN "clientTerms" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "clientTerms" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "termsAcceptedAt" DATETIME;
ALTER TABLE "Invoice" ADD COLUMN "termsAcceptedIp" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "termsAcceptedUserAgent" TEXT;
