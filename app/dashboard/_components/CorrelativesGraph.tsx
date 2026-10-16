"use client";

import { usePlanSubjects } from "../_hooks/usePlanSubjects";
import { useCareerStore } from "@/stores/useCareerStore";
import SubjectCard from "./SubjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import type { PlanSubject } from "@/types/types";
import { groupByLevel } from "@/lib/plan-subjects";
import DependencyView from "./DependencyView";
import { useIsMobile } from "@/components/ui/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserSubjectsStore } from "@/stores/useUserSubjectsStore";
import { useSession } from "next-auth/react";

interface CorrelativesGraphProps {
  showBadges?: boolean;
}

export default function CorrelativesGraph({ showBadges = true }: CorrelativesGraphProps) {
  const selectedCareer = useCareerStore(state => state.selectedCareer);
  const careerId = selectedCareer?.id ?? null;
  const { subjects, isLoading: isLoadingSubjects, error } = usePlanSubjects(careerId);
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { fetchUserSubjects, clear } = useUserSubjectsStore();

  const [selectedSubject, setSelectedSubject] = useState<PlanSubject | null>(null);
  const isMobile = useIsMobile();
  
  const { isLoading: isLoadingUserSubjects } = useUserSubjectsStore();
  const isLoading = isLoadingSubjects || isLoadingUserSubjects;

  useEffect(() => {
    if (isAuthenticated && careerId !== null) {
      void fetchUserSubjects(careerId);
    } else {
      clear();
    }
  }, [isAuthenticated, careerId, fetchUserSubjects, clear]);

  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && careerId !== null) {
        void fetchUserSubjects(careerId);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, careerId, fetchUserSubjects]);

  const groupedSubjects = useMemo(() => groupByLevel(subjects), [subjects]);
  const levels = useMemo(() => [...groupedSubjects.keys()], [groupedSubjects]);
  const levelColumns = { gridTemplateColumns: `repeat(${Math.max(levels.length, 1)}, minmax(0, 1fr))` };

  useEffect(() => {
    setSelectedSubject(null);
  }, [selectedCareer]);

  const handleSelectSubject = (subject: PlanSubject) => {
    setSelectedSubject(subject);
  };
  
  const handleCloseDependencyView = () => {
    setSelectedSubject(null);
  };

  if (isLoading && subjects.length === 0) {
    return (
      <div>
        {isMobile ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return <div className="surface-card border-destructive/40 p-4 text-destructive">Error: {error}</div>;
  }

  if (!selectedCareer) {
    return (
      <div className="surface-card text-center p-8 text-muted-foreground">
        Por favor, seleccioná una carrera para ver el plan de estudios.
      </div>
    );
  }

  if (selectedSubject) {
    return (
        <DependencyView 
            selectedSubject={selectedSubject}
            allSubjects={subjects}
            onClose={handleCloseDependencyView}
        />
    )
  }
  
  if (isMobile) {
    return (
      <div className="relative">
         {isLoading && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
            <div className="flex items-center gap-2 text-foreground">
              <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Cargando...</span>
            </div>
          </div>
        )}
        <Tabs defaultValue={String(levels[0])} className="w-full">
          <TabsList className="grid w-full" style={levelColumns}>
            {levels.map(level => (
              <TabsTrigger key={level} value={String(level)} aria-label={`Nivel ${level}`}>{level}</TabsTrigger>
            ))}
          </TabsList>
          {levels.map(level => (
            <TabsContent key={level} value={String(level)}>
              <h2 className="sr-only">Nivel {level}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {groupedSubjects.get(level)?.map(subject => (
                  <SubjectCard 
                    key={subject.id} 
                    subject={subject} 
                    onSelect={handleSelectSubject}
                    showBadge={showBadges}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    )
  }

  return (
    <div className="relative overflow-x-auto">
       {isLoading && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <div className="flex items-center gap-2 text-foreground">
            <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Cargando plan de estudios...</span>
          </div>
        </div>
      )}
      <div className="grid min-w-[900px] gap-x-4" style={levelColumns}>
        {levels.map(level => (
          <div key={level} className="flex flex-col rounded-xl border border-border bg-muted/40 p-2">
            <h2 className="mb-2 px-1 pt-1 text-center text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Nivel {level}</h2>
            <div className="flex flex-col flex-grow">
              {groupedSubjects.get(level)?.map(subject => (
                <SubjectCard 
                  key={subject.id} 
                  subject={subject} 
                  onSelect={handleSelectSubject}
                  showBadge={showBadges}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 