export const knowledgeBaseTabItems = [
  {
    value: "articles",
    label: "Articles",
    emptyTitle: "Articles content goes here",
    emptyDescription:
      "The main knowledge base listing, filters, and states will plug into this section next.",
  },
  {
    value: "categories",
    label: "Categories",
    emptyTitle: "Categories content goes here",
    emptyDescription:
      "This area is reserved for category structure, grouping logic, and any supporting navigation.",
  },
  {
    value: "insights",
    label: "Insights",
    emptyTitle: "Insights content goes here",
    emptyDescription:
      "Performance, quality, and article effectiveness modules can be added here after the main content direction is set.",
  },
] as const

export type KnowledgeBaseTab = (typeof knowledgeBaseTabItems)[number]["value"]

export const knowledgeBasePageCopy = {
  createArticle: "New article",
  backToTicket: "Back to ticket",
  sourceTicketLabel: "Opened from ticket",
  placeholderEyebrow: "Main content placeholder",
  explorerStatusLabel: "Article status",
  articlesEmptyTitle: "No articles found",
  articlesEmptyDescription:
    "This knowledge base group is empty right now. Add or move articles here when the content model expands.",
}
