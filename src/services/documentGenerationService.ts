import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Packer } from "docx";

export interface DocumentTemplate {
    name: string;
    type: "decret" | "rapport" | "note" | "courrier" | "acte";
    styles: {
        header: {
            fontSize: number;
            bold: boolean;
            alignment: "left" | "center" | "right";
            font?: string;
            color?: string;
        };
        body: {
            fontSize: number;
            lineHeight: number;
            font?: string;
            alignment?: "left" | "center" | "right" | "justify";
        };
        watermark?: boolean;
    };
    layout: string;
}

export const DOCUMENT_TEMPLATES: Record<string, DocumentTemplate> = {
    "acte_naissance": {
        name: "Acte de Naissance",
        type: "acte",
        styles: {
            header: { fontSize: 16, bold: true, alignment: "center", font: "Times" },
            body: { fontSize: 12, lineHeight: 1.6, alignment: "justify", font: "Times" },
            watermark: true,
        },
        layout: "official_municipal",
    },
    "acte_mariage": {
        name: "Acte de Mariage",
        type: "acte",
        styles: {
            header: { fontSize: 16, bold: true, alignment: "center", font: "Times" },
            body: { fontSize: 12, lineHeight: 1.6, alignment: "justify", font: "Times" },
            watermark: true,
        },
        layout: "official_municipal",
    },
    "certificat_residence": {
        name: "Certificat de Résidence",
        type: "acte",
        styles: {
            header: { fontSize: 14, bold: true, alignment: "center", font: "Times" },
            body: { fontSize: 12, lineHeight: 1.5, font: "Times" },
        },
        layout: "standard_municipal",
    },
    "rapport": {
        name: "Rapport Municipal",
        type: "rapport",
        styles: {
            header: { fontSize: 14, bold: true, alignment: "center", font: "Roboto" },
            body: { fontSize: 12, lineHeight: 1.5, font: "Times" },
        },
        layout: "standard_modern",
    },
    "note": {
        name: "Note de Service",
        type: "note",
        styles: {
            header: { fontSize: 12, bold: true, alignment: "left", color: "#009E60" },
            body: { fontSize: 11, lineHeight: 1.3 },
        },
        layout: "executive_dynamic",
    },
    "courrier": {
        name: "Courrier Officiel",
        type: "courrier",
        styles: {
            header: { fontSize: 12, bold: true, alignment: "left" },
            body: { fontSize: 11, lineHeight: 1.4, alignment: "justify" },
        },
        layout: "formal_letter",
    },
};

export interface GenerateDocumentParams {
    title: string;
    content: string;
    template: keyof typeof DOCUMENT_TEMPLATES;
    format?: "pdf" | "docx";
    metadata?: Record<string, any>;
    onProgress?: (progress: number, status: string) => void;
}

export class DocumentGenerationService {
    async generateDocument(params: GenerateDocumentParams): Promise<{
        blob: Blob;
        fileName: string;
        documentId: string;
    }> {
        const { format = "pdf" } = params;

        if (format === "docx") {
            return this.generateDOCX(params);
        }
        return this.generatePDF(params);
    }

    async generatePDF(params: GenerateDocumentParams): Promise<{
        blob: Blob;
        fileName: string;
        documentId: string;
    }> {
        const { title, content, template, metadata, onProgress } = params;
        const templateConfig = DOCUMENT_TEMPLATES[template];

        try {
            onProgress?.(10, "Initialisation du document...");
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });

            onProgress?.(30, "Application du template...");
            this.applyTemplate(doc, templateConfig, title, content);

            onProgress?.(60, "Génération du fichier PDF...");
            const pdfBlob = doc.output("blob");

