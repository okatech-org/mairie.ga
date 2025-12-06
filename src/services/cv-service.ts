import { CV } from '@/types/cv';
import { MOCK_CV } from '@/data/mock-cv';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class CVService {
    private cv: CV = {
        ...MOCK_CV,
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean.dupont@example.com",
        phone: "+241 01 23 45 67",
        address: "Libreville, Gabon"
    };

    async getMyCV(): Promise<CV> {
        await delay(500);
        return this.cv;
    }

    async updateCV(data: Partial<CV>): Promise<CV> {
        await delay(800);
        this.cv = {
            ...this.cv,
            ...data,
            updatedAt: new Date().toISOString()
        };
        return this.cv;
    }
}

export const cvService = new CVService();
