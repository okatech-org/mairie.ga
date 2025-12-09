import { useInactivityLogout } from '@/hooks/useInactivityLogout';

export function InactivityHandler() {
  useInactivityLogout();
  return null;
}
