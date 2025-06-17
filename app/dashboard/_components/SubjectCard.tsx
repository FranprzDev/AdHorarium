"use client";

import { Subject } from "@/types/types";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserSubjectsStore, SubjectStatus } from "@/stores/useUserSubjectsStore";
import { Badge } from "@/components/ui/badge";

interface SubjectCardProps {
  subject: Subject;
  onSelect?: (subject: Subject) => void;
}

const statusConfig: Record<
  SubjectStatus,
  { label: string; variant: "promocionado" | "aprobado" | "regular" | "cursando" | "no_cursando" | "default" }
> = {
  promocionada: { label: "PROMOCIONADO", variant: "promocionado" },
  aprobada: { label: "APROBADO", variant: "aprobado" },
  regular: { label: "REGULAR", variant: "regular" },
  cursando: { label: "CURSANDO", variant: "cursando" },
  no_cursada: { label: "", variant: "no_cursando" },
};

export default function SubjectCard({ subject, onSelect }: SubjectCardProps) {
  const { userSubjects } = useUserSubjectsStore();
  const subjectState = userSubjects[subject.subject_number];

  const handleCardClick = () => {
    if (onSelect) {
        onSelect(subject);
    }
  }

  return (
    <Card 
        className="mb-2 bg-black/30 border-white/10 hover:bg-black/40 transition-colors duration-300 flex flex-col justify-between min-h-[100px] cursor-pointer"
        onClick={handleCardClick}
    >
      <div>
        <CardHeader className="p-3">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-sm font-medium text-slate-200 leading-tight">
              {subject.subject_name}
            </CardTitle>
            <Badge variant="outline" className="text-xs border-neutral-600 text-neutral-400 whitespace-nowrap">
              Nivel {subject.nivel}
            </Badge>
          </div>
        </CardHeader>
      </div>
      
      <div className="p-2 pt-0 mt-auto">
        <div className="flex-grow">
            {subjectState && subjectState.status !== 'no_cursada' ? (
                <Badge 
                    variant={statusConfig[subjectState.status].variant} 
                    className="w-full justify-center"
                >
                    {statusConfig[subjectState.status].label}
                    {(subjectState.status === 'promocionada' || subjectState.status === 'aprobada') && subjectState.grade ? ` - ${subjectState.grade}` : ''}
                </Badge>
            ) : (
              <div className="h-[22px]"></div>
            )}
        </div>
      </div>
    </Card>
  );
} 