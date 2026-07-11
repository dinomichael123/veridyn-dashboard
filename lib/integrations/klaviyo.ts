export interface KlaviyoData {
  list_size: number
  open_rate: number             // 0-100 percentage
  click_rate: number            // 0-100 percentage
  attributed_revenue_mtd: number
  campaigns: Array<{ name: string; sent_at: string; open_rate: number; revenue: number }>
}

export function parseKlaviyoCache(
  rows: Array<{ source: string; amount_usd: number; metadata: unknown; updated_at: string }>
): KlaviyoData | null {
  const row = rows.find(r => r.source === 'klaviyo')
  if (!row?.metadata) return null
  return row.metadata as KlaviyoData
}
