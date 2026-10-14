"use client";

import { useEffect } from 'react';
import { useCareerStore } from '@/stores/useCareerStore';
import { Skeleton } from '@/components/ui/skeleton';
import { getMyCareerIdAction } from '@/app/actions/student';

export default function DashboardHeader() {
    const { selectedCareer, fetchCareers, isLoading } = useCareerStore();

    useEffect(() => {
        const load = async () => {
            const myCareer = await getMyCareerIdAction();
            await fetchCareers(myCareer.ok ? myCareer.data : null);
        };
        void load();
    }, [fetchCareers]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                {isLoading || !selectedCareer ? (
                    <Skeleton className="h-10 w-3/4" />
                ) : (
                    <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                        Plan de Estudios - {selectedCareer.name}
                    </h1>
                )}
            </div>
        </div>
    );
} 