import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Subject } from '@/types/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUserSubjectsStore } from '@/stores/useUserSubjectsStore';

export function useCorrelativesData(careerCode?: string) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuthStore();
    const { fetchUserSubjects } = useUserSubjectsStore();

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
            
            if (user) {
                fetchUserSubjects(user, code);
            }

        } catch (e: any) {
            setError(e.message);
            setSubjects([]);
        } finally {
            setIsLoading(false);
        }
    }, [user, fetchUserSubjects]);

    useEffect(() => {
        if (careerCode) {
            fetchData(careerCode);
        } else {
            setSubjects([]);
        }
    }, [careerCode, fetchData]);

    return { subjects, isLoading, error };
} 