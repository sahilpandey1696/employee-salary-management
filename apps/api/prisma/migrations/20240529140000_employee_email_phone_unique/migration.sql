-- Normalize blank phones
UPDATE "Employee" SET "phone" = NULL WHERE "phone" IS NOT NULL AND trim("phone") = '';

-- Resolve duplicate emails before adding the unique index
UPDATE "Employee"
SET "email" = "email" || '_' || substr("id", -8)
WHERE "id" NOT IN (
  SELECT MIN("id") FROM "Employee" GROUP BY lower("email")
);

-- Resolve duplicate phones before adding the unique index
UPDATE "Employee"
SET "phone" = "phone" || '_' || substr("id", -4)
WHERE "phone" IS NOT NULL
  AND "id" NOT IN (
    SELECT MIN("id") FROM "Employee" WHERE "phone" IS NOT NULL GROUP BY "phone"
  );

CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");
CREATE UNIQUE INDEX "Employee_phone_key" ON "Employee"("phone");
