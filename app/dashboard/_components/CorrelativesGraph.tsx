"use client";

import { useCorrelativesData } from "../_hooks/useCorrelativesData";
import { useCareerStore } from "@/stores/useCareerStore";
import SubjectCard from "./SubjectCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { Subject } from "@/types/types";
import DependencyView from "./DependencyView";
import { useIsMobile } from "@/components/ui/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserSubjectsStore } from "@/stores/useUserSubjectsStore";
import { useAuthStore } from "@/stores/useAuthStore";

interface CorrelativesGraphProps {
  showBadges?: boolean;
}

export default function CorrelativesGraph({ showBadges = true }: CorrelativesGraphProps) {
  const selectedCareer = useCareerStore(state => state.selectedCareer);
  const { subjects, isLoading: isLoadingSubjects, error } = useCorrelativesData(selectedCareer?.code);
  const { user } = useAuthStore();
  const { fetchUserSubjects } = useUserSubjectsStore();

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const isMobile = useIsMobile();
  
  const { isLoading: isLoadingUserSubjects } = useUserSubjectsStore();
  const isLoading = isLoadingSubjects || isLoadingUserSubjects;

  useEffect(() => {
    if (user && selectedCareer) {
      fetchUserSubjects(user, selectedCareer.code);
    }
  }, [user, selectedCareer, fetchUserSubjects]);

  useEffect(() => {
    const handleFocus = () => {
      if (user && selectedCareer) {
        fetchUserSubjects(user, selectedCareer.code);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, selectedCareer, fetchUserSubjects]);

  const levels = useMemo(() => {
    if (!subjects) return [];
    const uniqueLevels = [...new Set(subjects.map(s => s.nivel))].sort();
    return uniqueLevels;
  }, [subjects]);

  const groupedSubjects = useMemo(() => {
    const groups: { [key: string]: Subject[] } = {};
    if (!subjects) return groups;
    for (const level of levels) {
      groups[level] = subjects.filter(s => s.nivel === level);
    }
    return groups;
  }, [subjects, levels]);

  useEffect(() => {
    setSelectedSubject(null);
  }, [selectedCareer]);

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
  };
  
  const handleCloseDependencyView = () => {
    setSelectedSubject(null);
  };

  if (isLoading && subjects.length === 0) {
    return (
      <div className="p-4">
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
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  if (!selectedCareer) {
    return (
      <div className="text-center p-8 text-slate-400">
        Por favor, selecciona una carrera para ver el plan de estudios.
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
      <div className="p-4 relative">
         {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="flex items-center gap-2 text-white">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Cargando...</span>
            </div>
          </div>
        )}
        <Tabs defaultValue={levels[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-black/20">
            {levels.map(level => (
              <TabsTrigger key={level} value={level}>{level}</TabsTrigger>
            ))}
          </TabsList>
          {levels.map(level => (
            <TabsContent key={level} value={level}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {groupedSubjects[level] && groupedSubjects[level].map(subject => (
                  <SubjectCard 
                    key={subject.subject_number} 
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
    <div className="p-4 md:p-6 relative">
       {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="flex items-center gap-2 text-white">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Cargando plan de estudios...</span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-5 gap-x-6">
        {levels.map(level => (
          <div key={level} className="flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-center text-slate-300">Nivel {level}</h2>
            <div className="flex flex-col flex-grow">
              {groupedSubjects[level] && groupedSubjects[level].map(subject => (
                <SubjectCard 
                  key={subject.subject_number} 
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