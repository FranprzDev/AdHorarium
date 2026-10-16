"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { useCareerStore } from "@/stores/useCareerStore";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/brand/page-header";
import { careerLabel } from "@/lib/careers";
import CareerSelector from "./CareerSelector";

export default function CareersHeader() {
  const { careers, selectedCareer, isLoading } = useCareerStore();

  return (
    <PageHeader
      eyebrow="Planes de estudio públicos"
      title={isLoading || !selectedCareer ? "Plan de Estudios" : `Plan de Estudios - ${careerLabel(selectedCareer, careers)}`}
      description="Elegí una carrera y tocá una materia para ver sus correlativas. No hace falta iniciar sesión."
      actions={
        <>
          <CareerSelector />
          <Button variant="outline" size="icon" asChild className="bg-card">
            <Link href="/" aria-label="Volver al inicio">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
    />
  );
}
