import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Subject } from '@/types/types';

export function useCorrelativesData(careerCode?: string) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (code: string) => {
        setIsLoading(true);
        setError(null);
        const supabase = getSupabaseBrowserClient();
        try {
            const { data, error } = await supabase
                .from('complete_subjects_info')
                .select('*')
                .eq('career_code', code)
                .order('nivel', { ascending: true })
                .order('subject_name', { ascending: true });

            if (error) {
                throw new Error(`Error fetching subjects: ${error.message}`);
            }
            
            setSubjects(data || []);

        } catch (e: any) {
            setError(e.message);
            setSubjects([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (careerCode) {
            fetchData(careerCode);
        } else {
            setSubjects([]);
        }
    }, [careerCode, fetchData]);

    return { subjects, isLoading, error };
} 