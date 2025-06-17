"use client";

import { Subject } from "@/types/types";
import SubjectCard from "./SubjectCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface DependencyViewProps {
  selectedSubject: Subject;
  allSubjects: Subject[];
  onClose: () => void;
}

export default function DependencyView({ selectedSubject, allSubjects, onClose }: DependencyViewProps) {
  const prerequisites = allSubjects.filter(s =>
    selectedSubject.must_approve_names.includes(s.subject_name) ||
    selectedSubject.must_take_names.includes(s.subject_name)
  ).sort((a, b) => a.nivel.localeCompare(b.nivel));

  const dependencies = allSubjects.filter(s =>
    selectedSubject.enables_names.includes(s.subject_name)
  ).sort((a, b) => a.nivel.localeCompare(b.nivel));

  return (
    <div className="p-4 md:p-8 animate-fade-in">
        <Button onClick={onClose} variant="ghost" className="mb-6 text-slate-300 hover:text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Plan de Estudios
        </Button>

        <div className="border border-neutral-700 rounded-2xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Columna de Prerrequisitos */}
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-center mb-6 text-yellow-400 tracking-wider">
                        NECESITAS PARA CURSAR
                    </h3>
                    <div className="space-y-2">
                        {prerequisites.length > 0 ? (
                            prerequisites.map(subject => <SubjectCard key={subject.subject_number} subject={subject} />)
                        ) : (
                            <p className="text-center text-sm text-slate-500 pt-4">No tiene requisitos previos.</p>
                        )}
                    </div>
                </div>

                {/* Columna de Materia Seleccionada */}
                <div className="flex flex-col border-x border-neutral-700 px-6">
                    <h3 className="text-lg font-bold text-center mb-6 text-slate-300 tracking-wider">
                        MATERIA SELECCIONADA
                    </h3>
                    <div className="space-y-2">
                        <SubjectCard subject={selectedSubject} />
                    </div>
                </div>

                {/* Columna de Dependencias */}
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-center mb-6 text-green-400 tracking-wider">
                        HABILITA PARA CURSAR
                    </h3>
                    <div className="space-y-2">
                        {dependencies.length > 0 ? (
                            dependencies.map(subject => <SubjectCard key={subject.subject_number} subject={subject} />)
                        ) : (
                             <p className="text-center text-sm text-slate-500 pt-4">No habilita materias futuras.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
} 