import { Organization, OrganizationType } from '@/types/organization';
import { MAIRIES_GABON } from './mock-mairies-network';

export const MOCK_ORGANIZATIONS: Organization[] = [
    ...MAIRIES_GABON
];

// Re-export for compatibility
export const MOCK_ENTITIES = MOCK_ORGANIZATIONS;

// Helper function to get an organization by ID
export function getEntityById(id: string): Organization | undefined {
    return MOCK_ORGANIZATIONS.find(org => org.id === id);
}