
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GabonaisCitizen, CitizenType, RegistrationStatus } from "@/types/citizen";

export function useCitizenProfile() {
    const [user, setUser] = useState<GabonaisCitizen | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                setLoading(true);
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    setLoading(false);
                    return;
                }

                // Fetch profile
                let { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                if (profileError) {
                    throw profileError;
                }

                // If profile doesn't exist, create it (Lazy Creation)
                if (!profile) {
                    console.log("Profile not found, creating new profile...");
                    const metadata = session.user.user_metadata;
                    // Split full name if needed or use metadata directly
                    const firstName = metadata?.first_name || metadata?.full_name?.split(' ')[0] || 'Citoyen';
                    const lastName = metadata?.last_name || metadata?.full_name?.split(' ').slice(1).join(' ') || '';

                    const { data: newProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert({
                            user_id: session.user.id,
                            email: session.user.email!,
                            first_name: firstName,
                            last_name: lastName,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        })
                        .select()
                        .single();

                    if (createError) {
                        console.error("Error creating profile:", createError);
                        throw createError;
                    }
                    profile = newProfile;
                }

                if (profile) {
                    // Debug: List all documents for this user
                    const { data: allDocs, error: docsError } = await supabase
                        .from('documents')
                        .select('category, file_path, name')
                        .eq('user_id', profile.user_id);

                    if (docsError) {
                        console.error("Error fetching debug docs:", docsError);
                    } else {
                        console.log("All User Documents:", allDocs);
                    }

                    // Fetch profile photo from documents table
                    const { data: photoDocs } = await supabase
                        .from('documents')
                        .select('file_path')
                        .eq('user_id', profile.user_id)
                        .eq('category', 'PHOTO_IDENTITE')
                        .limit(1);

                    let photoUrl = undefined;
                    if (photoDocs && photoDocs.length > 0 && photoDocs[0].file_path) {
                        const { data } = supabase.storage.from('documents').getPublicUrl(photoDocs[0].file_path);
                        photoUrl = data.publicUrl;
                        console.log("Found profile photo:", photoUrl);
                    } else {
                        console.log("No profile photo found");
                    }

                    // Map Supabase profile to GabonaisCitizen interface
                    const addressData = profile.address as any;
                    const citizen: GabonaisCitizen = {
                        id: profile.user_id,
                        citizenType: CitizenType.GABONAIS,
                        firstName: profile.first_name || '',
                        lastName: profile.last_name || '',
                        dateOfBirth: profile.date_of_birth ? new Date(profile.date_of_birth) : undefined as any,
                        birthPlace: profile.lieu_naissance || undefined,
                        gender: undefined as any, // Not in DB schema yet - should be added
                        photoUrl,
                        cniNumber: profile.numero_cni || undefined,
                        cniExpireDate: undefined as any, // Not in DB schema yet
                        maritalStatus: mapMaritalStatus(profile.situation_matrimoniale),
                        profession: profile.profession || undefined,
                        currentAddress: {
                            street: addressData?.full || addressData?.street || '',
                            city: addressData?.city || '',
                            country: 'Gabon',
                            postalCode: addressData?.postalCode || ''
                        },
                        phone: profile.phone || undefined,
                        email: session.user.email || '',
                        preferredLanguage: 'FR',
                        preferredContact: 'EMAIL',
                        assignedMunicipality: profile.arrondissement || 'Non assigné',
                        municipalFile: `DOS-${profile.created_at?.slice(0, 10).replace(/-/g, '')}-${profile.user_id.slice(0, 4).toUpperCase()}`,
                        registrationStatus: RegistrationStatus.APPROVED,
                        registrationDate: new Date(profile.created_at),
                        approvalDate: new Date(profile.created_at),
                        accessLevel: 'FULL',
                        uploadedDocuments: [], // Would need separate fetch
                        createdAt: new Date(profile.created_at),
                        updatedAt: new Date(profile.updated_at || profile.created_at),
                        verifiedAt: new Date(profile.updated_at || profile.created_at)
                    };
                    setUser(citizen);
                }
            } catch (err: any) {
                console.error("Error fetching/creating citizen profile:", err);
                // Don't show technical error to user if possible, or fallback
                setError("Impossible de charger le profil. Veuillez contacter le support.");
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, []);

    return { user, loading, error };
}

function mapMaritalStatus(status: string | null): 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' {
    switch (status) {
        case 'MARRIED': return 'MARRIED';
        case 'DIVORCED': return 'DIVORCED';
        case 'WIDOWED': return 'WIDOWED';
        default: return 'SINGLE';
    }
}
