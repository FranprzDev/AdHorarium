"use client";

import { useCareerStore } from '@/stores/useCareerStore';
import { Skeleton } from '@/components/ui/skeleton';
import CareerSelector from './CareerSelector';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function CareersHeader() {
    const { selectedCareer, isLoading } = useCareerStore();

    return (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {isLoading || !selectedCareer ? (
                <Skeleton className="h-10 w-3/4" />
            ) : (
                <h1 className="text-2xl md:text-3xl font-bold gradient-text text-center md:text-left">
                    Plan de Estudios - {selectedCareer.name}
                </h1>
            )}
            <div className='flex items-center gap-4'>
                <CareerSelector />
                <Link href="/">
                    <Button variant="outline" className="bg-black/20 border-white/20 text-white">
                        <Home className="h-5 w-5" />
                    </Button>
                </Link>
            </div>
        </div>
    );
} 