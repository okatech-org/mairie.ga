import { useState } from 'react';
import { motion } from 'framer-motion';
import { MOCK_MAIRIES_NETWORK, MairieInfo, GabonProvince } from '@/data/mock-mairies-network';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Building2, ChevronRight } from 'lucide-react';

// Positions SVG approximatives des provinces du Gabon
const PROVINCE_POSITIONS: Record<GabonProvince, { x: number; y: number; width: number; height: number }> = {
  [GabonProvince.ESTUAIRE]: { x: 120, y: 180, width: 80, height: 60 },
  [GabonProvince.HAUT_OGOOUE]: { x: 280, y: 220, width: 100, height: 80 },
  [GabonProvince.MOYEN_OGOOUE]: { x: 140, y: 140, width: 70, height: 50 },
  [GabonProvince.NGOUNIE]: { x: 180, y: 280, width: 90, height: 70 },
  [GabonProvince.NYANGA]: { x: 120, y: 340, width: 80, height: 60 },
  [GabonProvince.OGOOUE_LOLO]: { x: 240, y: 300, width: 80, height: 60 },
  [GabonProvince.OGOOUE_IVINDO]: { x: 240, y: 80, width: 120, height: 100 },
  [GabonProvince.OGOOUE_MARITIME]: { x: 60, y: 240, width: 80, height: 80 },
  [GabonProvince.WOLEU_NTEM]: { x: 160, y: 20, width: 120, height: 80 },
};

const PROVINCE_COLORS: Record<GabonProvince, string> = {
  [GabonProvince.ESTUAIRE]: 'hsl(var(--primary))',
  [GabonProvince.HAUT_OGOOUE]: 'hsl(142 76% 36%)',
  [GabonProvince.MOYEN_OGOOUE]: 'hsl(221 83% 53%)',
  [GabonProvince.NGOUNIE]: 'hsl(262 83% 58%)',
  [GabonProvince.NYANGA]: 'hsl(24 95% 53%)',
  [GabonProvince.OGOOUE_LOLO]: 'hsl(346 77% 50%)',
  [GabonProvince.OGOOUE_IVINDO]: 'hsl(173 80% 40%)',
  [GabonProvince.OGOOUE_MARITIME]: 'hsl(199 89% 48%)',
  [GabonProvince.WOLEU_NTEM]: 'hsl(45 93% 47%)',
};

interface GabonMapProps {
  onSelectMairie?: (mairie: MairieInfo) => void;
}

export const GabonMap = ({ onSelectMairie }: GabonMapProps) => {
  const [selectedProvince, setSelectedProvince] = useState<GabonProvince | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<GabonProvince | null>(null);

  const mairiesByProvince = MOCK_MAIRIES_NETWORK.reduce((acc, mairie) => {
    const province = mairie.province;
    if (!acc[province]) acc[province] = [];
    acc[province].push(mairie);
    return acc;
  }, {} as Record<GabonProvince, MairieInfo[]>);

  const provinces = Object.values(GabonProvince);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Carte interactive */}
      <div className="lg:col-span-2">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-hero text-primary-foreground">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Carte des Mairies du Gabon
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative w-full aspect-[4/5] bg-muted/20 rounded-lg overflow-hidden">
              {/* SVG Carte du Gabon simplifiée */}
              <svg 
                viewBox="0 0 400 450" 
                className="w-full h-full"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
              >
                {/* Fond océan */}
                <rect x="0" y="0" width="400" height="450" fill="hsl(var(--muted))" opacity="0.3" />
                
                {/* Provinces */}
                {provinces.map((province) => {
                  const pos = PROVINCE_POSITIONS[province];
                  const isSelected = selectedProvince === province;
                  const isHovered = hoveredProvince === province;
                  const mairies = mairiesByProvince[province] || [];
                  
                  return (
                    <motion.g
                      key={province}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: provinces.indexOf(province) * 0.1 }}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedProvince(isSelected ? null : province)}
                      onMouseEnter={() => setHoveredProvince(province)}
                      onMouseLeave={() => setHoveredProvince(null)}
                    >
                      <motion.rect
                        x={pos.x}
                        y={pos.y}
                        width={pos.width}
                        height={pos.height}
                        rx="8"
                        fill={PROVINCE_COLORS[province]}
                        opacity={isSelected || isHovered ? 1 : 0.7}
                        stroke={isSelected ? 'hsl(var(--foreground))' : 'white'}
                        strokeWidth={isSelected ? 3 : 1}
                        animate={{ 
                          scale: isHovered ? 1.05 : 1,
                          opacity: isSelected || isHovered ? 1 : 0.7
                        }}
                      />
                      <text
                        x={pos.x + pos.width / 2}
                        y={pos.y + pos.height / 2 - 8}
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {province.split('_').map(w => w.charAt(0)).join('')}
                      </text>
                      <text
                        x={pos.x + pos.width / 2}
                        y={pos.y + pos.height / 2 + 8}
                        textAnchor="middle"
                        fill="white"
                        fontSize="14"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {mairies.length}
                      </text>
                      <text
                        x={pos.x + pos.width / 2}
                        y={pos.y + pos.height / 2 + 22}
                        textAnchor="middle"
                        fill="white"
                        fontSize="8"
                        opacity="0.8"
                        className="pointer-events-none"
                      >
                        mairies
                      </text>
                    </motion.g>
                  );
                })}

                {/* Légende drapeau */}
                <g transform="translate(20, 400)">
                  <rect x="0" y="0" width="60" height="40" fill="#009639" rx="4" />
                  <rect x="20" y="0" width="20" height="40" fill="#FCD116" />
                  <rect x="40" y="0" width="20" height="40" fill="#0033A0" rx="4" />
                  <text x="30" y="55" textAnchor="middle" fontSize="10" fill="hsl(var(--foreground))">Gabon</text>
                </g>
              </svg>

              {/* Info bulle province survolée */}
              {hoveredProvince && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm border rounded-lg p-3"
                >
                  <p className="font-semibold">{hoveredProvince.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-muted-foreground">
                    {(mairiesByProvince[hoveredProvince] || []).length} mairies
                  </p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des mairies */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {selectedProvince 
                ? selectedProvince.replace(/_/g, ' ')
                : 'Sélectionnez une province'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {selectedProvince ? (
              (mairiesByProvince[selectedProvince] || []).map((mairie) => (
                <motion.div
                  key={mairie.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-between h-auto py-3 px-4"
                    onClick={() => onSelectMairie?.(mairie)}
                  >
                    <div className="text-left">
                      <p className="font-medium">{mairie.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Users className="h-3 w-3" />
                        <span>{mairie.population?.toLocaleString() || 'N/A'} hab.</span>
                        {mairie.isCapital && (
                          <Badge variant="secondary" className="text-[10px] px-1">
                            Chef-lieu
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Button>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Cliquez sur une province pour voir ses mairies</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistiques */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">{MOCK_MAIRIES_NETWORK.length}</p>
                <p className="text-xs text-muted-foreground">Mairies</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">9</p>
                <p className="text-xs text-muted-foreground">Provinces</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};