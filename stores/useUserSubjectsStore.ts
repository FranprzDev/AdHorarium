import { create } from 'zustand';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export type SubjectStatus = "promocionada" | "aprobada" | "regular" | "cursando" | "no_cursada";

type UserSubjectState = {
    status: SubjectStatus;
    grade: number | null;
};

type UserSubjectsState = {
    userSubjects: Record<number, UserSubjectState>;
    isLoading: boolean;
    fetchUserSubjects: (user: any, career_code: string) => Promise<void>;
    updateUserSubjectState: (
        user: any,
        career_code: string,
        subject_number: number,
        status: SubjectStatus,
        grade?: number | null
    ) => Promise<void>;
};

export const useUserSubjectsStore = create<UserSubjectsState>((set, get) => ({
    userSubjects: {},
    isLoading: true,
    fetchUserSubjects: async (user, career_code) => {
        if (!user || !career_code) return;
        set({ isLoading: true });
        const supabase = getSupabaseBrowserClient();
        try {
            const { data, error } = await supabase
                .from('user_subject_states')
                .select('subject_number, status, grade')
                .eq('user_id', user.id)
                .eq('career_code', career_code);

            if (error) {
                throw error;
            }

            const userSubjectsMap = data.reduce((acc: Record<number, UserSubjectState>, subject: { subject_number: number, status: any, grade: any }) => {
                acc[subject.subject_number] = {
                    status: subject.status,
                    grade: subject.grade,
                };
                return acc;
            }, {} as Record<number, UserSubjectState>);

            set({ userSubjects: userSubjectsMap });
        } catch (error) {
            console.error('Error fetching user subjects:', error);
        } finally {
            set({ isLoading: false });
        }
    },
    updateUserSubjectState: async (
        user,
        career_code,
        subject_number,
        status,
        grade = null
    ) => {
        if (!user || !career_code) return;
        const supabase = getSupabaseBrowserClient();
        try {
            const { error } = await supabase
                .from('user_subject_states')
                .upsert({
                    user_id: user.id,
                    career_code,
                    subject_number,
                    status,
                    grade,
                }, { onConflict: 'user_id,career_code,subject_number' });

            if (error) {
                throw error;
            }

            set((state) => ({
                userSubjects: {
                    ...state.userSubjects,
                    [subject_number]: { status, grade },
                },
            }));
        } catch (error) {
            console.error('Error updating user subject state:', error);
        }
    }
})); 