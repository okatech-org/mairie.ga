import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MOCK_MAIRIES_NETWORK, GabonProvince } from '@/data/mock-mairies-network';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Building2, ChevronRight, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export const GabonMairiesSection = () => {
  const [hoveredProvince, setHoveredProvince] = useState<GabonProvince | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<GabonProvince | null>(null);

  const mairiesByProvince = useMemo(() => {
    return MOCK_MAIRIES_NETWORK.reduce((acc, mairie) => {
      const province = mairie.province;
      if (!acc[province]) acc[province] = [];
      acc[province].push(mairie);
      return acc;
    }, {} as Record<GabonProvince, typeof MOCK_MAIRIES_NETWORK>);
  }, []);

  const totalPopulation = useMemo(() => {
    return MOCK_MAIRIES_NETWORK.reduce((sum, m) => sum + (m.population || 0), 0);
  }, []);

  const provinces = Object.values(GabonProvince);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Réseau Municipal</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Les Mairies du Gabon
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Découvrez le réseau des mairies à travers les 9 provinces du Gabon
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Carte */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="relative w-full aspect-[4/5] max-h-[500px] bg-muted/20 rounded-lg overflow-hidden">
                  <svg 
                    viewBox="0 0 400 450" 
                    className="w-full h-full"
                    style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
                  >
                    <rect x="0" y="0" width="400" height="450" fill="hsl(var(--muted))" opacity="0.3" />
                    
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
                          transition={{ delay: provinces.indexOf(province) * 0.05 }}
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
                            y={pos.y + pos.height / 2 - 5}
                            textAnchor="middle"
                            fill="white"
                            fontSize="10"
                            fontWeight="600"
                            className="pointer-events-none"
                          >
                            {province.split('_').map(w => w.charAt(0)).join('')}
                          </text>
                          <text
                            x={pos.x + pos.width / 2}
                            y={pos.y + pos.height / 2 + 12}
                            textAnchor="middle"
                            fill="white"
                            fontSize="16"
                            fontWeight="bold"
                            className="pointer-events-none"
                          >
                            {mairies.length}
                          </text>
                        </motion.g>
                      );
                    })}

                    {/* Drapeau Gabon */}
                    <g transform="translate(20, 395)">
                      <rect x="0" y="0" width="50" height="35" fill="#009639" rx="3" />
                      <rect x="16" y="0" width="18" height="35" fill="#FCD116" />
                      <rect x="34" y="0" width="16" height="35" fill="#0033A0" rx="3" />
                    </g>
                  </svg>

                  {/* Tooltip */}
                  {hoveredProvince && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm border rounded-lg p-3"
                    >
                      <p className="font-semibold">{hoveredProvince.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {(mairiesByProvince[hoveredProvince] || []).length} mairie(s)
                      </p>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques & Liste */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Landmark className="h-5 w-5 text-primary" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-3xl font-bold text-primary">{MOCK_MAIRIES_NETWORK.length}</p>
                    <p className="text-sm text-muted-foreground">Mairies</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-3xl font-bold text-primary">9</p>
                    <p className="text-sm text-muted-foreground">Provinces</p>
                  </div>
                </div>
                <div className="mt-4 text-center p-4 bg-primary/5 rounded-lg">
                  <p className="text-2xl font-bold">{totalPopulation.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Habitants desservis</p>
                </div>
              </CardContent>
            </Card>

            {/* Liste province sélectionnée */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  {selectedProvince 
                    ? selectedProvince.replace(/_/g, ' ')
                    : 'Sélectionnez une province'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[250px] overflow-y-auto">
                {selectedProvince ? (
                  (mairiesByProvince[selectedProvince] || []).map((mairie) => (
                    <motion.div
                      key={mairie.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{mairie.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{mairie.population?.toLocaleString() || 'N/A'} hab.</span>
                          {mairie.isCapital && (
                            <Badge variant="secondary" className="text-[10px] px-1">
                              Chef-lieu
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Cliquez sur une province</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Link to="/services" className="block">
              <Button className="w-full" size="lg">
                Voir tous les services
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
