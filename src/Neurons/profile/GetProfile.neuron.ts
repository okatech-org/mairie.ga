/**
 * NEURON - GetProfile
 * 
 * Use case: Retrieve a user's profile by their user ID.
 */

import { IProfileRepository } from '../../Cortex/ports/IProfileRepository';
import { GetProfileInput, ProfileOutput } from '../../Signals/profile.signals';

export class GetProfileNeuron {
    constructor(private readonly profileRepository: IProfileRepository) { }

    async execute(input: GetProfileInput): Promise<ProfileOutput | null> {
        // 1. Validate input
        if (!input.userId) {
            throw new Error('User ID requis');
        }

        // 2. Fetch profile from repository
        const profile = await this.profileRepository.findByUserId(input.userId);

        if (!profile) {
            return null;
        }

        // 3. Transform to output signal
        return this.toOutput(profile);
    }

    private toOutput(profile: any): ProfileOutput {
        return {
            id: profile.identity.id,
            userId: profile.identity.userId,
            firstName: profile.personalInfo.firstName,
            lastName: profile.personalInfo.lastName,
            fullName: `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`,
            email: profile.identity.email,
            phone: profile.personalInfo.phone,
            role: profile.role,
            roleLabel: this.getRoleLabel(profile.role),
            organizationId: profile.employment.organizationId,
            organizationName: profile.employment.employer,
            createdAt: profile.createdAt.toISOString()
        };
    }

    private getRoleLabel(role: string): string {
        const labels: Record<string, string> = {
            'MAIRE': 'Maire',
            'MAIRE_ADJOINT': 'Maire Adjoint',
            'SECRETAIRE_GENERAL': 'Secrétaire Général',
            'CHEF_SERVICE': 'Chef de Service',
            'AGENT_MUNICIPAL': 'Agent Municipal',
            'AGENT_ETAT_CIVIL': 'Agent État Civil',
            'CITOYEN': 'Citoyen'
        };
        return labels[role] || role;
    }
}
