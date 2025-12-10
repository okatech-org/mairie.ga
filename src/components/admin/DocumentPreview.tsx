import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Download, FileText, RefreshCw } from 'lucide-react';

interface DocumentSettings {
  province: string;
  commune: string;
  cabinet: string;
  republic: string;
  motto: string;
  signature_title: string;
  footer_address: string;
  footer_email: string;
  logo_url: string;
  primary_color: string;
}

interface DocumentPreviewProps {
  settings: DocumentSettings;
  onGeneratePDF?: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'lettre', label: 'Lettre officielle' },
  { value: 'note_service', label: 'Note de service' },
  { value: 'communique', label: 'Communiqué' },
  { value: 'arrete', label: 'Arrêté' },
  { value: 'attestation', label: 'Attestation' },
];

export default function DocumentPreview({ settings, onGeneratePDF }: DocumentPreviewProps) {
  const [documentType, setDocumentType] = useState('lettre');
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoLoaded(false);
    setLogoError(false);
  }, [settings.logo_url]);

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  const referenceNum = "N° 00123/PE/CL/CAB-DC";

  const renderDocumentContent = () => {
    switch (documentType) {
      case 'note_service':
        return (
          <>
            <div className="text-center font-bold underline text-sm mb-3" style={{ color: settings.primary_color }}>
              NOTE DE SERVICE
            </div>
            <div className="text-xs mb-2">
              <span className="font-semibold">Objet :</span> Organisation des services municipaux
            </div>
            <div className="text-xs text-justify leading-relaxed space-y-2">
              <p>Il est porté à la connaissance de l'ensemble du personnel que les horaires de service sont modifiés comme suit...</p>
              <p>J'attache du prix à la stricte application de la présente Note de Service.</p>
            </div>
          </>
        );
      case 'communique':
        return (
          <>
            <div className="text-center font-bold underline text-sm mb-3" style={{ color: settings.primary_color }}>
              COMMUNIQUÉ
            </div>
            <div className="text-xs text-justify leading-relaxed space-y-2">
              <p>La Mairie de Libreville informe les citoyens que...</p>
              <p>Pour tout renseignement complémentaire, veuillez contacter nos services.</p>
            </div>
          </>
        );
      case 'arrete':
        return (
          <>
            <div className="text-center font-bold underline text-sm mb-3" style={{ color: settings.primary_color }}>
              ARRÊTÉ
            </div>
            <div className="text-center text-xs font-semibold mb-2">
              PORTANT RÉGLEMENTATION DE LA CIRCULATION
            </div>
            <div className="text-center text-xs font-semibold mb-2">
              LE MAIRE DE LA COMMUNE DE LIBREVILLE,
            </div>
            <div className="text-xs space-y-1 mb-2">
              <p className="ml-4">Vu la Constitution ;</p>
              <p className="ml-4">Vu la loi organique relative à l'administration territoriale ;</p>
            </div>
            <div className="text-center text-xs font-semibold mb-2">ARRÊTE :</div>
            <div className="text-xs space-y-1">
              <p><strong>Article 1.</strong> La circulation est réglementée...</p>
              <p><strong>Article 2.</strong> Le présent arrêté prend effet...</p>
            </div>
          </>
        );
      case 'attestation':
        return (
          <>
            <div className="text-center font-bold underline text-sm mb-3" style={{ color: settings.primary_color }}>
              ATTESTATION
            </div>
            <div className="text-xs text-justify leading-relaxed space-y-2">
              <p>Je soussigné, Maire de la Commune de Libreville, atteste que :</p>
              <p className="ml-4">M./Mme [NOM PRÉNOM], né(e) le [DATE] à [LIEU], est bien résident(e) de notre commune.</p>
              <p className="italic">En foi de quoi, la présente attestation est délivrée pour servir et valoir ce que de droit.</p>
            </div>
          </>
        );
      default: // lettre
        return (
          <>
            <div className="text-right text-xs mb-3">Libreville, le {currentDate}</div>
            <div className="text-xs mb-2">
              <p className="font-semibold">À l'attention de Monsieur le Directeur</p>
              <p className="italic">Direction Générale des Services</p>
            </div>
            <div className="text-xs mb-2">
              <span className="font-semibold">Objet :</span> Demande de collaboration
            </div>
            <div className="text-xs mb-2">Monsieur/Madame,</div>
            <div className="text-xs text-justify leading-relaxed space-y-2">
              <p>J'ai l'honneur de solliciter votre bienveillante attention sur le dossier relatif à...</p>
              <p>Veuillez agréer, Monsieur/Madame, l'expression de ma haute considération.</p>
            </div>
          </>
        );
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Aperçu du document
          </CardTitle>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* A4 Preview Container */}
        <div 
          className="bg-white border shadow-lg mx-auto overflow-hidden"
          style={{ 
            width: '100%',
            maxWidth: '400px',
            aspectRatio: '210/297',
            padding: '24px',
            fontSize: '8px'
          }}
        >
          {/* Header Tripartite */}
          <div className="flex justify-between items-start mb-4 pb-3 border-b" style={{ borderColor: settings.primary_color }}>
            {/* Left - Administrative hierarchy */}
            <div className="text-center flex-1">
              <div className="font-semibold text-[7px] uppercase">{settings.province}</div>
              <div className="font-semibold text-[7px] uppercase">{settings.commune}</div>
              <div className="font-bold text-[7px] uppercase" style={{ color: settings.primary_color }}>
                {settings.cabinet}
              </div>
              <div className="text-[6px] mt-1 text-muted-foreground">{referenceNum}</div>
            </div>

            {/* Center - Logo */}
            <div className="flex-shrink-0 mx-2 w-12 h-12 flex items-center justify-center">
              {settings.logo_url && !logoError ? (
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain"
                  onLoad={() => setLogoLoaded(true)}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: settings.primary_color }}
                >
                  <FileText className="w-5 h-5" style={{ color: settings.primary_color }} />
                </div>
              )}
            </div>

            {/* Right - Republic */}
            <div className="text-center flex-1">
              <div className="font-bold text-[7px] uppercase">{settings.republic}</div>
              <div className="italic text-[6px]">{settings.motto}</div>
            </div>
          </div>

          {/* Document Content */}
          <div className="min-h-[60%]">
            {renderDocumentContent()}
          </div>

          {/* Signature */}
          <div className="mt-4 text-right">
            <div className="text-xs">{settings.signature_title},</div>
            <div className="h-8"></div>
            <div className="text-xs font-semibold italic">[Signature]</div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-4 left-0 right-0 text-center border-t pt-2 mx-4" style={{ borderColor: '#e5e7eb' }}>
            <div className="text-[6px] text-muted-foreground">
              {settings.footer_address}
              <br />
              {settings.footer_email}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-2 mt-4">
          {onGeneratePDF && (
            <Button variant="outline" size="sm" onClick={onGeneratePDF}>
              <Download className="h-4 w-4 mr-2" />
              Générer PDF test
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
