ALTER TABLE "BusinessProfile" ADD COLUMN "addressLine1" TEXT;
ALTER TABLE "BusinessProfile" ADD COLUMN "addressLine2" TEXT;
ALTER TABLE "BusinessProfile" ADD COLUMN "city" TEXT;
ALTER TABLE "BusinessProfile" ADD COLUMN "state" TEXT;
ALTER TABLE "BusinessProfile" ADD COLUMN "postalCode" TEXT;
ALTER TABLE "BusinessProfile" ADD COLUMN "country" TEXT;

ALTER TABLE "Invoice" ADD COLUMN "brandAddressLine1" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "brandAddressLine2" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "brandCity" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "brandState" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "brandPostalCode" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "brandCountry" TEXT;
