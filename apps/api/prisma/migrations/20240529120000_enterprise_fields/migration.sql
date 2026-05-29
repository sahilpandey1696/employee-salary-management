PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "employmentStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joiningDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "new_Employee" (
    "id",
    "employeeNumber",
    "firstName",
    "lastName",
    "fullName",
    "email",
    "phone",
    "country",
    "department",
    "jobTitle",
    "employmentStatus",
    "joiningDate",
    "createdAt"
)
SELECT
    "id",
    "employeeNumber",
    substr("fullName", 1, instr("fullName" || ' ', ' ') - 1),
    trim(substr("fullName", instr("fullName" || ' ', ' '))),
    "fullName",
    lower(replace("employeeNumber", 'E', 'emp')) || '@acme.org',
    NULL,
    "country",
    coalesce("department", 'Operations'),
    'Team Member',
    'ACTIVE',
    datetime('2024-01-01'),
    "createdAt"
FROM "Employee";

DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";

CREATE UNIQUE INDEX "Employee_employeeNumber_key" ON "Employee"("employeeNumber");
CREATE INDEX "Employee_country_idx" ON "Employee"("country");
CREATE INDEX "Employee_fullName_idx" ON "Employee"("fullName");
CREATE INDEX "Employee_employeeNumber_idx" ON "Employee"("employeeNumber");
CREATE INDEX "Employee_email_idx" ON "Employee"("email");
CREATE INDEX "Employee_employmentStatus_idx" ON "Employee"("employmentStatus");
CREATE INDEX "Employee_department_idx" ON "Employee"("department");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
