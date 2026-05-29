export function formatEmployeeNumber(sequence: number): string {
  return `EMP${sequence.toString().padStart(5, "0")}`;
}
