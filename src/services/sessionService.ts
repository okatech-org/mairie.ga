import { supabase } from '@/integrations/supabase/client';
import { invokeWithDemoFallback } from '@/utils/demoMode';

export interface ActiveSession {
  id: string;
  user_id: string;
  session_token: string;
  device_info: string | null;
  ip_address: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  last_activity: string;
  created_at: string;
  is_current: boolean;
}

export interface SessionHistoryItem {
  id: string;
  user_id: string;
  session_token: string | null;
  login_at: string;
  logout_at: string | null;
  device_info: string | null;
  ip_address: string | null;
  location: string | null;
  browser: string | null;
  os: string | null;
}

// Detect browser info
function getBrowserInfo(): { browser: string; os: string } {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';

  // Detect browser
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { browser, os };
}

// Get device type
function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'Mobile';
  if (/Tablet|iPad/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

interface NewDeviceAlertResponse {
  is_new_device: boolean;
  location: string | null;
  alert_sent: boolean;
}

async function hashSessionToken(raw: string): Promise<string> {
  const bytes = new TextEncoder().encode(raw);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check for new device and send alert
async function checkNewDeviceAndAlert(
  userId: string,
  deviceInfo: string,
  browser: string,
  os: string,
  ipAddress: string
): Promise<{ isNew: boolean; location: string | null }> {
  try {
    if (!userId) return { isNew: false, location: null };
    const { data, error, isDemo } = await invokeWithDemoFallback<NewDeviceAlertResponse>(
      'new-device-alert',
      {
        device_info: deviceInfo,
        browser,
        os,
        ip_address: ipAddress
      }
    );

    if (error) {
      console.error('Error checking new device:', error);
      return { isNew: false, location: null };
    }

    if (isDemo) {
      console.log('[Session] Demo mode - new device check simulated');
      return { isNew: false, location: 'Libreville, Gabon' };
    }

    console.log('New device check result:', data);
    return {
      isNew: data?.is_new_device || false,
      location: data?.location || null
    };
  } catch (err) {
    console.error('Error in checkNewDeviceAndAlert:', err);
    return { isNew: false, location: null };
  }
}

// Register a new session after login
export async function registerSession(userId: string, sessionToken: string, userEmail?: string): Promise<void> {
  try {
    const { browser, os } = getBrowserInfo();
    const deviceInfo = getDeviceInfo();
    const ipAddress = 'Unknown';
    const sessionTokenHash = await hashSessionToken(sessionToken);

    // Check for new device and get location (also sends alert if new device)
    let location: string | null = null;
    const result = await checkNewDeviceAndAlert(userId, deviceInfo, browser, os, ipAddress);
    location = result.location;

    // First, mark all other sessions as not current
    await supabase
      .from('active_sessions')
      .update({ is_current: false })
      .eq('user_id', userId);

    // Insert new active session
    const { error } = await supabase
      .from('active_sessions')
      .upsert({
        user_id: userId,
        session_token: sessionTokenHash,
        device_info: deviceInfo,
        ip_address: ipAddress,
        browser,
        os,
        location,
        is_current: true,
        last_activity: new Date().toISOString(),
      }, {
        onConflict: 'session_token'
      });

    if (error) {
      console.error('Error registering active session:', error);
    }

    // Insert into session history (using any to bypass type generation delay)
    const { error: historyError } = await (supabase as any)
      .from('session_history')
      .insert({
        user_id: userId,
        session_token: sessionTokenHash,
        device_info: deviceInfo,
        ip_address: ipAddress,
        browser,
        os,
        location,
        login_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('Error registering session history:', historyError);
    }

  } catch (err) {
    console.error('Error in registerSession:', err);
  }
}

// Update last activity for current session
export async function updateSessionActivity(sessionToken: string): Promise<void> {
  try {
    const sessionTokenHash = await hashSessionToken(sessionToken);
    await supabase
      .from('active_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('session_token', sessionTokenHash);
  } catch (err) {
    console.error('Error updating session activity:', err);
  }
}

// Get all active sessions for a user
export async function getUserSessions(userId: string): Promise<ActiveSession[]> {
  const { data, error } = await supabase
    .from('active_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('last_activity', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }

  return data as ActiveSession[];
}

// Get session history for a user
export async function getSessionHistory(userId: string): Promise<SessionHistoryItem[]> {
  const { data, error } = await (supabase as any)
    .from('session_history')
    .select('*')
    .eq('user_id', userId)
    .order('login_at', { ascending: false });

  if (error) {
    console.error('Error fetching session history:', error);
    return [];
  }

  return (data || []) as SessionHistoryItem[];
}

// Get all active sessions (for super admin)
export async function getAllSessions(): Promise<ActiveSession[]> {
  const { data, error } = await supabase
    .from('active_sessions')
    .select('*')
    .order('last_activity', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching all sessions:', error);
    return [];
  }

  return data as ActiveSession[];
}

// Terminate a specific session
export async function terminateSession(sessionId: string): Promise<boolean> {
  // First get the session token to update history
  const { data: sessionData } = await supabase
    .from('active_sessions')
    .select('session_token')
    .eq('id', sessionId)
    .single();

  if (sessionData) {
    // Mark as logged out in history
    await (supabase as any)
      .from('session_history')
      .update({ logout_at: new Date().toISOString() })
      .eq('session_token', sessionData.session_token);
  }

  const { error } = await supabase
    .from('active_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Error terminating session:', error);
    return false;
  }

  return true;
}

// Terminate all sessions except current
export async function terminateOtherSessions(userId: string, currentSessionToken: string): Promise<boolean> {
  const currentSessionTokenHash = await hashSessionToken(currentSessionToken);
  // Get all other sessions to update history
  const { data: otherSessions } = await supabase
    .from('active_sessions')
    .select('session_token')
    .eq('user_id', userId)
    .neq('session_token', currentSessionTokenHash);

  if (otherSessions && otherSessions.length > 0) {
    const tokens = otherSessions.map(s => s.session_token);
    await (supabase as any)
      .from('session_history')
      .update({ logout_at: new Date().toISOString() })
      .in('session_token', tokens);
  }

  const { error } = await supabase
    .from('active_sessions')
    .delete()
    .eq('user_id', userId)
    .neq('session_token', currentSessionTokenHash);

  if (error) {
    console.error('Error terminating other sessions:', error);
    return false;
  }

  return true;
}

// Remove current session on logout
export async function removeCurrentSession(sessionToken: string): Promise<void> {
  try {
    const sessionTokenHash = await hashSessionToken(sessionToken);
    // Update history with logout time
    await (supabase as any)
      .from('session_history')
      .update({ logout_at: new Date().toISOString() })
      .eq('session_token', sessionTokenHash);

    // Remove active session
    await supabase
      .from('active_sessions')
      .delete()
      .eq('session_token', sessionTokenHash);
  } catch (err) {
    console.error('Error removing session:', err);
  }
}
