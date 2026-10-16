"use client";

import type { PlanSubject } from "@/types/types";
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
  subject: PlanSubject;
  onSelect?: (subject: PlanSubject) => void;
  showBadge?: boolean;
}

export default function SubjectCard({ subject, onSelect, showBadge = true }: SubjectCardProps) {
  const { userSubjects } = useUserSubjectsStore();
  const subjectState = userSubjects[subject.id];

  const handleCardClick = () => {
    if (onSelect) {
        onSelect(subject);
    }
  }

  return (
    <Card 
        className={`mb-2 flex ${showBadge ? "min-h-[100px]" : ""} flex-col justify-between bg-card transition-all duration-200 ${onSelect ? "cursor-pointer hover:-translate-y-px hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : ""}`}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onKeyDown={(event) => {
          if (onSelect && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onSelect(subject);
          }
        }}
        onClick={handleCardClick}
    >
      <div>
        <CardHeader className="p-3">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-sm font-medium leading-snug text-foreground">
              {subject.name}
            </CardTitle>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge variant={BadgeVariant.Outline} className="whitespace-nowrap border-border bg-muted text-[0.65rem] font-medium text-foreground/80">
                Nivel {subject.level}
              </Badge>
              {subject.isElective && (
                <Badge variant={BadgeVariant.Outline} className="whitespace-nowrap border-dashed text-[0.65rem] font-medium text-muted-foreground">
                  Electiva
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </div>
      
      {showBadge && (
        <div className="mt-auto p-2 pt-0">
          {subjectState && subjectState.status !== SubjectStatus.NoCursada ? (
            <Badge variant={SUBJECT_STATUS_BADGES[subjectState.status].variant} className="w-full justify-center">
              {SUBJECT_STATUS_BADGES[subjectState.status].label}
              {subjectState.status === SubjectStatus.Promocionada && subjectState.grade ? ` - ${subjectState.grade}` : ""}
            </Badge>
          ) : (
            <div className="h-[22px]" />
          )}
        </div>
      )}
    </Card>
  );
} 