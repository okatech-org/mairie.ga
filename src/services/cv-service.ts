/**
 * CV Service avec support Supabase et Fallback Mock
 * 
 * Ce service gère les CV des citoyens.
 * En mode démo ou si la table n'existe pas, utilise les données mockées.
 * En production avec Supabase, utilise la table cv_data.
 */

import { CV } from '@/types/cv';
import { MOCK_CV } from '@/data/mock-cv';
import { supabase } from '@/integrations/supabase/client';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Type assertion helper for tables not yet in generated types
const cvDataTable = () => (supabase as any).from('cv_data');

class CVService {
    private useSupabase = false; // Will be set to true when table exists
    private mockCV: CV = {
        ...MOCK_CV,
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean.dupont@example.com",
        phone: "+241 01 23 45 67",
        address: "Libreville, Gabon"
    };

    constructor() {
        this.checkSupabaseTable();
    }

    /**
     * Check if Supabase table exists and is accessible
     */
    private async checkSupabaseTable(): Promise<void> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.log('[CVService] No session, using mock data');
                return;
            }

            // Try a simple query to check if table exists
            const { error } = await cvDataTable()
                .select('id')
                .limit(1);

            if (error) {
                // Table doesn't exist or no access
                console.log('[CVService] cv_data table not available, using mock data:', error.message);
                this.useSupabase = false;
            } else {
                console.log('[CVService] Connected to Supabase cv_data table');
                this.useSupabase = true;
            }
        } catch (err) {
            console.log('[CVService] Error checking table, using mock data:', err);
            this.useSupabase = false;
        }
    }

    /**
     * Get CV for current user
     */
    async getMyCV(): Promise<CV> {
        if (!this.useSupabase) {
            await delay(500);
            return this.mockCV;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return this.mockCV;
            }

            const { data, error } = await cvDataTable()
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error || !data) {
                // No CV yet, return empty template
                return {
                    id: '',
                    userId: user.id,
                    firstName: user.user_metadata?.first_name || '',
                    lastName: user.user_metadata?.last_name || '',
                    email: user.email || '',
                    phone: user.user_metadata?.phone || '',
                    address: '',
                    summary: '',
                    experiences: [],
                    education: [],
                    skills: [],
                    languages: [],
                    updatedAt: new Date().toISOString()
                };
            }

            return this.mapFromDatabase(data);
        } catch (err) {
            console.error('[CVService] Error fetching CV:', err);
            return this.mockCV;
        }
    }

    /**
     * Update CV for current user
     */
    async updateCV(data: Partial<CV>): Promise<CV> {
        if (!this.useSupabase) {
            await delay(800);
            this.mockCV = {
                ...this.mockCV,
                ...data,
                updatedAt: new Date().toISOString()
            };
            return this.mockCV;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const dbData = this.mapToDatabase(data, user.id);

            // Upsert - create if doesn't exist, update if it does
            const { data: result, error } = await cvDataTable()
                .upsert({
                    ...dbData,
                    user_id: user.id,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id'
                })
                .select()
                .single();

            if (error) throw error;

            return this.mapFromDatabase(result);
        } catch (err) {
            console.error('[CVService] Error updating CV:', err);
            // Fallback to mock
            this.mockCV = {
                ...this.mockCV,
                ...data,
                updatedAt: new Date().toISOString()
            };
            return this.mockCV;
        }
    }

    /**
     * Map database row to CV type
     */
    private mapFromDatabase(row: Record<string, unknown>): CV {
        const personalInfo = row.personal_info as Record<string, unknown> || {};
        return {
            id: row.id as string,
            userId: row.user_id as string,
            firstName: personalInfo.first_name as string || '',
            lastName: personalInfo.last_name as string || '',
            email: personalInfo.email as string || '',
            phone: personalInfo.phone as string || '',
            address: personalInfo.address as string || '',
            summary: personalInfo.summary as string || '',
            experiences: (row.experiences as CV['experiences']) || [],
            education: (row.education as CV['education']) || [],
            skills: (row.skills as CV['skills']) || [],
            languages: (row.languages as CV['languages']) || [],
            hobbies: personalInfo.hobbies as string[] || [],
            portfolioUrl: personalInfo.portfolio_url as string,
            linkedinUrl: personalInfo.linkedin_url as string,
            updatedAt: row.updated_at as string
        };
    }

    /**
     * Map CV type to database columns
     */
    private mapToDatabase(cv: Partial<CV>, userId: string): Record<string, unknown> {
        return {
            user_id: userId,
            personal_info: {
                first_name: cv.firstName,
                last_name: cv.lastName,
                email: cv.email,
                phone: cv.phone,
                address: cv.address,
                summary: cv.summary,
                hobbies: cv.hobbies,
                portfolio_url: cv.portfolioUrl,
                linkedin_url: cv.linkedinUrl
            },
            experiences: cv.experiences,
            education: cv.education,
            skills: cv.skills,
            languages: cv.languages
        };
    }
}

export const cvService = new CVService();
