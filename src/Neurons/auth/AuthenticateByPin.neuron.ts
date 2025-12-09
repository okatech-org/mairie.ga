/**
 * NEURON - AuthenticateByPin
 * 
 * Use case: Authenticate a user with email and PIN code.
 */

import { IAuthGateway } from '../../Cortex/ports/IAuthGateway';
import { LoginByPinInput, AuthResultOutput } from '../../Signals/auth.signals';

export class AuthenticateByPinNeuron {
    constructor(private readonly authGateway: IAuthGateway) { }

    /**
     * Execute the PIN login use case
     */
    async execute(input: LoginByPinInput): Promise<AuthResultOutput> {
        // 1. Validate input
        if (!input.email) {
            throw new Error('Email requis');
        }
        if (!input.pinCode || input.pinCode.length !== 6) {
            throw new Error('Code PIN invalide (6 chiffres requis)');
        }

        // 2. Call the auth gateway
        const result = await this.authGateway.loginWithPin({
            email: input.email,
            pinCode: input.pinCode
        });

        // 3. Return the result signal
        return {
            userId: result.userId,
            email: result.email,
            firstName: '',
            lastName: '',
            sessionToken: result.sessionToken,
            isNewUser: false
        };
    }
}
