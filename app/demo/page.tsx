"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Info } from "lucide-react"
import CurriculumBoard from "@/components/curriculum-board"
import { Tabs, Switch } from "@/components/ui/acernity-ui"
import { Button } from "@/components/ui/button"
import { coursesData2008 } from "@/data/courses-2008"
import { PublicHeader } from "@/components/layout/public-header"
import { PageHeader } from "@/components/brand/page-header"
import { CorrelativePurpose, CorrelativeType } from "@/types/enums"

const CORRELATIVE_PURPOSE_VALUES = new Set<string>(Object.values(CorrelativePurpose))
const CORRELATIVE_TYPE_VALUES = new Set<string>(Object.values(CorrelativeType))

function isCorrelativePurpose(value: string): value is CorrelativePurpose {
  return CORRELATIVE_PURPOSE_VALUES.has(value)
}

function isCorrelativeType(value: string): value is CorrelativeType {
  return CORRELATIVE_TYPE_VALUES.has(value)
}

export default function DemoPage() {
  const [filterType, setFilterType] = useState<CorrelativeType>(CorrelativeType.Regulares)
  const [filterPurpose, setFilterPurpose] = useState<CorrelativePurpose>(CorrelativePurpose.Cursar)
  const [hideElectives, setHideElectives] = useState<boolean>(true)

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 md:px-8 md:py-8">
        <PageHeader
          eyebrow="Departamento de Sistemas - UTN FRT"
          title="Demo - Plan de Correlativas"
          actions={
            <Button asChild variant="outline" className="bg-card">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio
              </Link>
            </Button>
          }
        />

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1.5 pl-3">
            <span className="text-sm text-muted-foreground">Para:</span>
            <Tabs
              tabs={[
                { label: "Cursar", value: CorrelativePurpose.Cursar },
                { label: "Rendir", value: CorrelativePurpose.Rendir },
              ]}
              value={filterPurpose}
              onChange={(value) => {
                if (isCorrelativePurpose(value)) setFilterPurpose(value)
              }}
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1.5 pl-3">
            <span className="text-sm text-muted-foreground">Filtro:</span>
            <Tabs
              tabs={[
                { label: "Regulares", value: CorrelativeType.Regulares },
                { label: "Aprobadas", value: CorrelativeType.Aprobadas },
              ]}
              value={filterType}
              onChange={(value) => {
                if (isCorrelativeType(value)) setFilterType(value)
              }}
            />
          </div>

          <div className="flex items-center rounded-lg border border-border bg-card px-3 py-2">
            <Switch checked={hideElectives} onChange={setHideElectives} label="Ocultar electivas" />
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-brand/40 bg-brand/10 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-strong" />
          <div>
            <h2 className="font-medium text-foreground">Modo Demo</h2>
            <p className="text-sm text-muted-foreground">
              Esta es una versión de demostración del Plan de Correlativas. Para acceder a todas las funcionalidades,
              incluyendo el Gestor de Materias y el Buscador de Mesa, creá tu cuenta o iniciá sesión.
            </p>
          </div>
        </div>

        <CurriculumBoard
          filterType={filterType}
          filterPurpose={filterPurpose}
          coursesData={coursesData2008}
          hideElectives={hideElectives}
        />
      </main>
    </div>
  )
}
