export interface Queryable {
  query(
    text: string,
    params?: unknown[]
  ): Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>;
}
