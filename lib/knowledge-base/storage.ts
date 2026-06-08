import {
  knowledgeArticleExplorerGroups,
  knowledgeArticles,
} from "@/lib/knowledge-base/mock-data"
import type {
  KnowledgeArticle,
  KnowledgeBaseStorageSnapshot,
} from "@/lib/knowledge-base/types"

const STORAGE_KEY = "gray-ui-csm:knowledge-base"
const LEGACY_ARTICLES_KEY = "gray-ui-csm:knowledge-base-articles"

export const KNOWLEDGE_BASE_STORAGE_UPDATED_EVENT =
  "gray-ui-csm:knowledge-base-updated"

export function getDefaultKnowledgeBaseSnapshot(): KnowledgeBaseStorageSnapshot {
  return {
    version: 1,
    articles: knowledgeArticles,
    groups: knowledgeArticleExplorerGroups,
  }
}

function isKnowledgeArticle(value: unknown): value is KnowledgeArticle {
  if (!value || typeof value !== "object") return false
  const record = value as KnowledgeArticle
  return typeof record.id === "string" && typeof record.title === "string"
}

function isKnowledgeArticleArray(value: unknown): value is KnowledgeArticle[] {
  return Array.isArray(value) && value.every(isKnowledgeArticle)
}

function isKnowledgeBaseStorageSnapshot(
  value: unknown
): value is KnowledgeBaseStorageSnapshot {
  if (!value || typeof value !== "object") return false

  const snapshot = value as KnowledgeBaseStorageSnapshot
  return (
    snapshot.version === 1 &&
    isKnowledgeArticleArray(snapshot.articles) &&
    Array.isArray(snapshot.groups) &&
    snapshot.groups.every(
      (group) =>
        typeof group.id === "string" &&
        typeof group.label === "string" &&
        Array.isArray(group.articleIds)
    )
  )
}

function migrateLegacyArticleStorage(
  articles: KnowledgeArticle[],
  fallbackGroups: KnowledgeBaseStorageSnapshot["groups"]
): KnowledgeBaseStorageSnapshot {
  return {
    version: 1,
    articles,
    groups: fallbackGroups,
  }
}

export function loadKnowledgeBaseSnapshot(
  fallback: KnowledgeBaseStorageSnapshot = getDefaultKnowledgeBaseSnapshot()
): KnowledgeBaseStorageSnapshot {
  if (typeof window === "undefined") return fallback

  try {
    const rawSnapshot = window.localStorage.getItem(STORAGE_KEY)
    if (rawSnapshot) {
      const parsed = JSON.parse(rawSnapshot) as unknown
      if (isKnowledgeBaseStorageSnapshot(parsed)) {
        return parsed
      }
    }

    const rawLegacyArticles = window.localStorage.getItem(LEGACY_ARTICLES_KEY)
    if (rawLegacyArticles) {
      const parsedLegacy = JSON.parse(rawLegacyArticles) as unknown
      if (isKnowledgeArticleArray(parsedLegacy)) {
        const migrated = migrateLegacyArticleStorage(parsedLegacy, fallback.groups)
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
          window.localStorage.removeItem(LEGACY_ARTICLES_KEY)
          notifyKnowledgeBaseStorageUpdated()
        } catch {
          // Ignore quota and serialization errors for local prototype persistence.
        }
        return migrated
      }
    }
  } catch {
    return fallback
  }

  return fallback
}

function notifyKnowledgeBaseStorageUpdated() {
  if (typeof window === "undefined") return

  window.dispatchEvent(new Event(KNOWLEDGE_BASE_STORAGE_UPDATED_EVENT))
}

export function saveKnowledgeBaseSnapshot(snapshot: KnowledgeBaseStorageSnapshot) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    notifyKnowledgeBaseStorageUpdated()
  } catch {
    // Ignore quota and serialization errors for local prototype persistence.
  }
}

export function loadKnowledgeArticlesFromStorage(
  fallback: KnowledgeArticle[] = knowledgeArticles
): KnowledgeArticle[] {
  return loadKnowledgeBaseSnapshot({
    version: 1,
    articles: fallback,
    groups: knowledgeArticleExplorerGroups,
  }).articles
}

export function saveKnowledgeArticlesToStorage(articles: KnowledgeArticle[]) {
  const currentSnapshot = loadKnowledgeBaseSnapshot()
  saveKnowledgeBaseSnapshot({
    ...currentSnapshot,
    articles,
  })
}
