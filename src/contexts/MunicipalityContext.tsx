import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { organizationService } from '@/services/organizationService';
import { Organization } from '@/types/organization';
import { mairiesGabon } from '@/data/mock-mairies-gabon';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface UserLocation {
    latitude: number;
    longitude: number;
    accuracy: number;
}

export type DetectionSource = 'geolocation' | 'user_profile' | 'manual' | 'default';

interface MunicipalityContextValue {
    // Municipalité active
    currentMunicipality: Organization | null;

    // Source de la détection
    detectionSource: DetectionSource;

    // État
    isLoading: boolean;
    error: string | null;

    // Position utilisateur
    userLocation: UserLocation | null;

    // Distance à la mairie actuelle (en km)
    distanceToMunicipality: number | null;

    // Liste des mairies disponibles
    availableMunicipalities: Organization[];

    // Actions
    changeMunicipality: (organizationId: string) => void;
    refreshLocation: () => Promise<void>;
    clearManualSelection: () => void;
}

const MunicipalityContext = createContext<MunicipalityContextValue | undefined>(undefined);

// Calcul de distance Haversine
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Nom par défaut (Libreville - capitale)
const DEFAULT_MUNICIPALITY_NAME = "Libreville";

interface MunicipalityProviderProps {
    children: ReactNode;
}

