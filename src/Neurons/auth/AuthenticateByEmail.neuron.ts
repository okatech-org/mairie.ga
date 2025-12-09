/**
 * NEURON - AuthenticateByEmail
 * 
 * Use case: Authenticate a user with email and password.
 */

import { IAuthGateway } from '../../Cortex/ports/IAuthGateway';
import { LoginByEmailInput, AuthResultOutput } from '../../Signals/auth.signals';

export class AuthenticateByEmailNeuron {
    constructor(private readonly authGateway: IAuthGateway) { }

    /**
     * Execute the login use case
     */
    async execute(input: LoginByEmailInput): Promise<AuthResultOutput> {
        // 1. Validate input
        if (!input.email || !input.password) {
            throw new Error('Email et mot de passe requis');
        }

        // 2. Call the auth gateway
        const result = await this.authGateway.loginWithPassword({
            email: input.email,
            password: input.password
        });

        // 3. Return the result signal
        return {
            userId: result.userId,
            email: result.email,
            firstName: '', // Will be enriched by profile lookup
            lastName: '',
            sessionToken: result.sessionToken,
            isNewUser: result.isNewUser
        };
    }
}
