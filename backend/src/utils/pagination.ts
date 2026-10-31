export function buildMeta(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