export function MunicipalityProvider({ children }: MunicipalityProviderProps) {
    const { user } = useAuth();

    const [currentMunicipality, setCurrentMunicipality] = useState<Organization | null>(null);
    const [detectionSource, setDetectionSource] = useState<DetectionSource>('default');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [distanceToMunicipality, setDistanceToMunicipality] = useState<number | null>(null);
    const [availableMunicipalities, setAvailableMunicipalities] = useState<Organization[]>([]);
    const [userOrganizationId, setUserOrganizationId] = useState<string | null>(null);
    const [manualSelection, setManualSelection] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('manual_municipality_id');
        }
        return null;
    });

    // Charger l'organization_id du profil utilisateur
    useEffect(() => {
        const loadUserProfile = async () => {
            if (!user) {
                setUserOrganizationId(null);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single();

                if (data && !error) {
                    setUserOrganizationId(data.organization_id);
                }
            } catch (err) {
                console.error('[MunicipalityContext] Error loading user profile:', err);
            }
        };

        loadUserProfile();
    }, [user]);

    // Charger les mairies disponibles
    useEffect(() => {
        const loadMunicipalities = async () => {
            try {
                const orgs = await organizationService.getAll();
                // Filtrer seulement les mairies avec coordonnées
                const mairiesWithCoords = orgs.filter(o => o.latitude && o.longitude);

                // Si pas assez de données depuis la DB, utiliser les données mock
                if (mairiesWithCoords.length < 10) {
                    const mockOrgs: Organization[] = mairiesGabon.map(m => ({
                        id: m.id,
                        name: `Mairie de ${m.name}`,
                        type: 'MAIRIE_COMMUNE',
                        latitude: m.coordinates[1],
                        longitude: m.coordinates[0],
                        province: m.province,
                        departement: m.departement,
                        city: m.name,
                        population: m.population,
                        contact_phone: m.contact,
                        maire_name: m.maire,
                    }));
                    setAvailableMunicipalities(mockOrgs);
                } else {
                    setAvailableMunicipalities(mairiesWithCoords);
                }
            } catch (err) {
                console.error('[MunicipalityContext] Error loading municipalities:', err);
                // Fallback aux données mock
                const mockOrgs: Organization[] = mairiesGabon.map(m => ({
                    id: m.id,
                    name: `Mairie de ${m.name}`,
                    type: 'MAIRIE_COMMUNE',
                    latitude: m.coordinates[1],
                    longitude: m.coordinates[0],
                    province: m.province,
                    departement: m.departement,
                    city: m.name,
                    population: m.population,
                }));
                setAvailableMunicipalities(mockOrgs);
            }
        };

        loadMunicipalities();
    }, []);

    // Trouver la mairie la plus proche
    const findNearestMunicipality = useCallback((location: UserLocation): Organization | null => {
        if (availableMunicipalities.length === 0) return null;

        let nearest: Organization | null = null;
        let minDistance = Infinity;

        availableMunicipalities.forEach(org => {
            if (org.latitude && org.longitude) {
                const distance = calculateDistance(
                    location.latitude,
                    location.longitude,
                    org.latitude,
                    org.longitude
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = org;
                }
            }
        });

        if (nearest) {
            setDistanceToMunicipality(Math.round(minDistance * 10) / 10);
        }

        return nearest;
    }, [availableMunicipalities]);

    // Obtenir la géolocalisation
    const refreshLocation = useCallback(async (): Promise<void> => {
        if (!navigator.geolocation) {
            console.log('[MunicipalityContext] Geolocation not supported');
            return;
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location: UserLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    setUserLocation(location);
                    console.log('[MunicipalityContext] Got location:', location);
                    resolve();
                },
                (err) => {
                    console.warn('[MunicipalityContext] Geolocation error:', err.message);
                    setError('Impossible d\'obtenir votre position');
                    resolve();
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes cache
                }
            );
        });
    }, []);

    // Changer manuellement de municipalité
    const changeMunicipality = useCallback((organizationId: string) => {
        const org = availableMunicipalities.find(o => o.id === organizationId);
        if (org) {
            setCurrentMunicipality(org);
            setDetectionSource('manual');
            setManualSelection(organizationId);
            localStorage.setItem('manual_municipality_id', organizationId);

            if (userLocation && org.latitude && org.longitude) {
                const distance = calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    org.latitude,
                    org.longitude
                );
                setDistanceToMunicipality(Math.round(distance * 10) / 10);
            }
        }
    }, [availableMunicipalities, userLocation]);

    // Effacer la sélection manuelle
    const clearManualSelection = useCallback(() => {
        setManualSelection(null);
        localStorage.removeItem('manual_municipality_id');
        setIsLoading(true);
    }, []);

    // Logique principale de détection
    useEffect(() => {
        const detectMunicipality = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // 1. Sélection manuelle prioritaire
                if (manualSelection) {
                    const org = availableMunicipalities.find(o => o.id === manualSelection);
                    if (org) {
                        setCurrentMunicipality(org);
                        setDetectionSource('manual');
                        setIsLoading(false);
                        return;
                    }
                }

                // 2. Utilisateur connecté → Sa mairie d'inscription
                if (user && userOrganizationId) {
                    const org = availableMunicipalities.find(o => o.id === userOrganizationId);
                    if (org) {
                        setCurrentMunicipality(org);
                        setDetectionSource('user_profile');

                        if (userLocation && org.latitude && org.longitude) {
                            const distance = calculateDistance(
                                userLocation.latitude,
                                userLocation.longitude,
                                org.latitude,
                                org.longitude
                            );
                            setDistanceToMunicipality(Math.round(distance * 10) / 10);
                        }

                        setIsLoading(false);
                        return;
                    }
                }

                // 3. Géolocalisation pour utilisateur non connecté
                if (!user && userLocation) {
                    const nearest = findNearestMunicipality(userLocation);
                    if (nearest) {
                        setCurrentMunicipality(nearest);
                        setDetectionSource('geolocation');
                        setIsLoading(false);
                        return;
                    }
                }

                // 4. Demander la géolocalisation si pas encore fait
                if (!user && !userLocation && availableMunicipalities.length > 0) {
                    await refreshLocation();
                    return;
                }

                // 5. Fallback : Libreville
                const defaultMunicipality = availableMunicipalities.find(
                    o => o.city?.toLowerCase() === DEFAULT_MUNICIPALITY_NAME.toLowerCase() ||
                        o.name.toLowerCase().includes(DEFAULT_MUNICIPALITY_NAME.toLowerCase())
                );

                if (defaultMunicipality) {
                    setCurrentMunicipality(defaultMunicipality);
                    setDetectionSource('default');
                } else if (availableMunicipalities.length > 0) {
                    setCurrentMunicipality(availableMunicipalities[0]);
                    setDetectionSource('default');
                }

            } catch (err) {
                console.error('[MunicipalityContext] Detection error:', err);
                setError('Erreur de détection de la municipalité');
            } finally {
                setIsLoading(false);
            }
        };

        if (availableMunicipalities.length > 0) {
            detectMunicipality();
        }
    }, [user, userOrganizationId, userLocation, manualSelection, availableMunicipalities, findNearestMunicipality, refreshLocation]);

    const value: MunicipalityContextValue = {
        currentMunicipality,
        detectionSource,
        isLoading,
        error,
        userLocation,
        distanceToMunicipality,
        availableMunicipalities,
        changeMunicipality,
        refreshLocation,
        clearManualSelection,
    };

    return (
        <MunicipalityContext.Provider value={value}>
            {children}
        </MunicipalityContext.Provider>
    );
}

export function useMunicipality(): MunicipalityContextValue {
    const context = useContext(MunicipalityContext);
    if (context === undefined) {
        throw new Error('useMunicipality must be used within a MunicipalityProvider');
    }
    return context;
}
