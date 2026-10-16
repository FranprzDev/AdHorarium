import { describe, expect, it } from "vitest"
import { paginate } from "@/lib/pagination"

const items = Array.from({ length: 53 }, (_, index) => index + 1)

describe("paginate", () => {
  it("returns the requested page with its item range", () => {
    const second = paginate(items, 2, 25)
    expect(second.items).toEqual(items.slice(25, 50))
    expect(second).toMatchObject({ page: 2, pageCount: 3, total: 53, firstItem: 26, lastItem: 50 })
  })

  it("keeps a short last page", () => {
    expect(paginate(items, 3, 25)).toMatchObject({ items: [51, 52, 53], firstItem: 51, lastItem: 53 })
  })

  it("clamps pages outside the range", () => {
    expect(paginate(items, 9, 25).page).toBe(3)
    expect(paginate(items, 0, 25).page).toBe(1)
  })

  it("reports one empty page for an empty list", () => {
    expect(paginate([], 4, 25)).toEqual({ items: [], page: 1, pageCount: 1, total: 0, firstItem: 0, lastItem: 0 })
  })
})
