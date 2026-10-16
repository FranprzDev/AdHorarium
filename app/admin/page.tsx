import type { Metadata } from "next"
import { PRIVATE_PAGE_METADATA, PrivatePage } from "@/lib/page-metadata"
import { AdminSubjectsPanel } from "./_components/AdminSubjectsPanel"

export const metadata: Metadata = PRIVATE_PAGE_METADATA[PrivatePage.Admin]

export default function AdminPage() {
  return <AdminSubjectsPanel />
}
