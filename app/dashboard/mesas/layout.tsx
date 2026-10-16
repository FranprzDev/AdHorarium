import type React from "react"
import type { Metadata } from "next"
import { PRIVATE_PAGE_METADATA, PrivatePage } from "@/lib/page-metadata"

export const metadata: Metadata = PRIVATE_PAGE_METADATA[PrivatePage.ExamTables]

export default function ExamTablesLayout({ children }: { children: React.ReactNode }) {
  return children
}
