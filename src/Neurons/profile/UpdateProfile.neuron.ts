/**
 * NEURON - UpdateProfile
 * 
 * Use case: Update a user's profile information.
 */

import { IProfileRepository, Profile } from '../../Cortex/ports/IProfileRepository';
import { UpdateProfileInput, ProfileOutput } from '../../Signals/profile.signals';

export class UpdateProfileNeuron {
    constructor(private readonly profileRepository: IProfileRepository) { }

    async execute(input: UpdateProfileInput): Promise<ProfileOutput> {
        // 1. Validate input
        if (!input.profileId) {
            throw new Error('Profile ID requis');
        }

        // 2. Fetch existing profile
        const existing = await this.profileRepository.findById(input.profileId);
        if (!existing) {
            throw new Error('Profil non trouvé');
        }

        // 3. Build updated profile (immutable update)
        const updated: Profile = {
            ...existing,
            personalInfo: {
                ...existing.personalInfo,
                firstName: input.firstName ?? existing.personalInfo.firstName,
                lastName: input.lastName ?? existing.personalInfo.lastName,
                phone: input.phone ?? existing.personalInfo.phone,
                dateOfBirth: input.dateOfBirth ?? existing.personalInfo.dateOfBirth,
                nationality: input.nationality ?? existing.personalInfo.nationality
            },
            employment: {
                ...existing.employment,
                profession: input.profession ?? existing.employment.profession,
                employer: input.employer ?? existing.employment.employer
            },
            role: input.role ?? existing.role,
            updatedAt: new Date()
        };

        // 4. Persist changes
        const saved = await this.profileRepository.save(updated);

        // 5. Return output signal
        return {
            id: saved.identity.id,
            userId: saved.identity.userId,
            firstName: saved.personalInfo.firstName,
            lastName: saved.personalInfo.lastName,
            fullName: `${saved.personalInfo.firstName} ${saved.personalInfo.lastName}`,
            email: saved.identity.email,
            phone: saved.personalInfo.phone,
            role: saved.role,
            roleLabel: saved.role,
            organizationId: saved.employment.organizationId,
            organizationName: saved.employment.employer,
            createdAt: saved.createdAt.toISOString()
        };
    }
}
