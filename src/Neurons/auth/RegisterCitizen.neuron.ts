/**
 * NEURON - RegisterCitizen
 * 
 * Use case: Register a new citizen in the system.
 * Orchestrates the auth gateway and profile creation.
 */

import { IAuthGateway } from '../../Cortex/ports/IAuthGateway';
import { RegisterCitizenInput, AuthResultOutput } from '../../Signals/auth.signals';

export class RegisterCitizenNeuron {
    constructor(private readonly authGateway: IAuthGateway) { }

    /**
     * Execute the registration use case
     */
    async execute(input: RegisterCitizenInput): Promise<AuthResultOutput> {
        // 1. Validate input (business rules)
        this.validateInput(input);

        // 2. Call the auth gateway to register
        const result = await this.authGateway.register({
            email: input.email,
            password: input.password,
            firstName: input.firstName,
            lastName: input.lastName,
            pinCode: input.pinCode,
            phone: input.phone,
            nationality: input.nationality,
            dateOfBirth: input.dateOfBirth
        });

        // 3. Return the result signal
        return {
            userId: result.userId,
            email: result.email,
            firstName: input.firstName,
            lastName: input.lastName,
            sessionToken: result.sessionToken,
            isNewUser: result.isNewUser,
            pinCode: input.pinCode
        };
    }

    private validateInput(input: RegisterCitizenInput): void {
        if (!input.email || !input.email.includes('@')) {
            throw new Error('Email invalide');
        }
        if (!input.password || input.password.length < 6) {
            throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }
        if (!input.firstName || !input.lastName) {
            throw new Error('Nom et prénom requis');
        }
        if (!input.pinCode || input.pinCode.length !== 6) {
            throw new Error('Le code PIN doit contenir 6 chiffres');
        }
    }
}
