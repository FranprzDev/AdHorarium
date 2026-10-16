export const ADMIN_PAGE_SIZE = 25

export type Page<T> = {
  items: T[]
  /** 1-based page actually shown, clamped to the available range. */
  page: number
  pageCount: number
  total: number
  /** 1-based position of the first item shown; 0 when there are no items. */
  firstItem: number
  lastItem: number
}

/** Slices one page out of an already filtered list, clamping out-of-range pages to the nearest valid one. */
export function paginate<T>(items: T[], requestedPage: number, pageSize: number): Page<T> {
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, Math.trunc(requestedPage)), pageCount)
  const start = (page - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)
  return {
    items: pageItems,
    page,
    pageCount,
    total,
    firstItem: total === 0 ? 0 : start + 1,
    lastItem: start + pageItems.length,
  }
}
