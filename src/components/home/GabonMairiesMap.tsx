import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { mairiesGabon, provinces } from '@/data/mock-mairies-gabon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Building2, Users } from 'lucide-react';

interface SelectedMairie {
  name: string;
  province: string;
  departement: string;
  population?: number;
  isCapitalProvince?: boolean;
}

const GabonMairiesMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMairie, setSelectedMairie] = useState<SelectedMairie | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        // Fetch Mapbox token from edge function
        const { data, error: fnError } = await supabase.functions.invoke('get-mapbox-token');
        
        if (fnError || !data?.token) {
          throw new Error('Impossible de charger la carte');
        }

        if (!mapContainer.current) return;

        mapboxgl.accessToken = data.token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [11.5, -0.8], // Centre du Gabon
          zoom: 5.5,
          minZoom: 4,
          maxZoom: 12,
        });

        map.current.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
          }),
          'top-right'
        );

        map.current.on('load', () => {
          // Add markers for each mairie
          mairiesGabon.forEach((mairie) => {
            const province = provinces.find(p => p.name === mairie.province);
            const color = province?.color || '#009e49';
            
            // Create marker element
            const el = document.createElement('div');
            el.className = 'mairie-marker';
            el.style.width = mairie.isCapitalProvince ? '20px' : '12px';
            el.style.height = mairie.isCapitalProvince ? '20px' : '12px';
            el.style.backgroundColor = color;
            el.style.borderRadius = '50%';
            el.style.border = mairie.isCapitalProvince ? '3px solid white' : '2px solid white';
            el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            el.style.cursor = 'pointer';
            el.style.transition = 'transform 0.2s ease';
            
            el.addEventListener('mouseenter', () => {
              el.style.transform = 'scale(1.3)';
              setHoveredProvince(mairie.province);
            });
            
            el.addEventListener('mouseleave', () => {
              el.style.transform = 'scale(1)';
              setHoveredProvince(null);
            });

            // Create popup
            const popup = new mapboxgl.Popup({
              offset: 25,
              closeButton: false,
              className: 'mairie-popup'
            }).setHTML(`
              <div style="padding: 8px; min-width: 180px;">
                <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${mairie.name}</div>
                <div style="color: #666; font-size: 12px;">${mairie.province}</div>
                ${mairie.population ? `<div style="color: #888; font-size: 11px; margin-top: 4px;">${mairie.population.toLocaleString()} habitants</div>` : ''}
                ${mairie.isCapitalProvince ? `<div style="color: ${color}; font-size: 11px; font-weight: 500; margin-top: 4px;">🏛️ Chef-lieu de province</div>` : ''}
              </div>
            `);

            const marker = new mapboxgl.Marker(el)
              .setLngLat(mairie.coordinates)
              .setPopup(popup)
              .addTo(map.current!);

            el.addEventListener('click', () => {
              setSelectedMairie({
                name: mairie.name,
                province: mairie.province,
                departement: mairie.departement,
                population: mairie.population,
                isCapitalProvince: mairie.isCapitalProvince
              });
            });
          });

          setLoading(false);
        });

      } catch (err) {
        console.error('Map error:', err);
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      map.current?.remove();
    };
  }, []);

  const provinceCounts = provinces.map(p => ({
    ...p,
    count: mairiesGabon.filter(m => m.province === p.name).length
  }));

  if (error) {
    return (
      <Card className="w-full h-[500px] flex items-center justify-center">
        <CardContent className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative w-full">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3 relative">
          <div 
            ref={mapContainer} 
            className="w-full h-[500px] rounded-2xl shadow-xl overflow-hidden"
          />
          
          {loading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
                <p className="text-muted-foreground">Chargement de la carte...</p>
              </div>
            </div>
          )}

          {/* Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-[200px]">
            <p className="text-xs font-medium mb-2">Légende</p>
            <div className="flex items-center gap-2 text-xs mb-1">
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow" />
              <span>Chef-lieu province</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-muted-foreground border border-white shadow" />
              <span>Commune</span>
            </div>
          </div>
        </div>

        {/* Province List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Provinces
          </h3>
          
          {provinceCounts.map((province) => (
            <div
              key={province.name}
              className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                hoveredProvince === province.name 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border hover:border-primary/50'
              }`}
              onMouseEnter={() => setHoveredProvince(province.name)}
              onMouseLeave={() => setHoveredProvince(null)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: province.color }}
                  />
                  <span className="font-medium text-sm">{province.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {province.count}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 pl-5">
                {province.capital}
              </p>
            </div>
          ))}

          <div className="pt-4 border-t mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Communes</span>
              <Badge className="bg-primary">{mairiesGabon.length}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Mairie Card */}
      {selectedMairie && (
        <Card className="mt-6 border-primary/30 animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {selectedMairie.name}
              </CardTitle>
              {selectedMairie.isCapitalProvince && (
                <Badge className="bg-primary">Chef-lieu</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Province</p>
                <p className="font-medium">{selectedMairie.province}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Département</p>
                <p className="font-medium">{selectedMairie.departement}</p>
              </div>
              {selectedMairie.population && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Population
                  </p>
                  <p className="font-medium">{selectedMairie.population.toLocaleString()} hab.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GabonMairiesMap;
