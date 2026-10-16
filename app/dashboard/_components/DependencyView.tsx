"use client";

import type { PlanSubject } from "@/types/types";
import SubjectCard from "./SubjectCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getEnabledSubjects, getPrerequisiteSubjects } from "@/lib/correlatives";

interface DependencyViewProps {
  selectedSubject: PlanSubject;
  allSubjects: PlanSubject[];
  onClose: () => void;
}

export default function DependencyView({ selectedSubject, allSubjects, onClose }: DependencyViewProps) {
  const prerequisites = getPrerequisiteSubjects(selectedSubject, allSubjects);
  const dependencies = getEnabledSubjects(selectedSubject, allSubjects);

  return (
    <div>
        <Button onClick={onClose} variant="ghost" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver al Plan de Estudios
        </Button>

        <div className="surface-card p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col">
                    <h3 className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
                        NECESITÁS PARA CURSAR
                    </h3>
                    <div className="space-y-2">
                        {prerequisites.length > 0 ? (
                            prerequisites.map(subject => <SubjectCard key={subject.id} subject={subject} />)
                        ) : (
                            <p className="pt-4 text-center text-sm text-muted-foreground">No tiene requisitos previos.</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col rounded-xl bg-muted/50 p-3">
                    <h3 className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                        MATERIA SELECCIONADA
                    </h3>
                    <div className="space-y-2">
                        <SubjectCard subject={selectedSubject} />
                    </div>
                </div>
                <div className="flex flex-col">
                    <h3 className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                        HABILITA PARA CURSAR
                    </h3>
                    <div className="space-y-2">
                        {dependencies.length > 0 ? (
                            dependencies.map(subject => <SubjectCard key={subject.id} subject={subject} />)
                        ) : (
                             <p className="pt-4 text-center text-sm text-muted-foreground">No habilita materias futuras.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
} 