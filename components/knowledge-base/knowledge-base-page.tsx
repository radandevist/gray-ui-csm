"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { KnowledgeBaseArticlesExplorer } from "@/components/knowledge-base/knowledge-base-articles-explorer"
import {
  KnowledgeBaseContentPlaceholder,
  KnowledgeBasePageHeader,
} from "@/components/knowledge-base/knowledge-base-page-sections"
import {
  knowledgeBasePageCopy,
  knowledgeBaseTabItems,
  type KnowledgeBaseTab,
} from "@/components/knowledge-base/knowledge-base-page.copy"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getKnowledgeArticleExplorerGroups } from "@/lib/knowledge-base/mock-data"
import type { CsmTemplateMetric } from "@/lib/csm-routes"
import { tickets } from "@/lib/tickets/mock-data"

type KnowledgeBasePageProps = {
  title: string
  description: string
  metrics: CsmTemplateMetric[]
}

const defaultKnowledgeBaseTab: KnowledgeBaseTab = "articles"

function normalizeKnowledgeBaseTab(value: string | null): KnowledgeBaseTab {
  if (!value) return defaultKnowledgeBaseTab

  return (
    knowledgeBaseTabItems.find((item) => item.value === value)?.value ??
    defaultKnowledgeBaseTab
  )
}

function normalizeSelectedArticleId(value: string | null, articleIds: string[]) {
  if (value && articleIds.includes(value)) return value
  return articleIds[0] ?? null
}

export function KnowledgeBasePage({
  title,
  description,
}: KnowledgeBasePageProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = normalizeKnowledgeBaseTab(searchParams.get("tab"))
  const articleGroups = getKnowledgeArticleExplorerGroups()
  const articleIds = articleGroups.flatMap((group) =>
    group.articles.map((article) => article.id)
  )
  const selectedArticleId = normalizeSelectedArticleId(
    searchParams.get("article"),
    articleIds
  )
  const sourceTicketId = searchParams.get("sourceTicket")
  const sourceTicket =
    tickets.find((ticket) => ticket.id === sourceTicketId) ?? null

  const sourceTicketLabel = sourceTicket
    ? `${knowledgeBasePageCopy.sourceTicketLabel} ${sourceTicket.ticketNumber}`
    : null

  const replaceQuery = (
    nextTab: KnowledgeBaseTab,
    nextArticleId?: string | null
  ) => {
    const nextSearchParams = new URLSearchParams(searchParams.toString())
    if (nextTab === defaultKnowledgeBaseTab) {
      nextSearchParams.delete("tab")
    } else {
      nextSearchParams.set("tab", nextTab)
    }

    const articleId = nextArticleId ?? selectedArticleId
    if (articleId) {
      nextSearchParams.set("article", articleId)
    } else {
      nextSearchParams.delete("article")
    }

    const nextQuery = nextSearchParams.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <KnowledgeBasePageHeader
        title={title}
        description={description}
        sourceTicketLabel={sourceTicketLabel}
        backToTicketLabel={knowledgeBasePageCopy.backToTicket}
        createArticleLabel={knowledgeBasePageCopy.createArticle}
        onBackToTicket={
          sourceTicket ? () => router.push(`/tickets/${sourceTicket.id}`) : undefined
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(nextValue) =>
          replaceQuery(normalizeKnowledgeBaseTab(nextValue))
        }
        className="min-h-0 flex-1 gap-0"
      >
        <div className="shrink-0 border-b">
          <TabsList
            variant="line"
            className="w-full justify-start gap-2 rounded-none p-0"
          >
            {knowledgeBaseTabItems.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {knowledgeBaseTabItems.map((item) => (
          <TabsContent
            key={item.value}
            value={item.value}
            className="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden"
          >
            <div className="scrollbar-hidden h-full overflow-y-auto">
              {item.value === "articles" ? (
                <KnowledgeBaseArticlesExplorer
                  groups={articleGroups}
                  selectedArticleId={selectedArticleId}
                  onSelectArticle={(articleId) =>
                    replaceQuery(activeTab, articleId)
                  }
                />
              ) : (
                <div className="py-6">
                  <KnowledgeBaseContentPlaceholder
                    eyebrow={knowledgeBasePageCopy.placeholderEyebrow}
                    title={item.emptyTitle}
                    description={item.emptyDescription}
                  />
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
