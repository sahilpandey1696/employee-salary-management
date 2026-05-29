export function buildTestEmployee(
  overrides: Partial<{
    employeeNumber: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string | null;
    country: string;
    department: string;
    jobTitle: string;
    employmentStatus: string;
    joiningDate: Date;
  }> = {},
) {
  const firstName = overrides.firstName ?? "Alice";
  const lastName = overrides.lastName ?? "Anderson";

  return {
    employeeNumber: overrides.employeeNumber ?? "E100",
    firstName,
    lastName,
    fullName: overrides.fullName ?? `${firstName} ${lastName}`,
    email: overrides.email ?? `${firstName.toLowerCase()}@acme.org`,
    phone: overrides.phone ?? null,
    country: overrides.country ?? "United States",
    department: overrides.department ?? "Engineering",
    jobTitle: overrides.jobTitle ?? "Software Engineer",
    employmentStatus: overrides.employmentStatus ?? "ACTIVE",
    joiningDate: overrides.joiningDate ?? new Date("2024-01-01"),
  };
}
