import type { TicketCategoryKey } from "@/lib/tickets/types"

export type KnowledgeArticleStatus = "published" | "draft" | "needs-review"

export type KnowledgeArticle = {
  id: string
  title: string
  summary: string
  category: TicketCategoryKey
  status: KnowledgeArticleStatus
  updatedAt: string
  author: {
    name: string
    avatarUrl?: string
  }
  matchScore: "high" | "medium" | "low"
  views: number
  helpfulRate: number
  linkedTickets: number
  matchReasons: string[]
  quickPath?: string
  media?: Array<
    | {
        type: "image"
        title: string
        caption: string
        src?: string
      }
    | {
        type: "video"
        title: string
        duration: string
      }
  >
  sections: Array<{
    title: string
    body: string
  }>
  customerReply: string
}

export type KnowledgeArticleExplorerGroup = {
  id: string
  label: string
  defaultOpen?: boolean
  articleIds: string[]
}

export type KnowledgeArticleResolvedGroup = {
  id: string
  label: string
  defaultOpen: boolean
  articles: KnowledgeArticle[]
}
