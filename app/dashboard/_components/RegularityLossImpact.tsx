"use client";

import { useMemo } from "react";
import type { PlanSubject } from "@/types/types";
import SubjectCard from "./SubjectCard";
import { findRegularityLossSubjects } from "@/lib/impact";
import { toImpactSubjects } from "@/lib/plan-subjects";
import { useUserSubjectsStore } from "@/stores/useUserSubjectsStore";

interface RegularityLossImpactProps {
  selectedSubject: PlanSubject;
  allSubjects: PlanSubject[];
}

interface ImpactSectionProps {
  title: string;
  description: string;
  emptyText: string;
  subjects: PlanSubject[];
}

function ImpactSection({ title, description, emptyText, subjects }: ImpactSectionProps) {
  return (
    <section aria-label={title} className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">{title}</h4>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {subjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map(subject => <SubjectCard key={subject.id} subject={subject} />)}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </section>
  );
}

export default function RegularityLossImpact({ selectedSubject, allSubjects }: RegularityLossImpactProps) {
  const { userSubjects } = useUserSubjectsStore();

  const impact = useMemo(() => {
    const impactSubjects = toImpactSubjects(allSubjects, userSubjects);
    const root = impactSubjects.find(subject => subject.id === selectedSubject.id);
    return root ? findRegularityLossSubjects(root, impactSubjects) : null;
  }, [allSubjects, selectedSubject, userSubjects]);

  if (!impact) return null;

  return (
    <div className="surface-card mt-6 space-y-6 p-4 md:p-6" data-testid="regularity-loss-impact">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-destructive">
          SI RECURSÁS {selectedSubject.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Perdés su regularidad. Esto es lo que dejás de poder cursar según las correlativas del plan, ordenado por nivel.
          No incluye condiciones como &quot;todas las materias previas&quot; ni tiene en cuenta el cuatrimestre.
        </p>
      </div>
      <ImpactSection
        title="Se corta directamente"
        description="Pedían esta materia regular para cursar."
        emptyText="Ninguna materia pide esta materia regular."
        subjects={impact.direct}
      />
      <ImpactSection
        title="Se afecta después"
        description="Dependen de las anteriores, así que quedan atrás en la cadena."
        emptyText="No hay materias más adelante en la cadena."
        subjects={impact.laterInChain}
      />
      {impact.alreadyRequiredApproval.length > 0 && (
        <ImpactSection
          title="Ya la pedían aprobada"
          description="Estas no cambian: con la materia regular igual no podías cursarlas."
          emptyText=""
          subjects={impact.alreadyRequiredApproval}
        />
      )}
      {impact.finalsNeedingApproval.length > 0 && (
        <ImpactSection
          title="Finales que piden esta materia aprobada"
          description="Para rendir estos finales tenés que tener esta materia aprobada."
          emptyText=""
          subjects={impact.finalsNeedingApproval}
        />
      )}
    </div>
  );
}
