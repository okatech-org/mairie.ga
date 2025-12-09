import { supabase } from '@/integrations/supabase/client';

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

// Get client IP (simplified, will be filled by edge function or API)
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'Unknown';
  }
}

// Register a new session after login
export async function registerSession(userId: string, sessionToken: string): Promise<void> {
  try {
    const { browser, os } = getBrowserInfo();
    const deviceInfo = getDeviceInfo();
    const ipAddress = await getClientIP();

    // First, mark all other sessions as not current
    await supabase
      .from('active_sessions')
      .update({ is_current: false })
      .eq('user_id', userId);

    // Insert new session
    const { error } = await supabase
      .from('active_sessions')
      .upsert({
        user_id: userId,
        session_token: sessionToken,
        device_info: deviceInfo,
        ip_address: ipAddress,
        browser,
        os,
        is_current: true,
        last_activity: new Date().toISOString(),
      }, {
        onConflict: 'session_token'
      });

    if (error) {
      console.error('Error registering session:', error);
    }
  } catch (err) {
    console.error('Error in registerSession:', err);
  }
}

// Update last activity for current session
export async function updateSessionActivity(sessionToken: string): Promise<void> {
  try {
    await supabase
      .from('active_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('session_token', sessionToken);
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
  const { error } = await supabase
    .from('active_sessions')
    .delete()
    .eq('user_id', userId)
    .neq('session_token', currentSessionToken);

  if (error) {
    console.error('Error terminating other sessions:', error);
    return false;
  }

  return true;
}

// Remove current session on logout
export async function removeCurrentSession(sessionToken: string): Promise<void> {
  try {
    await supabase
      .from('active_sessions')
      .delete()
      .eq('session_token', sessionToken);
  } catch (err) {
    console.error('Error removing session:', err);
  }
}