            onProgress?.(80, "Sauvegarde dans le cloud...");
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const fileName = `${template}_${Date.now()}.pdf`;
            const filePath = `${user.id}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("generated-documents")
                .upload(filePath, pdfBlob, {
                    contentType: "application/pdf",
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Sauvegarder dans la table documents
            onProgress?.(90, "Enregistrement des métadonnées...");
            const { data: docData, error: docError } = await supabase
                .from("documents")
                .insert({
                    user_id: user.id,
                    name: title,
                    file_path: filePath,
                    file_type: "application/pdf",
                    file_size: pdfBlob.size,
                    category: template,
                })
                .select()
                .single();

            if (docError) throw docError;

            onProgress?.(100, "Document généré avec succès !");

            return {
                blob: pdfBlob,
                fileName,
                documentId: docData.id,
            };
        } catch (error) {
            console.error("Error generating PDF:", error);
            throw error;
        }
    }

    async generateDOCX(params: GenerateDocumentParams): Promise<{
        blob: Blob;
        fileName: string;
        documentId: string;
    }> {
        const { title, content, template, metadata, onProgress } = params;
        const templateConfig = DOCUMENT_TEMPLATES[template];

        try {
            onProgress?.(10, "Initialisation du document...");

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: title,
                            heading: HeadingLevel.HEADING_1,
                            alignment: templateConfig.styles.header.alignment === "center" 
                                ? AlignmentType.CENTER 
                                : templateConfig.styles.header.alignment === "right"
                                    ? AlignmentType.RIGHT
                                    : AlignmentType.LEFT,
                        }),
                        new Paragraph({
                            children: [new TextRun({ text: "" })],
                        }),
                        ...content.split('\n').map(line => 
                            new Paragraph({
                                text: line,
                                alignment: templateConfig.styles.body.alignment === "justify"
                                    ? AlignmentType.JUSTIFIED
                                    : AlignmentType.LEFT,
                            })
                        ),
                    ],
                }],
            });

            onProgress?.(50, "Génération du fichier DOCX...");
            const docxBlob = await Packer.toBlob(doc);

            onProgress?.(80, "Sauvegarde dans le cloud...");
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const fileName = `${template}_${Date.now()}.docx`;
            const filePath = `${user.id}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("generated-documents")
                .upload(filePath, docxBlob, {
                    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            onProgress?.(90, "Enregistrement des métadonnées...");
            const { data: docData, error: docError } = await supabase
                .from("documents")
                .insert({
                    user_id: user.id,
                    name: title,
                    file_path: filePath,
                    file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    file_size: docxBlob.size,
                    category: template,
                })
                .select()
                .single();

            if (docError) throw docError;

            onProgress?.(100, "Document généré avec succès !");

            return {
                blob: docxBlob,
                fileName,
                documentId: docData.id,
            };
        } catch (error) {
            console.error("Error generating DOCX:", error);
            throw error;
        }
    }

    private applyTemplate(doc: jsPDF, template: DocumentTemplate, title: string, content: string) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const usableWidth = pageWidth - (margin * 2);

        // En-tête République Gabonaise
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        doc.text("RÉPUBLIQUE GABONAISE", pageWidth / 2, 15, { align: "center" });
        doc.setFontSize(8);
        doc.text("Union - Travail - Justice", pageWidth / 2, 20, { align: "center" });

        // Ligne de séparation
        doc.setDrawColor(0, 158, 96); // Vert gabonais
        doc.setLineWidth(0.5);
        doc.line(margin, 25, pageWidth - margin, 25);

        // Titre du document
        doc.setFontSize(template.styles.header.fontSize);
        doc.setFont(template.styles.header.font || "times", template.styles.header.bold ? "bold" : "normal");
        
        const titleX = template.styles.header.alignment === "center" 
            ? pageWidth / 2 
            : template.styles.header.alignment === "right"
                ? pageWidth - margin
                : margin;
        
        doc.text(title, titleX, 40, { 
            align: template.styles.header.alignment,
            maxWidth: usableWidth
        });

        // Contenu
        doc.setFontSize(template.styles.body.fontSize);
        doc.setFont(template.styles.body.font || "times", "normal");
        
        const lines = doc.splitTextToSize(content, usableWidth);
        let y = 55;
        const lineHeight = template.styles.body.lineHeight * 5;

        for (const line of lines) {
            if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += lineHeight;
        }

        // Filigrane si activé
        if (template.styles.watermark) {
            doc.setTextColor(200, 200, 200);
            doc.setFontSize(60);
            doc.text("OFFICIEL", pageWidth / 2, pageHeight / 2, {
                align: "center",
                angle: 45,
            });
            doc.setTextColor(0, 0, 0);
        }
    }

    async getDocumentsByUser(userId: string): Promise<any[]> {
        const { data, error } = await supabase
            .from("documents")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
    }

    async deleteDocument(documentId: string): Promise<void> {
        const { data: doc, error: fetchError } = await supabase
            .from("documents")
            .select("file_path")
            .eq("id", documentId)
            .single();

        if (fetchError) throw fetchError;

        if (doc?.file_path) {
            const { error: storageError } = await supabase.storage
                .from("generated-documents")
                .remove([doc.file_path]);

            if (storageError) console.error("Error deleting from storage:", storageError);
        }

        const { error: deleteError } = await supabase
            .from("documents")
            .delete()
            .eq("id", documentId);

        if (deleteError) throw deleteError;
    }
}

export const documentGenerationService = new DocumentGenerationService();
