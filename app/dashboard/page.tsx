"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import CurriculumBoard from "@/components/curriculum-board"
import ScheduleGenerator from "@/components/schedule-generator"
import { Tabs, Switch, Button } from "@/components/ui/acernity-ui"
import { coursesData2008 } from "@/data/courses-2008"
import { AuroraBackground } from "@/components/ui/aurora-background"
import { Calendar } from "lucide-react"

export default function Dashboard() {
  const [plan, setPlan] = useState<"2008" | "2023">("2008")
  const [filterType, setFilterType] = useState<"regulares" | "aprobadas">("regulares")
  const [filterPurpose, setFilterPurpose] = useState<"cursar" | "rendir">("cursar")
  const [hideElectives, setHideElectives] = useState<boolean>(true)
  const [showScheduleGenerator, setShowScheduleGenerator] = useState<boolean>(false)

  const coursesData = coursesData2008

  return (
    <AuroraBackground className="min-h-screen">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="sticky top-0 z-20 bg-white/10 dark:bg-black/20 backdrop-blur-md border-b border-white/10">
          <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-6">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold gradient-text">Plan de Correlativas</h1>
                  <p className="text-slate-200 mt-2 text-lg">Departamento de Sistemas - UTN FRT</p>
                </div>
                <Button
                  onClick={() => setShowScheduleGenerator(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2 px-4"
                >
                  <Calendar size={18} />
                  <span className="hidden md:inline">Generar Horario</span>
                </Button>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-white/10 dark:bg-black/20 p-2 rounded-lg shadow-sm">
                  <span className="text-sm text-slate-200">Para:</span>
                  <Tabs
                    tabs={[
                      { label: "Cursar", value: "cursar" },
                      { label: "Rendir", value: "rendir" },
                    ]}
                    value={filterPurpose}
                    onChange={(value) => setFilterPurpose(value as "cursar" | "rendir")}
                  />
                </div>

                <div className="flex items-center gap-2 bg-white/10 dark:bg-black/20 p-2 rounded-lg shadow-sm">
                  <span className="text-sm text-slate-200">Filtro:</span>
                  <Tabs
                    tabs={[
                      { label: "Regulares", value: "regulares" },
                      { label: "Aprobadas", value: "aprobadas" },
                    ]}
                    value={filterType}
                    onChange={(value) => setFilterType(value as "regulares" | "aprobadas")}
                  />
                </div>

                <div className="flex items-center gap-2 bg-white/10 dark:bg-black/20 p-2 rounded-lg shadow-sm">
                  <Switch checked={hideElectives} onChange={setHideElectives} label="Ocultar electivas" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1800px] mx-auto">
          <CurriculumBoard
            plan={plan}
            filterType={filterType}
            filterPurpose={filterPurpose}
            coursesData={coursesData}
            hideElectives={hideElectives}
          />
        </div>

        {showScheduleGenerator && (
          <ScheduleGenerator coursesData={coursesData} onClose={() => setShowScheduleGenerator(false)} />
        )}
      </motion.div>
    </AuroraBackground>
  )
}
