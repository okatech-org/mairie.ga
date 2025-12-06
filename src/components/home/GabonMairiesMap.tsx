import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { mairiesGabon, provinces, MairieGabon } from '@/data/mock-mairies-gabon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, Building2, Users, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SelectedMairie {
  name: string;
  province: string;
  departement: string;
  population?: number;
  isCapitalProvince?: boolean;
  coordinates: [number, number];
}

const GabonMairiesMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMairie, setSelectedMairie] = useState<SelectedMairie | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Filter mairies based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return mairiesGabon.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.province.toLowerCase().includes(query) ||
      m.departement.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [searchQuery]);

  // Handle selecting a mairie from search
  const handleSelectMairie = (mairie: MairieGabon) => {
    setSelectedMairie({
      name: mairie.name,
      province: mairie.province,
      departement: mairie.departement,
      population: mairie.population,
      isCapitalProvince: mairie.isCapitalProvince,
      coordinates: mairie.coordinates
    });
    setSearchQuery('');
    setIsSearchFocused(false);

    // Fly to the selected mairie
    if (map.current) {
      map.current.flyTo({
        center: mairie.coordinates,
        zoom: 10,
        duration: 1500
      });

      // Open the popup for the selected marker
      const marker = markersRef.current.get(mairie.id);
      if (marker) {
        marker.togglePopup();
      }
    }
  };

  // Handle clicking on a province to filter
  const handleProvinceClick = (provinceName: string) => {
    const provinceCapital = mairiesGabon.find(m => m.province === provinceName && m.isCapitalProvince);
    if (provinceCapital && map.current) {
      map.current.flyTo({
        center: provinceCapital.coordinates,
        zoom: 8,
        duration: 1500
      });
    }
  };

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

            // Store marker reference
            markersRef.current.set(mairie.id, marker);

            el.addEventListener('click', () => {
              setSelectedMairie({
                name: mairie.name,
                province: mairie.province,
                departement: mairie.departement,
                population: mairie.population,
                isCapitalProvince: mairie.isCapitalProvince,
                coordinates: mairie.coordinates
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
      {/* Search Bar */}
      <div className="mb-6 relative max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher une mairie, province..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
            {searchResults.map((mairie) => {
              const province = provinces.find(p => p.name === mairie.province);
              return (
                <button
                  key={mairie.id}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-0"
                  onClick={() => handleSelectMairie(mairie)}
                >
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: province?.color || '#009e49' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{mairie.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {mairie.province} • {mairie.departement}
                    </p>
                  </div>
                  {mairie.isCapitalProvince && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">Chef-lieu</Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {isSearchFocused && searchQuery && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 p-4 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucune mairie trouvée</p>
          </div>
        )}
      </div>

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
              onClick={() => handleProvinceClick(province.name)}
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
