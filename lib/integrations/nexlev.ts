// Types for YouTube channel data stored in revenue_cache.metadata
export interface YouTubeChannelData {
  channel_id: string
  channel_name: string
  subscribers: number
  total_views: number
  video_count: number
  rpm_usd: number           // Revenue Per Mille in USD
  estimated_monthly_revenue: number
  recent_videos: YouTubeVideo[]
  outlier_score?: number
}

export interface YouTubeVideo {
  id: string
  title: string
  published_at: string      // ISO date string
  views: number
  rpm_usd?: number
  outlier_score?: number
  thumbnail_url?: string
}

// Returns YouTube channel records from revenue_cache (source starts with 'youtube')
// Parses the metadata JSON field into YouTubeChannelData
export function parseYouTubeCache(
  rows: Array<{ source: string; amount_usd: number; metadata: unknown; updated_at: string }>
): YouTubeChannelData[] {
  return rows
    .filter(r => r.source.startsWith('youtube'))
    .map(r => {
      const meta = r.metadata as YouTubeChannelData | null
      if (!meta) return null
      return { ...meta, estimated_monthly_revenue: r.amount_usd }
    })
    .filter((r): r is YouTubeChannelData => r !== null)
}
