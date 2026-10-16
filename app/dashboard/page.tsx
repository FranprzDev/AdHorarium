import type { Metadata } from "next"
import { PRIVATE_PAGE_METADATA, PrivatePage } from "@/lib/page-metadata"
import CorrelativesGraph from "./_components/CorrelativesGraph"
import DashboardHeader from "./_components/DashboardHeader"

export const metadata: Metadata = PRIVATE_PAGE_METADATA[PrivatePage.Plan]

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <CorrelativesGraph />
    </div>
  )
}
