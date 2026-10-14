import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { isSubjectStatus } from '@/lib/subject-status';
import { SubjectStatus } from '@/types/enums';

export type UserSubjectState = {
    status: SubjectStatus;
    grade: number | null;
};

type UserSubjectStateRow = {
    subject_number: number;
    status: string;
    grade: number | null;
};

type UserSubjectsState = {
    userSubjects: Record<number, UserSubjectState>;
    isLoading: boolean;
    fetchUserSubjects: (user: User | null, career_code: string) => Promise<void>;
    updateUserSubjectState: (
        user: User | null,
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
                .eq('career_code', career_code)
                .overrideTypes<UserSubjectStateRow[], { merge: false }>();

            if (error) {
                throw error;
            }

            const userSubjectsMap: Record<number, UserSubjectState> = {};
            for (const row of data ?? []) {
                userSubjectsMap[row.subject_number] = {
                    status: isSubjectStatus(row.status) ? row.status : SubjectStatus.NoCursada,
                    grade: row.grade,
                };
            }

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

            // After a successful update, refetch all subjects for the user and career
            // to ensure the state is consistent across the app.
            await get().fetchUserSubjects(user, career_code);

        } catch (error) {
            console.error('Error updating user subject state:', error);
        }
    }
}));
