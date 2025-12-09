/**
 * SIGNAL - Auth Signals
 * 
 * DTOs for authentication operations.
 */

// ============================================================
// INPUT SIGNALS
// ============================================================

export interface RegisterCitizenInput {
    readonly email: string;
    readonly password: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly pinCode: string;
    readonly phone?: string;
    readonly nationality?: string;
    readonly dateOfBirth?: string;
    readonly placeOfBirth?: string;
    readonly profession?: string;
    readonly maritalStatus?: string;
    readonly address?: string;
    readonly city?: string;
    readonly postalCode?: string;
    // Extended
    readonly fatherName?: string;
    readonly motherName?: string;
    readonly emergencyContactFirstName?: string;
    readonly emergencyContactLastName?: string;
    readonly emergencyContactPhone?: string;
    readonly employer?: string;
    // Files (paths to uploaded files)
    readonly photoPath?: string;
    readonly passportPath?: string;
    readonly birthCertPath?: string;
    readonly proofOfAddressPath?: string;
}

export interface LoginByEmailInput {
    readonly email: string;
    readonly password: string;
}

export interface LoginByPinInput {
    readonly email: string;
    readonly pinCode: string;
}

// ============================================================
// OUTPUT SIGNALS
// ============================================================

export interface AuthResultOutput {
    readonly userId: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly sessionToken?: string;
    readonly isNewUser: boolean;
    readonly pinCode?: string;
}

export interface AuthErrorOutput {
    readonly code: string;
    readonly message: string;
}
