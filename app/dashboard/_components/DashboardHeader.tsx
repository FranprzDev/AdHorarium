"use client";

import { useEffect } from "react";
import { useCareerStore } from "@/stores/useCareerStore";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyCareerIdAction } from "@/app/actions/student";
import { PageHeader } from "@/components/brand/page-header";

export default function DashboardHeader() {
  const { selectedCareer, fetchCareers, isLoading } = useCareerStore();

  useEffect(() => {
    const load = async () => {
      const myCareer = await getMyCareerIdAction();
      await fetchCareers(myCareer.ok ? myCareer.data : null);
    };
    void load();
  }, [fetchCareers]);

  if (isLoading || !selectedCareer) {
    return <Skeleton className="h-16 w-full max-w-2xl" />;
  }

  return (
    <PageHeader
      eyebrow="Plan de correlativas"
      title={`Plan de Estudios - ${selectedCareer.name}`}
      description="Tocá una materia para ver qué necesitás para cursarla y qué materias te habilita."
    />
  );
}
