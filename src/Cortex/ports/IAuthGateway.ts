/**
 * CORTEX - Port: IAuthGateway
 * 
 * Defines the contract for authentication operations.
 */

// ============================================================
// SIGNALS
// ============================================================

export interface RegisterUserInput {
    readonly email: string;
    readonly password: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly pinCode: string;
    readonly phone?: string;
    readonly nationality?: string;
    readonly dateOfBirth?: string;
}

export interface AuthResult {
    readonly userId: string;
    readonly email: string;
    readonly sessionToken?: string;
    readonly isNewUser: boolean;
}

export interface LoginCredentials {
    readonly email: string;
    readonly password?: string;
    readonly pinCode?: string;
}

// ============================================================
// PORT
// ============================================================

export interface IAuthGateway {
    register(input: RegisterUserInput): Promise<AuthResult>;
    loginWithPassword(credentials: LoginCredentials): Promise<AuthResult>;
    loginWithPin(credentials: LoginCredentials): Promise<AuthResult>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<{ userId: string; email: string } | null>;
    isAuthenticated(): Promise<boolean>;
}
