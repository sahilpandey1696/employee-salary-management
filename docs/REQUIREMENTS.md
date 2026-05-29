# Employee Salary Management — Requirements

## Purpose

Give HR managers a fast, reliable way to browse ~10,000 employees, inspect and update compensation, and understand payroll distribution at a glance.

## Primary user

**HR Manager** — manages employee salary data; no employee self-service in Phase 1.

## Scope (Phase 1)

### Employees

| Capability | Acceptance criteria |
|------------|---------------------|
| List | Paginated table; default page size 25; stable sort by name |
| Search | Match on name or employee ID; debounced; results within 300ms on seeded data |
| Filter | Filter by country; combinable with search |
| Pagination | Page controls; total count visible |

### Salary

| Capability | Acceptance criteria |
|------------|---------------------|
| View | Show amount, currency, effective date for selected employee |
| Edit | Update amount with validation (positive, max precision) |
| Create | Add salary record when none exists; one active record per employee |

### Dashboard

| Capability | Acceptance criteria |
|------------|---------------------|
| Total payroll | Sum of active salaries across employees |
| Average salary | Mean of active salaries |
| Country breakdown | Payroll and headcount grouped by country |

## Non-functional requirements

- **Performance:** List/search/filter remain responsive with 10k records (indexed DB queries, server-side pagination).
- **UX:** Loading skeletons, empty states, error states, confirmation before destructive salary changes.
- **Quality:** TypeScript strict mode; unit tests for domain and API; no `console.log`, TODOs, or dead code.
- **Maintainability:** Clear separation — domain logic, API layer, UI components.

## Out of scope (Phase 1)

- Authentication / RBAC
- Audit history and approval workflows
- Multi-currency conversion
- Bulk import/export
- Employee create/delete

## Data model (conceptual)

- **Employee:** id, employeeNumber, fullName, country, department (optional)
- **Salary:** id, employeeId, amount (decimal), currency, effectiveFrom, isActive

## Success criteria

HR can find an employee, view or edit salary, and answer “what is total payroll and how does it split by country?” without leaving the application.
