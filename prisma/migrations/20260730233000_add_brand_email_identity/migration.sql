ALTER TABLE "BusinessProfile" ADD COLUMN "emailSenderName" TEXT;
ALTER TABLE "BusinessProfile" ADD COLUMN "replyToEmail" TEXT;

UPDATE "BusinessProfile"
SET
  "emailSenderName" = COALESCE("businessName", 'Invoice by iDesignLC'),
  "replyToEmail" = "supportEmail"
WHERE "emailSenderName" IS NULL OR "replyToEmail" IS NULL;
