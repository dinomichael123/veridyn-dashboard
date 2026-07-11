export interface SemrushData {
  domain: string
  domain_rank: number           // Domain Rating equivalent
  organic_traffic: number       // Estimated monthly organic visits
  organic_keywords: number      // Total ranking keywords
  backlinks: number
  referring_domains: number
  top_keywords: Array<{ keyword: string; position: number; volume: number }>
  traffic_trend: number[]       // Last 6 months traffic (oldest first)
}

export function parseSemrushCache(
  rows: Array<{ source: string; amount_usd: number; metadata: unknown; updated_at: string }>
): SemrushData | null {
  const row = rows.find(r => r.source === 'semrush_organic')
  if (!row?.metadata) return null
  return row.metadata as SemrushData
}
