"use client";

import { useEffect } from 'react';
import { useCareerStore } from '@/stores/useCareerStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function CareerSelector() {
    const { careers, selectedCareer, selectCareer, fetchCareers, isLoading } = useCareerStore();

    useEffect(() => {
        fetchCareers();
    }, [fetchCareers]);

    const handleCareerChange = (careerCode: string) => {
        const career = careers.find(c => c.code === careerCode);
        if (career) {
            selectCareer(career);
        }
    };

    if (isLoading && careers.length === 0) {
        return <Skeleton className="h-10 w-64" />;
    }

    return (
        <Select
            onValueChange={handleCareerChange}
            defaultValue={selectedCareer?.code}
            value={selectedCareer?.code}
        >
            <SelectTrigger className="w-64 bg-black/30 border-white/20 text-white">
                <SelectValue placeholder="Selecciona una carrera..." />
            </SelectTrigger>
            <SelectContent className='bg-black/80 text-white border-white/20'>
                {careers.map(career => (
                    <SelectItem key={career.code} value={career.code}>
                        {career.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
} 