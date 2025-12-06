import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MOCK_ORGANIZATIONS } from '@/data/mock-organizations';
import { MOCK_COMPANIES } from '@/data/mock-companies';
import { MOCK_ASSOCIATIONS } from '@/data/mock-associations';
import { Building2, Globe, Users, Filter, AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MAPBOX_CONFIG } from '@/config/mapbox';

// Coordonnées précises des villes (format: [longitude, latitude])
const CITY_COORDINATES: Record<string, [number, number]> = {
  // Europe
  'Paris': [2.3522, 48.8566],
  'Berlin': [13.4050, 52.5200],
  'Bruxelles': [4.3517, 50.8503],
  'Madrid': [-3.7038, 40.4168],
  'Lisbonne': [-9.1393, 38.7223],
  'Rome': [12.4964, 41.9028],
  'Londres': [-0.1278, 51.5074],
  'Genève': [6.1432, 46.2044],
  'Monaco': [7.4246, 43.7384],
  'Moscou': [37.6173, 55.7558],
  
  // Afrique
  'Libreville': [9.4673, 0.4162],
  'Pretoria': [28.2293, -25.7479],
  'Alger': [3.0588, 36.7538],
  'Luanda': [13.2343, -8.8383],
  'Cotonou': [2.3158, 6.3703],
  'Yaoundé': [11.5174, 3.8480],
  'Brazzaville': [15.2832, -4.2634],
  'Abidjan': [-4.0083, 5.3599],
  'Le Caire': [31.2357, 30.0444],
  'Addis-Abeba': [38.7469, 9.0320],
  'Accra': [-0.1870, 5.6037],
  'Malabo': [8.7832, 3.7504],
  'Bata': [9.7670, 1.8637],
  'Bamako': [-8.0000, 12.6392],
  'Rabat': [-6.8498, 34.0209],
  'Laâyoune': [-13.2023, 27.1251],
  'Abuja': [7.5248, 9.0765],
  'Kinshasa': [15.3222, -4.4419],
  'Kigali': [30.0619, -1.9403],
  'São Tomé': [6.7273, 0.3365],
  'Dakar': [-17.4677, 14.7167],
  'Lomé': [1.2123, 6.1256],
  'Tunis': [10.1815, 36.8065],
  
  // Amériques
  'Washington': [-77.0369, 38.9072],
  'New York': [-74.0060, 40.7128],
  'Ottawa': [-75.6972, 45.4215],
  'Brasília': [-47.9292, -15.8267],
  'Buenos Aires': [-58.3816, -34.6037],
  'Mexico': [-99.1332, 19.4326],
  
  // Asie
  'Pékin': [116.4074, 39.9042],
  'Tokyo': [139.6917, 35.6762],
  'New Delhi': [77.2090, 28.6139],
  'Riyad': [46.6753, 24.7136],
  'Ankara': [32.8597, 39.9334],
  'Téhéran': [51.3890, 35.6892],
  'Doha': [51.5310, 25.2854],
  'Abou Dhabi': [54.3773, 24.4539],
  
  // Villes françaises
  'Lyon': [4.8357, 45.7640],
  'Bordeaux': [-0.5792, 44.8378],
  'Marseille': [5.3698, 43.2965],
};

interface MapMarker {
  id: string;
  name: string;
  coordinates: [number, number];
  type: 'organization' | 'company' | 'association';
  city: string;
  country: string;
}

