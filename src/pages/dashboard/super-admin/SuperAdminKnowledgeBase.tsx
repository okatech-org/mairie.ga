import { useState } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Trash2, Eye, Search, File, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type DocumentStatus = "indexed" | "processing" | "error";

interface KBDocument {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    status: DocumentStatus;
    chunkCount: number;
}

const MOCK_DOCS: KBDocument[] = [
    { id: "1", name: "Procedures_Consulaires_2024.pdf", type: "PDF", size: "2.4 MB", uploadDate: "2024-03-15", status: "indexed", chunkCount: 145 },
    { id: "2", name: "Tarifs_Visas_V2.pdf", type: "PDF", size: "1.1 MB", uploadDate: "2024-03-10", status: "indexed", chunkCount: 42 },
    { id: "3", name: "faq_mariage.docx", type: "DOCX", size: "500 KB", uploadDate: "2024-03-18", status: "processing", chunkCount: 0 },
    { id: "4", name: "guide_accueil.txt", type: "TXT", size: "12 KB", uploadDate: "2024-03-01", status: "error", chunkCount: 0 },
];

export default function SuperAdminKnowledgeBase() {
    const { toast } = useToast();
    const [documents, setDocuments] = useState<KBDocument[]>(MOCK_DOCS);
    const [search, setSearch] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const filteredDocs = documents.filter(doc =>
        doc.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleUpload = () => {
        if (!selectedFile) return;

        setIsUploading(true);
        // Simulate upload
        setTimeout(() => {
            const newDoc: KBDocument = {
                id: Math.random().toString(),
                name: selectedFile.name,
                type: selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE',
                size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
                uploadDate: new Date().toISOString().split('T')[0],
                status: "processing",
                chunkCount: 0
            };

            setDocuments([newDoc, ...documents]);
            setIsUploading(false);
            setIsUploadOpen(false);
            setSelectedFile(null);

            toast({
                title: "Document ajouté",
                description: "Le fichier est en cours de traitement pour indexation.",
            });
        }, 2000);
    };

    const handleDelete = (id: string) => {
        setDocuments(documents.filter(d => d.id !== id));
        toast({
            title: "Document supprimé",
            description: "Le document a été retiré de la base de connaissances.",
        });
    };

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Base de Connaissances</h1>
                        <p className="text-muted-foreground">Gestion des documents RAG pour iAsted</p>
                    </div>

                    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Upload className="w-4 h-4" />
                                Ajouter un document
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Téléverser un document</DialogTitle>
                                <DialogDescription>
                                    Formats supportés : PDF, DOCX, TXT. Max 10MB.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="file">Fichier</Label>
                                    <Input
                                        id="file"
                                        type="file"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Annuler</Button>
                                <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Téléverser
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="neu-raised">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Documents Indexés</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom du fichier</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Taille</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Chunks</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDocs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                            Aucun document trouvé
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredDocs.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-blue-500" />
                                                {doc.name}
                                            </TableCell>
                                            <TableCell>{doc.type}</TableCell>
                                            <TableCell>{doc.size}</TableCell>
                                            <TableCell>{doc.uploadDate}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    doc.status === "indexed" ? "default" :
                                                        doc.status === "processing" ? "secondary" : "destructive"
                                                } className={
                                                    doc.status === "indexed" ? "bg-green-500 hover:bg-green-600" : ""
                                                }>
                                                    {doc.status === "indexed" ? "Indexé" :
                                                        doc.status === "processing" ? "Traitement..." : "Erreur"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{doc.chunkCount}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon">
                                                    <Eye className="w-4 h-4 text-gray-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
