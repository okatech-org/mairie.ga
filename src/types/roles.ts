import { MunicipalRole, EmploymentStatus } from './municipal-roles';
import { OrganizationType } from './organization';
import { UserFunction, ServiceAccess, UserQuotas, BillingFeature } from './user-management';

export type UserRole = 'ADMIN' | MunicipalRole | string;

export interface DemoUser {
  id: string;
  role: UserRole;
  name: string;
  gender?: 'M' | 'F' | string;
  entityId?: string;
  permissions: string[];
  badge: string;
  description: string;
  hierarchyLevel?: number;
  employmentStatus?: EmploymentStatus;
  allowedEntityTypes?: OrganizationType[];
  email?: string;
  residenceCountry?: string;
  currentLocation?: string;
  stayDuration?: number;
  managedByOrgId?: string;
  signaledToOrgId?: string;
  functions?: UserFunction[];
  accessibleServices?: ServiceAccess[];
  quotas?: UserQuotas;
  billingFeatures?: BillingFeature[];
}
