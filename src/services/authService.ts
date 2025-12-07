import { supabase } from "@/integrations/supabase/client";

// Generate a random 6-digit PIN code
export function generatePinCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Interface for file uploads
interface RegistrationFiles {
  photo?: File;
  passport?: File;
  birthCert?: File;
  proofOfAddress?: File;
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
  postalCode?: string;
  pinCode: string;
  // Extended fields
  fatherName?: string;
  motherName?: string;
  emergencyContactFirstName?: string;
  emergencyContactLastName?: string;
  emergencyContactPhone?: string;
  employer?: string;
  // Files
  files?: RegistrationFiles;
}

export async function registerUser(data: RegistrationData) {
  const { email, password, firstName, lastName, pinCode, files, ...profileData } = data;

  // 1. Sign up the user with Supabase Auth
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

  if (authError) throw authError;
  if (!authData.user) throw new Error("Erreur lors de la création du compte");

  // Wait a moment for the trigger to create the profile
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 2. Upload files if present
  if (files) {
    const uploadFile = async (file: File, category: string) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${authData.user!.id}/${category}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents') // Ensure this bucket exists or use 'citizen_documents'
        .upload(fileName, file);

      if (uploadError) {
        console.error(`Error uploading ${category}:`, uploadError);
        return null;
      }

      // Create document record
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: authData.user!.id,
          name: file.name,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          category: category,
        });

      if (docError) console.error(`Error creating document record for ${category}:`, docError);
    };

    if (files.photo) await uploadFile(files.photo, 'PHOTO_IDENTITE');
    if (files.passport) await uploadFile(files.passport, 'PASSEPORT');
    if (files.birthCert) await uploadFile(files.birthCert, 'ACTE_NAISSANCE');
    if (files.proofOfAddress) await uploadFile(files.proofOfAddress, 'JUSTIFICATIF_DOMICILE');
  }

  // 3. Update the profile with additional data and PIN code
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      date_of_birth: profileData.dateOfBirth || null,
      phone: profileData.phone || null,
      nationality: profileData.nationality || null,
      lieu_naissance: profileData.placeOfBirth || null,
      profession: profileData.profession || null,
      situation_matrimoniale: profileData.maritalStatus || null,
      address: profileData.address ? { full: profileData.address, city: profileData.city, postalCode: profileData.postalCode } : null,
      pin_code: pinCode,
      pin_enabled: true,
      // Extended fields
      father_name: profileData.fatherName || null,
      mother_name: profileData.motherName || null,
      emergency_contact_first_name: profileData.emergencyContactFirstName || null,
      emergency_contact_last_name: profileData.emergencyContactLastName || null,
      emergency_contact_phone: profileData.emergencyContactPhone || null,
      employer: profileData.employer || null,
    })
    .eq('user_id', authData.user.id);

  if (profileError) {
    console.error('Profile update error:', profileError);
    // Don't throw - the user is created, profile update can fail silently but we should log it
  }

  // 4. Assign citizen role
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