export function InteractiveWorldMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // États des filtres
  const [filters, setFilters] = useState({
    organizations: true,
    companies: true,
    associations: true
  });

  const toggleFilter = (type: 'organizations' | 'companies' | 'associations') => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Préparer les markers (une seule fois)
  useEffect(() => {
    const allMarkers: MapMarker[] = [];

    // Organisations diplomatiques
    MOCK_ORGANIZATIONS.forEach(org => {
      const city = org.metadata?.city || org.city || '';
      const coordinates = CITY_COORDINATES[city];
      if (coordinates) {
        allMarkers.push({
          id: org.id,
          name: org.name,
          coordinates,
          type: 'organization',
          city,
          country: org.metadata?.country || org.country || ''
        });
      }
    });

    // Entreprises
    MOCK_COMPANIES.forEach(company => {
      const city = company.address.city || '';
      const coordinates = CITY_COORDINATES[city];
      if (coordinates) {
        allMarkers.push({
          id: company.id,
          name: company.name,
          coordinates,
          type: 'company',
          city,
          country: company.address.country || ''
        });
      }
    });

    // Associations
    MOCK_ASSOCIATIONS.forEach(association => {
      const city = association.address.city || '';
      const coordinates = CITY_COORDINATES[city];
      if (coordinates) {
        allMarkers.push({
          id: association.id,
          name: association.name,
          coordinates,
          type: 'association',
          city,
          country: association.address.country || ''
        });
      }
    });

    setMarkers(allMarkers);
  }, []);

  // Initialisation de la carte (une seule fois)
  useEffect(() => {
    if (!mapContainer.current) {
      console.log('Map container not ready');
      return;
    }
    
    if (map.current) {
      console.log('Map already initialized');
      return;
    }

    // Vérifier le token Mapbox
    const mapboxToken = MAPBOX_CONFIG.accessToken;
    console.log('Mapbox token check:', mapboxToken ? 'Token present' : 'Token missing');
    
    if (!mapboxToken || mapboxToken === 'VOTRE_TOKEN_MAPBOX_PUBLIC_ICI') {
      setMapError('Token Mapbox non configuré. Veuillez ajouter votre token public Mapbox dans src/config/mapbox.ts');
      console.error('Mapbox token not configured');
      return;
    }

    try {
      console.log('Initializing Mapbox map...');
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: MAPBOX_CONFIG.defaultCenter,
        zoom: MAPBOX_CONFIG.defaultZoom,
        pitch: 60,
        bearing: 0,
        projection: 'globe' as any,
        antialias: true
      });

      console.log('Mapbox map created successfully');

      // Ajouter les contrôles de navigation
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Événement de chargement réussi
      map.current.on('load', () => {
        console.log('Mapbox map loaded successfully');
        
        // Ajouter les bâtiments 3D
        const layers = map.current?.getStyle().layers;
        if (layers) {
          const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout && 'text-field' in layer.layout
          )?.id;

          if (labelLayerId && map.current) {
            map.current.addLayer(
              {
                'id': '3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 15,
                'paint': {
                  'fill-extrusion-color': '#aaa',
                  'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'height']
                  ],
                  'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    15,
                    0,
                    15.05,
                    ['get', 'min_height']
                  ],
                  'fill-extrusion-opacity': 0.6
                }
              },
              labelLayerId
            );
          }
        }
      });

      // Gérer les erreurs de chargement
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Erreur lors du chargement de la carte. Vérifiez votre token Mapbox.');
      });
    } catch (error) {
      console.error('Error initializing Mapbox:', error);
      setMapError('Erreur lors de l\'initialisation: ' + (error as Error).message);
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Gestion des marqueurs (s'exécute quand la carte est prête ou les filtres changent)
  useEffect(() => {
    if (!map.current) {
      console.log('Map not ready for markers');
      return;
    }

    console.log('Updating markers, total:', markers.length);

    // Nettoyer les anciens marqueurs
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Ajouter les marqueurs filtrés
    markers.forEach(marker => {
      // Vérifier si le type de marqueur est activé dans les filtres
      const shouldShow = 
        (marker.type === 'organization' && filters.organizations) ||
        (marker.type === 'company' && filters.companies) ||
        (marker.type === 'association' && filters.associations);

      if (!shouldShow) return;

      // Créer un élément HTML pour le marqueur
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.cursor = 'pointer';
      
      // Couleur selon le type
      let bgColor = '';
      let icon = '';
      switch (marker.type) {
        case 'organization':
          bgColor = 'hsl(var(--primary))';
          icon = '🏛️';
          break;
        case 'company':
          bgColor = 'hsl(var(--secondary))';
          icon = '🏢';
          break;
        case 'association':
          bgColor = 'hsl(var(--accent))';
          icon = '👥';
          break;
      }

      el.style.backgroundColor = bgColor;
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '18px';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      el.style.border = '2px solid white';
      el.textContent = icon;

      // Créer le popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; font-family: Inter, sans-serif;">
          <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: hsl(var(--foreground));">${marker.name}</h3>
          <p style="margin: 0; font-size: 12px; color: hsl(var(--muted-foreground));">${marker.city}, ${marker.country}</p>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: hsl(var(--${marker.type === 'organization' ? 'primary' : marker.type === 'company' ? 'secondary' : 'accent'}));">
            ${marker.type === 'organization' ? '🏛️ Organisation' : marker.type === 'company' ? '🏢 Entreprise' : '👥 Association'}
          </p>
        </div>
      `);

      // Ajouter le marqueur à la carte
      const mapboxMarker = new mapboxgl.Marker(el)
        .setLngLat(marker.coordinates)
        .setPopup(popup)
        .addTo(map.current as mapboxgl.Map);

      markersRef.current.push(mapboxMarker);
    });

    // Cleanup des marqueurs seulement
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [markers, filters]);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
      {mapError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 p-8">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de chargement</AlertTitle>
            <AlertDescription>{mapError}</AlertDescription>
          </Alert>
        </div>
      ) : (
        <div ref={mapContainer} className="absolute inset-0" />
      )}
      
      {/* Filtres interactifs */}
      <div className="absolute top-4 right-4 bg-card backdrop-blur-sm p-4 rounded-lg shadow-lg border border-border z-10">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-foreground" />
          <h4 className="text-sm font-semibold text-foreground">Filtres</h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="filter-orgs" className="flex items-center gap-2 cursor-pointer text-xs">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'hsl(var(--primary))' }}>
                🏛️
              </div>
              <span className="text-foreground">Organisations</span>
            </Label>
            <Switch
              id="filter-orgs"
              checked={filters.organizations}
              onCheckedChange={() => toggleFilter('organizations')}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="filter-companies" className="flex items-center gap-2 cursor-pointer text-xs">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'hsl(var(--secondary))' }}>
                🏢
              </div>
              <span className="text-foreground">Entreprises</span>
            </Label>
            <Switch
              id="filter-companies"
              checked={filters.companies}
              onCheckedChange={() => toggleFilter('companies')}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="filter-associations" className="flex items-center gap-2 cursor-pointer text-xs">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'hsl(var(--accent))' }}>
                👥
              </div>
              <span className="text-foreground">Associations</span>
            </Label>
            <Switch
              id="filter-associations"
              checked={filters.associations}
              onCheckedChange={() => toggleFilter('associations')}
            />
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="absolute top-4 left-4 bg-card backdrop-blur-sm p-4 rounded-lg shadow-lg border border-border z-10">
        <h4 className="text-sm font-semibold mb-3 text-foreground">Réseau mondial</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <span className="text-xs text-foreground">
              <strong>{markers.filter(m => m.type === 'organization' && filters.organizations).length}</strong> missions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-secondary" />
            <span className="text-xs text-foreground">
              <strong>{markers.filter(m => m.type === 'company' && filters.companies).length}</strong> entreprises
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-xs text-foreground">
              <strong>{markers.filter(m => m.type === 'association' && filters.associations).length}</strong> associations
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
