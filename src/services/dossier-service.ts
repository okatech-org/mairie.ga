
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document } from '@/types/document';

export const dossierService = {
    generateDossier: async (documents: Document[], title: string = 'Dossier'): Promise<Uint8Array> => {
        const mergedPdf = await PDFDocument.create();
        const font = await mergedPdf.embedFont(StandardFonts.Helvetica);

        // Add Cover Page
        const page = mergedPdf.addPage();
        const { width, height } = page.getSize();
        page.drawText(title, {
            x: 50,
            y: height - 100,
            size: 30,
            font,
            color: rgb(0, 0, 0),
        });
        page.drawText(`Généré le ${new Date().toLocaleDateString()}`, {
            x: 50,
            y: height - 150,
            size: 12,
            font,
            color: rgb(0.5, 0.5, 0.5),
        });

        for (const doc of documents) {
            try {
                // Fetch document content
                const response = await fetch(doc.url);
                const arrayBuffer = await response.arrayBuffer();

                if (doc.fileType?.includes('pdf') || doc.url.toLowerCase().endsWith('.pdf')) {
                    // Merge PDF
                    const srcDoc = await PDFDocument.load(arrayBuffer);
                    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                } else if (doc.fileType?.startsWith('image/') || doc.url.match(/\.(jpg|jpeg|png)$/i)) {
                    // Embed Image
                    let image;
                    if (doc.fileType?.includes('png') || doc.url.toLowerCase().endsWith('.png')) {
                        image = await mergedPdf.embedPng(arrayBuffer);
                    } else {
                        image = await mergedPdf.embedJpg(arrayBuffer);
                    }

                    const imgDims = image.scale(1);
                    const page = mergedPdf.addPage();
                    const { width, height } = page.getSize();

                    // Fit image to page (A4) maintaining aspect ratio
                    const scale = Math.min(
                        (width - 40) / imgDims.width,
                        (height - 40) / imgDims.height
                    );

                    page.drawImage(image, {
                        x: (width - imgDims.width * scale) / 2,
                        y: (height - imgDims.height * scale) / 2,
                        width: imgDims.width * scale,
                        height: imgDims.height * scale,
                    });
                }
            } catch (error) {
                console.error(`Failed to include document ${doc.title}:`, error);
                // Continue with other documents
            }
        }

        return await mergedPdf.save();
    },

    downloadPdf: (data: Uint8Array, filename: string) => {
        const blob = new Blob([data as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
