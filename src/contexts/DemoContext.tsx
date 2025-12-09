import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DemoUser } from '@/types/roles';
import { Entity } from '@/types/entity';
import { MunicipalServiceType } from '@/types/municipal-services';
import { getUserById } from '@/data/mock-users';
import { getEntityById } from '@/data/mock-entities';
import { getMairieById } from '@/data/mock-mairies-network';
import { Organization } from '@/types/organization';

interface DemoContextValue {
  currentUser: DemoUser | null;
  currentEntity: Entity | null;
  currentMairie: Organization | null;
  availableServices: MunicipalServiceType[];
  simulateUser: (userId: string) => void;
  clearSimulation: () => void;
  isSimulating: boolean;
}

export const DemoContext = createContext<DemoContextValue | undefined>(undefined);

const STORAGE_KEY = 'mairies_demo_simulation';

export function DemoProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<DemoUser | null>(null);
  const [currentEntity, setCurrentEntity] = useState<Entity | null>(null);
  const [currentMairie, setCurrentMairie] = useState<Organization | null>(null);

  // Charger la simulation depuis localStorage au montage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { userId } = JSON.parse(stored);
        const user = getUserById(userId);
        if (user) {
          setCurrentUser(user);
          if (user.entityId) {
            // Essayer de trouver l'entité dans les mairies d'abord
            const mairie = getMairieById(user.entityId);
            if (mairie) {
              setCurrentMairie(mairie);
              // Convertir en Entity pour compatibilité
              setCurrentEntity({
                id: mairie.id,
                name: mairie.name,
                type: mairie.type as any,
                countryCode: 'GA',
                enabledServices: mairie.enabled_services || [],
                metadata: {
                  city: mairie.city || '',
                  country: 'Gabon',
                  countryCode: 'GA'
                },
                created_at: mairie.created_at,
                updated_at: mairie.updated_at
              });
            } else {
              // Fallback sur les anciennes entités
              const entity = getEntityById(user.entityId);
              setCurrentEntity(entity || null);
            }
          }
        }
      } catch (error) {
        console.error('Error loading simulation:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const simulateUser = (userId: string) => {
    const user = getUserById(userId);
    if (!user) return;

    setCurrentUser(user);
    
    if (user.entityId) {
      // Essayer de trouver l'entité dans les mairies d'abord
      const mairie = getMairieById(user.entityId);
      if (mairie) {
        setCurrentMairie(mairie);
        setCurrentEntity({
          id: mairie.id,
          name: mairie.name,
          type: mairie.type as any,
          countryCode: 'GA',
          enabledServices: mairie.enabled_services || [],
          metadata: {
            city: mairie.city || '',
            country: 'Gabon',
            countryCode: 'GA'
          },
          created_at: mairie.created_at,
          updated_at: mairie.updated_at
        });
      } else {
        const entity = getEntityById(user.entityId);
        setCurrentEntity(entity || null);
        setCurrentMairie(null);
      }
    } else {
      setCurrentEntity(null);
      setCurrentMairie(null);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId }));
  };

  const clearSimulation = () => {
    setCurrentUser(null);
    setCurrentEntity(null);
    setCurrentMairie(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const availableServices: MunicipalServiceType[] = (currentMairie?.enabled_services || currentEntity?.enabledServices || []) as MunicipalServiceType[];

  const value: DemoContextValue = {
    currentUser,
    currentEntity,
    currentMairie,
    availableServices,
    simulateUser,
    clearSimulation,
    isSimulating: currentUser !== null,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    // Return a default context instead of throwing
    // This allows the hook to be used before the provider is mounted
    return {
      currentUser: null,
      currentEntity: null,
      currentMairie: null,
      availableServices: [],
      simulateUser: () => {},
      clearSimulation: () => {},
      isSimulating: false
    };
  }
  return context;
}