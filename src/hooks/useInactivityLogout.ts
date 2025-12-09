import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useDemo } from '@/contexts/DemoContext';
import { toast } from 'sonner';
import { useSessionConfigStore } from '@/stores/sessionConfigStore';

const WARNING_BEFORE_LOGOUT = 60 * 1000; // 1 minute warning

export function useInactivityLogout() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { clearSimulation } = useDemo();
  const { inactivityTimeout } = useSessionConfigStore();

  const INACTIVITY_TIMEOUT = inactivityTimeout * 60 * 1000; // Convert minutes to ms

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = useCallback(async () => {
    await signOut();
    clearSimulation();
    toast.info("Session expirée", {
      description: "Vous avez été déconnecté pour inactivité."
    });
    navigate('/login');
  }, [signOut, clearSimulation, navigate]);

  const showWarning = useCallback(() => {
    if (!warningShownRef.current) {
      warningShownRef.current = true;
      toast.warning("Session bientôt expirée", {
        description: "Vous serez déconnecté dans 1 minute pour inactivité.",
        duration: 10000,
      });
    }
  }, []);

  const resetTimer = useCallback(() => {
    // Update last activity timestamp
    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    warningShownRef.current = false;

    // Only set timers if user is logged in and timeout is enabled
    if (user && inactivityTimeout > 0) {
      // Set warning timer
      warningRef.current = setTimeout(() => {
        showWarning();
      }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);

      // Set logout timer
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [user, inactivityTimeout, INACTIVITY_TIMEOUT, handleLogout, showWarning]);

  useEffect(() => {
    // If disabled or no user, cleanup and return
    if (!user || inactivityTimeout === 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      return;
    }

    // Events that reset the timer
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    // Throttle to avoid too many resets
    let lastActivity = Date.now();
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastActivity > 1000) { // Only reset if more than 1 second since last reset
        lastActivity = now;
        resetTimer();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, throttledReset, { passive: true });
    });

    // Initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledReset);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, inactivityTimeout, resetTimer]);

  const getLastActivity = useCallback(() => {
    return lastActivityRef.current;
  }, []);

  return { resetTimer, getLastActivity };
}
