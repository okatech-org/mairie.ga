import { supabase } from "@/integrations/supabase/client";

// Generate a random 6-digit PIN code
export function generatePinCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  nationality?: string;
  placeOfBirth?: string;
  profession?: string;
  maritalStatus?: string;
  address?: string;
  city?: string;
  pinCode: string;
}

export async function registerUser(data: RegistrationData) {
  const { email, password, firstName, lastName, pinCode, ...profileData } = data;
  
  // Sign up the user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: {
        first_name: firstName,
        last_name: lastName,
      }
    }
  });

  if (authError) {
    throw authError;
  }

  if (!authData.user) {
    throw new Error("Erreur lors de la création du compte");
  }

  // Wait a moment for the trigger to create the profile
  await new Promise(resolve => setTimeout(resolve, 500));

  // Update the profile with additional data and PIN code
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      date_of_birth: profileData.dateOfBirth || null,
      phone: profileData.phone || null,
      nationality: profileData.nationality || null,
      lieu_naissance: profileData.placeOfBirth || null,
      profession: profileData.profession || null,
      situation_matrimoniale: profileData.maritalStatus || null,
      address: profileData.address ? { full: profileData.address, city: profileData.city } : null,
      pin_code: pinCode,
      pin_enabled: true,
    })
    .eq('user_id', authData.user.id);

  if (profileError) {
    console.error('Profile update error:', profileError);
    // Don't throw - the user is created, profile update can fail silently
  }

  // Assign citizen role
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: authData.user.id,
      role: 'citizen'
    });

  if (roleError) {
    console.error('Role assignment error:', roleError);
  }

  return {
    user: authData.user,
    session: authData.session,
    pinCode,
  };
}

export async function loginWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function loginWithPin(email: string, pinCode: string) {
  // Call the edge function for secure PIN verification
  const { data, error } = await supabase.functions.invoke('auth-pin-login', {
    body: { email, pinCode }
  });

  if (error) {
    throw new Error("Erreur de connexion au serveur");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
