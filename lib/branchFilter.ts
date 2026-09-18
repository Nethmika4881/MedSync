// lib/branchFilter.ts
//
// Pure utility for filtering mock data arrays by branch_id.
//
// PURPOSE:
//   In production, every Front Desk SQL query will include:
//     AND branch_id = $n
//   This helper replicates that constraint for mock data during UI development,
//   keeping the same contract so page components don't need to change when
//   real database queries are wired in.
//
// USAGE EXAMPLE (in any Front Desk page):
//   const branchAppts = filterByBranch(mockAppointments, activeBranchId, "branch_id");
//
// INVARIANT:
//   This is a pure function — no side effects, no store reads.
//   The caller is responsible for reading activeBranchId from useBranchStore.

// ─── Generic branch filter ───────────────────────────────────────────────────

/**
 * Filters an array of records to only those matching the given branchId.
 *
 * @param records      - Array of any objects that contain a branch id field.
 * @param branchId     - The active branch ID to filter by. If null, returns
 *                       all records unfiltered (safe default for non-scoped roles).
 * @param branchKey    - The key on each record that holds the branch id.
 *                       Defaults to "branchId" (camelCase used in mock data).
 */
export function filterByBranch<T extends Record<string, unknown>>(
  records: T[],
  branchId: string | null,
  branchKey: keyof T = "branchId" as keyof T
): T[] {
  // If no branch is active (e.g. admin viewing all branches), return everything.
  if (!branchId) return records;

  return records.filter((record) => record[branchKey] === branchId);
}
