// Re-export municipal services for backwards compatibility
export * from './municipal-services';

// Legacy ConsularService interface for compatibility
export interface ConsularService {
  id: string;
  name: string;
  description?: string;
  organization_id?: string;
  is_active: boolean;
  requirements?: string[];
  price?: number;
  currency?: string;
  created_at?: string;
  updated_at?: string;
}
