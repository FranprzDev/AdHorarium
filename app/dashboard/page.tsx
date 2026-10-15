"use client"

import CorrelativesGraph from "./_components/CorrelativesGraph"
import DashboardHeader from "./_components/DashboardHeader"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <CorrelativesGraph />
    </div>
  )
}
