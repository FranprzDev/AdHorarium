import { describe, expect, it } from "vitest"
import { PRIVATE_PAGE_METADATA } from "@/lib/page-metadata"

const entries = Object.values(PRIVATE_PAGE_METADATA)

describe("private page metadata", () => {
  it("gives every page a distinct title without the brand (the root template appends it)", () => {
    const titles = entries.map((entry) => entry.title)
    expect(new Set(titles).size).toBe(titles.length)
    expect(titles.some((title) => title.includes("AdHorarium"))).toBe(false)
  })

  it("keeps descriptions within the length search snippets show", () => {
    for (const entry of entries) {
      expect(entry.description.length).toBeGreaterThan(40)
      expect(entry.description.length).toBeLessThanOrEqual(160)
    }
  })
})
