import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload, X, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadedDocument {
  name: string;
  file: File;
  preview?: string;
}

interface DocumentUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  uploadedFiles: UploadedDocument[];
  onRemoveFile: (index: number) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
}

export const DocumentUploadZone = ({
  onFilesSelected,
  uploadedFiles,
  onRemoveFile,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  }
}: DocumentUploadZoneProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - uploadedFiles.length,
    maxSize,
  });

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    if (ext === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className={cn(
          "h-10 w-10 mx-auto mb-4",
          isDragActive ? "text-primary" : "text-muted-foreground"
        )} />
        {isDragActive ? (
          <p className="text-primary font-medium">Déposez les fichiers ici...</p>
        ) : (
          <div>
            <p className="font-medium">Glissez-déposez vos documents ici</p>
            <p className="text-sm text-muted-foreground mt-1">
              ou cliquez pour sélectionner des fichiers
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              PDF, Images, Word • Max {maxSize / (1024 * 1024)}MB par fichier
            </p>
          </div>
        )}
      </div>

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Documents téléchargés ({uploadedFiles.length})
          </p>
          <div className="grid gap-2">
            {uploadedFiles.map((doc, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
              >
                {doc.preview ? (
                  <img 
                    src={doc.preview} 
                    alt={doc.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  getFileIcon(doc.name)
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
