"use client";

import { Subject } from "@/types/types";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserSubjectsStore } from "@/stores/useUserSubjectsStore";
import { Badge } from "@/components/ui/badge";
import { SUBJECT_STATUS_BADGES } from "@/lib/subject-status";
import { BadgeVariant, SubjectStatus } from "@/types/enums";

interface SubjectCardProps {
  subject: Subject;
  onSelect?: (subject: Subject) => void;
  showBadge?: boolean;
}

export default function SubjectCard({ subject, onSelect, showBadge = true }: SubjectCardProps) {
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
            <Badge variant={BadgeVariant.Outline} className="text-xs border-neutral-600 text-neutral-400 whitespace-nowrap">
              Nivel {subject.nivel}
            </Badge>
          </div>
        </CardHeader>
      </div>
      
      <div className="p-2 pt-0 mt-auto">
        <div className="flex-grow">
            {showBadge && subjectState && subjectState.status !== SubjectStatus.NoCursada ? (
                <Badge 
                    variant={SUBJECT_STATUS_BADGES[subjectState.status].variant} 
                    className="w-full justify-center"
                >
                    {SUBJECT_STATUS_BADGES[subjectState.status].label}
                    {subjectState.status === SubjectStatus.Promocionada && subjectState.grade ? ` - ${subjectState.grade}` : ''}
                </Badge>
            ) : (
              <div className="h-[22px]"></div>
            )}
        </div>
      </div>
    </Card>
  );
} 