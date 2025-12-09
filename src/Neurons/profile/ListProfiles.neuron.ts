/**
 * NEURON - ListProfiles
 * 
 * Use case: List all profiles, optionally filtered by organization.
 */

import { IProfileRepository } from '../../Cortex/ports/IProfileRepository';
import { ListProfilesInput, ProfileOutput, ProfileListOutput } from '../../Signals/profile.signals';

export class ListProfilesNeuron {
    constructor(private readonly profileRepository: IProfileRepository) { }

    async execute(input: ListProfilesInput): Promise<ProfileListOutput> {
        // 1. Fetch profiles from repository
        const profiles = await this.profileRepository.findAll(input.organizationId);

        // 2. Apply role filter if specified
        let filtered = profiles;
        if (input.role) {
            filtered = profiles.filter(p => p.role === input.role);
        }

        // 3. Apply pagination
        const offset = input.offset ?? 0;
        const limit = input.limit ?? 50;
        const paginated = filtered.slice(offset, offset + limit);

        // 4. Transform to output
        const outputs: ProfileOutput[] = paginated.map(profile => ({
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
        }));

        return {
            profiles: outputs,
            total: filtered.length
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
