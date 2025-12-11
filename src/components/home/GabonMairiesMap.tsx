import React, { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { invokeWithDemoFallback } from '@/utils/demoMode';
import { provinces } from '@/data/mock-mairies-gabon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin, Building2, Users, Search, X, ExternalLink, Briefcase, Navigation, LocateFixed, Filter, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { organizationService, Organization } from '@/services/organizationService';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SelectedMairie {
  id: string;
  name: string;
  province: string;
  departement: string;
  population?: number;
  isCapitalProvince?: boolean;
  coordinates: [number, number];
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
  organization_id?: string;
}

interface MairieWithDistance extends Organization {
  distance?: number;
}

const GabonMairiesMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: mapboxgl.Marker; province: string }>>(new Map());
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMairie, setSelectedMairie] = useState<SelectedMairie | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeProvinceFilter, setActiveProvinceFilter] = useState<string | null>(null);
  const [mairies, setMairies] = useState<Organization[]>([]);
  const [selectedMairieServices, setSelectedMairieServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [selectedServiceForRdv, setSelectedServiceForRdv] = useState<Service | null>(null);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lon1: number, lat1: number, lon2: number, lat2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Mairies with distance from user
  const mairiesWithDistance = useMemo((): MairieWithDistance[] => {
    if (!userLocation) return mairies;

    return mairies.map(m => ({
      ...m,
      distance: m.latitude && m.longitude
        ? calculateDistance(userLocation[0], userLocation[1], m.longitude, m.latitude)
        : undefined
    })).sort((a, b) => {
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });
  }, [mairies, userLocation]);

  // Nearest mairie
  const nearestMairie = useMemo(() => {
    return mairiesWithDistance.find(m => m.distance !== undefined);
  }, [mairiesWithDistance]);

  // Unique service categories
  const serviceCategories = useMemo(() => {
    const categories = new Set(allServices.map(s => s.category).filter(Boolean));
    return Array.from(categories) as string[];
  }, [allServices]);

  // Mairies filtered by service
  const mairiesWithService = useMemo(() => {
    if (!serviceFilter) return null;
    return allServices
      .filter(s => s.category === serviceFilter)
      .map(s => s.organization_id)
      .filter((id, index, self) => id && self.indexOf(id) === index);
  }, [serviceFilter, allServices]);

  // Fetch mairies from database
  useEffect(() => {
    const fetchMairies = async () => {
      try {
        const data = await organizationService.getAll();
        setMairies(data);
      } catch (err) {
        console.error('Failed to fetch mairies:', err);
      }
    };
    fetchMairies();
  }, []);

  // Fetch all services for filtering
  useEffect(() => {
    const fetchAllServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, name, description, category, price, organization_id')
          .eq('is_active', true)
          .order('category');

        if (error) throw error;
        setAllServices(data || []);
      } catch (err) {
        console.error('Failed to fetch all services:', err);
      }
    };
    fetchAllServices();
  }, []);

  // Fetch services when a mairie is selected
  useEffect(() => {
    const fetchServices = async () => {
      if (!selectedMairie?.id) {
        setSelectedMairieServices([]);
        return;
      }

      setLoadingServices(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, name, description, category, price')
          .eq('organization_id', selectedMairie.id)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setSelectedMairieServices(data || []);
      } catch (err) {
        console.error('Failed to fetch services:', err);
        setSelectedMairieServices([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, [selectedMairie?.id]);

  // Filter mairies based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return mairies.filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.province?.toLowerCase().includes(query) ||
      m.departement?.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [searchQuery, mairies]);

  // Update marker visibility when filter changes (province or service)
  useEffect(() => {
    markersRef.current.forEach(({ marker, province }, mairieId) => {
      const el = marker.getElement();
      const matchesProvince = activeProvinceFilter === null || province === activeProvinceFilter;
      const matchesService = mairiesWithService === null || mairiesWithService.includes(mairieId);

      if (matchesProvince && matchesService) {
        el.style.display = 'block';
        el.style.opacity = '1';
      } else {
        el.style.display = 'none';
        el.style.opacity = '0';
      }
    });
  }, [activeProvinceFilter, mairiesWithService]);

  // Handle selecting a mairie from search
  const handleSelectMairie = (mairie: Organization) => {
    if (!mairie.longitude || !mairie.latitude) return;

    setSelectedMairie({
      id: mairie.id,
      name: mairie.name,
      province: mairie.province || '',
      departement: mairie.departement || '',
      population: mairie.population || undefined,
      isCapitalProvince: false,
      coordinates: [mairie.longitude, mairie.latitude]
    });
    setSearchQuery('');
    setIsSearchFocused(false);
    setActiveProvinceFilter(mairie.province || null);

    // Fly to the selected mairie
    if (map.current) {
      map.current.flyTo({
        center: [mairie.longitude, mairie.latitude],
        zoom: 10,
        duration: 1500
      });

      // Open the popup for the selected marker
      const markerData = markersRef.current.get(mairie.id);
      if (markerData) {
        markerData.marker.togglePopup();
      }
    }
  };

  // Handle clicking on a province to filter
  const handleProvinceClick = (provinceName: string) => {
    // Toggle filter if clicking same province
    if (activeProvinceFilter === provinceName) {
      setActiveProvinceFilter(null);
      if (map.current) {
        map.current.flyTo({
          center: [11.5, -0.8],
          zoom: 5.5,
          duration: 1500
        });
      }
      return;
    }

    setActiveProvinceFilter(provinceName);
    // Find first mairie in province with coordinates
    const provinceMairie = mairies.find(m => m.province === provinceName && m.latitude && m.longitude);
    if (provinceMairie && map.current) {
      map.current.flyTo({
        center: [provinceMairie.longitude!, provinceMairie.latitude!],
        zoom: 8,
        duration: 1500
      });
    }
  };

  // Handle geolocation
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setLocatingUser(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setUserLocation([longitude, latitude]);

        // Add or update user marker
        if (map.current) {
          // Remove existing user marker
          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
          }

          // Create user marker element
          const el = document.createElement('div');
          el.className = 'user-location-marker';
          el.style.width = '20px';
          el.style.height = '20px';
          el.style.backgroundColor = '#3b82f6';
          el.style.borderRadius = '50%';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.5)';
          el.style.animation = 'pulse 2s infinite';

          // Add pulse animation style
          const style = document.createElement('style');
          style.textContent = `
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
              70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); }
              100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
            }
          `;
          document.head.appendChild(style);

          userMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat([longitude, latitude])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<div style="padding: 8px;"><strong>Ma position</strong></div>'))
            .addTo(map.current);

          // Fly to user location
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 10,
            duration: 1500
          });
        }

        setLocatingUser(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let message = 'Impossible de vous localiser';
        if (error.code === 1) message = 'Accès à la localisation refusé';
        if (error.code === 2) message = 'Position non disponible';
        if (error.code === 3) message = 'Délai d\'attente dépassé';
        alert(message);
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Clear filter
  const handleClearFilter = () => {
    setActiveProvinceFilter(null);
    if (map.current) {
      map.current.flyTo({
        center: [11.5, -0.8],
        zoom: 5.5,
        duration: 1500
      });
    }
  };

  // Initialize map only once
  const mapInitializedRef = useRef(false);
  const mairiesDataRef = useRef<Organization[]>([]);

  // Store mairies in ref to avoid re-renders affecting markers
  useEffect(() => {
    mairiesDataRef.current = mairies;
  }, [mairies]);

  // Create a stable handler reference using useRef
  const handleMairieSelect = useRef((mairie: Organization) => {
    if (!mairie.longitude || !mairie.latitude) return;
    setSelectedMairie({
      id: mairie.id,
      name: mairie.name,
      province: mairie.province || '',
      departement: mairie.departement || '',
      population: mairie.population || undefined,
      isCapitalProvince: false,
      coordinates: [mairie.longitude, mairie.latitude]
    });
  });

  // Initialize map ONCE
  useEffect(() => {
    if (mapInitializedRef.current || !mapContainer.current) return;

    const initMap = async () => {
      try {
        interface MapboxTokenResponse {
          token: string | null;
          error?: string;
        }

        const { data, error: fnError, isDemo } = await invokeWithDemoFallback<MapboxTokenResponse>('get-mapbox-token', {});

        if (fnError || !data?.token) {
          if (isDemo) {
            throw new Error('Carte non disponible en mode démonstration');
          }
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
          preserveDrawingBuffer: true, // Prevents visual glitches
        });

        map.current.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
          }),
          'top-right'
        );

        map.current.on('load', () => {
          mapInitializedRef.current = true;
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
      if (map.current) {
        map.current.remove();
        map.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, []); // Empty dependency - only run once

  // Add markers when map is ready AND mairies are loaded
  useEffect(() => {
    if (!map.current || !mapInitializedRef.current || mairies.length === 0) return;

    // Clear existing markers first
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();

    // Add markers for each mairie
    mairies.forEach((mairie) => {
      if (!mairie.latitude || !mairie.longitude) return;
      if (!map.current) return;

      const province = provinces.find(p => p.name === mairie.province);
      const color = province?.color || '#009e49';

      // Create marker element with stable styles
      const el = document.createElement('div');
      el.className = 'mairie-marker';
      Object.assign(el.style, {
        width: '16px',
        height: '16px',
        backgroundColor: color,
        borderRadius: '50%',
        border: '2px solid white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        cursor: 'pointer'
      });

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <div style="padding: 12px; min-width: 220px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="font-weight: 600; font-size: 15px; margin-bottom: 6px; color: #1a1a1a;">${mairie.name}</div>
          <div style="color: #666; font-size: 12px; margin-bottom: 6px;">${mairie.province || ''} ${mairie.departement ? '• ' + mairie.departement : ''}</div>
          ${mairie.population ? `<div style="color: #666; font-size: 11px; margin-bottom: 4px;">👥 ${mairie.population.toLocaleString()} habitants</div>` : ''}
          ${mairie.maire_name ? `<div style="color: #555; font-size: 11px;">👤 Maire: ${mairie.maire_name}</div>` : ''}
          <button 
            class="mairie-popup-btn"
            style="width: 100%; margin-top: 12px; padding: 10px 14px; background: ${color}; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;"
            onmouseover="this.style.opacity='0.9'"
            onmouseout="this.style.opacity='1'"
          >
            Voir les services →
          </button>
        </div>
      `;

      // Attach click handler to button
      const btn = popupContent.querySelector('button');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleMairieSelect.current(mairie);
        });
      }

      const popup = new mapboxgl.Popup({
        offset: [0, -8],
        closeButton: true,
        closeOnClick: true,
        className: 'mairie-popup-container',
        maxWidth: '280px',
        focusAfterOpen: false
      }).setDOMContent(popupContent);

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
        pitchAlignment: 'map',
        rotationAlignment: 'map'
      })
        .setLngLat([mairie.longitude, mairie.latitude])
        .setPopup(popup)
        .addTo(map.current);

      // Store marker reference
      markersRef.current.set(mairie.id, { marker, province: mairie.province || '' });
    });
  }, [mairies, loading]); // Only re-run when mairies change or map finishes loading

  const provinceCounts = provinces.map(p => ({
    ...p,
    count: mairies.filter(m => m.province === p.name).length
  }));

  // Count mairies with GPS coordinates
  const mairiesWithCoords = mairies.filter(m => m.latitude && m.longitude).length;

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
      {/* Search and Service Filter Section */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
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
                const mairieWithDist = mairiesWithDistance.find(m => m.id === mairie.id);
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
                    {mairieWithDist?.distance !== undefined && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {mairieWithDist.distance < 1
                          ? `${Math.round(mairieWithDist.distance * 1000)} m`
                          : `${mairieWithDist.distance.toFixed(1)} km`}
                      </Badge>
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

        {/* Service Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={serviceFilter || 'all'} onValueChange={(val) => setServiceFilter(val === 'all' ? null : val)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les services</SelectItem>
              {serviceCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {serviceFilter && (
            <Button variant="ghost" size="icon" onClick={() => setServiceFilter(null)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Nearest Mairie Alert */}
      {userLocation && nearestMairie && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <Navigation className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Mairie la plus proche</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {nearestMairie.name} — {nearestMairie.distance?.toFixed(1)} km
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSelectMairie(nearestMairie)}
            className="gap-1 border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            Voir <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      )}

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

          {/* Geolocation Button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm shadow-lg hover:bg-card"
            onClick={handleGeolocate}
            disabled={locatingUser}
            title="Me localiser"
          >
            {locatingUser ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
          </Button>

          {/* Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-[200px]">
            <p className="text-xs font-medium mb-2">Légende</p>
            <div className="flex items-center gap-2 text-xs mb-1">
              <div className="w-4 h-4 rounded-full bg-primary border-2 border-white shadow" />
              <span>Chef-lieu province</span>
            </div>
            <div className="flex items-center gap-2 text-xs mb-1">
              <div className="w-3 h-3 rounded-full bg-muted-foreground border border-white shadow" />
              <span>Commune</span>
            </div>
            {userLocation && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow" />
                <span>Ma position</span>
              </div>
            )}
          </div>
        </div>

        {/* Province List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Provinces
            </h3>
            {activeProvinceFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilter}
                className="text-xs h-7 gap-1"
              >
                <X className="h-3 w-3" />
                Effacer filtre
              </Button>
            )}
          </div>

          {activeProvinceFilter && (
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30 mb-3 animate-fade-in">
              <p className="text-xs text-center text-primary font-medium">
                Filtre actif: {activeProvinceFilter}
              </p>
            </div>
          )}

          {/* Estuaire - Full width */}
          {provinceCounts.filter(p => p.name === "Estuaire").map((province) => (
            <div
              key={province.name}
              className={`p-2 rounded-md border transition-all cursor-pointer hover:shadow-sm ${activeProvinceFilter === province.name
                ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
                : hoveredProvince === province.name
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
                }`}
              onMouseEnter={() => setHoveredProvince(province.name)}
              onMouseLeave={() => setHoveredProvince(null)}
              onClick={() => handleProvinceClick(province.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: province.color }}
                  />
                  <span className="font-medium text-xs">{province.name}</span>
                </div>
                <Badge
                  variant={activeProvinceFilter === province.name ? "default" : "secondary"}
                  className="text-[10px] px-1.5 h-4"
                >
                  {province.count}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 pl-3.5">
                {province.capital}
              </p>
            </div>
          ))}

          {/* Other provinces - 2 per row */}
          <div className="grid grid-cols-2 gap-1.5">
            {provinceCounts.filter(p => p.name !== "Estuaire").map((province) => (
              <div
                key={province.name}
                className={`p-1.5 rounded-md border transition-all cursor-pointer hover:shadow-sm ${activeProvinceFilter === province.name
                  ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
                  : hoveredProvince === province.name
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                  }`}
                onMouseEnter={() => setHoveredProvince(province.name)}
                onMouseLeave={() => setHoveredProvince(null)}
                onClick={() => handleProvinceClick(province.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: province.color }}
                    />
                    <span className="font-medium text-[10px] truncate">{province.name}</span>
                  </div>
                  <Badge
                    variant={activeProvinceFilter === province.name ? "default" : "secondary"}
                    className="text-[9px] px-1 h-4 ml-1"
                  >
                    {province.count}
                  </Badge>
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5 pl-3 truncate">
                  {province.capital}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Communes</span>
              <Badge className="bg-primary">{mairies.length}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Avec coordonnées GPS</span>
              <Badge variant="secondary">{mairiesWithCoords}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Mairie Card with Services */}
      {selectedMairie && (
        <Card className="mt-6 border-primary/30 animate-fade-in">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {selectedMairie.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                {userLocation && (
                  <Badge variant="outline" className="text-xs">
                    <Navigation className="h-3 w-3 mr-1" />
                    {(() => {
                      const dist = calculateDistance(
                        userLocation[0], userLocation[1],
                        selectedMairie.coordinates[0], selectedMairie.coordinates[1]
                      );
                      return dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
                    })()}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/entity/${selectedMairie.id}`)}
                  className="gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Voir la fiche
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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

            {/* Services Section with RDV Button */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm">Services disponibles</h4>
                </div>
              </div>

              {loadingServices ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des services...
                </div>
              ) : selectedMairieServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedMairieServices.slice(0, 6).map((service) => (
                    <div
                      key={service.id}
                      className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group flex items-center justify-between"
                    >
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/entity/${selectedMairie.id}?service=${service.id}`)}
                      >
                        <p className="font-medium text-xs line-clamp-1">{service.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {service.category && (
                            <Badge variant="secondary" className="text-[10px]">
                              {service.category}
                            </Badge>
                          )}
                          {service.price && (
                            <span className="text-[10px] text-muted-foreground">
                              {service.price.toLocaleString()} FCFA
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedServiceForRdv(service);
                          setShowAppointmentDialog(true);
                        }}
                        title="Prendre rendez-vous"
                      >
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun service disponible pour cette mairie
                </p>
              )}

              {selectedMairieServices.length > 6 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate(`/entity/${selectedMairie.id}`)}
                  className="mt-2 p-0 h-auto"
                >
                  Voir tous les {selectedMairieServices.length} services →
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Dialog */}
      <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Prendre rendez-vous
            </DialogTitle>
            <DialogDescription>
              Vous souhaitez prendre rendez-vous pour le service suivant :
            </DialogDescription>
          </DialogHeader>

          {selectedServiceForRdv && selectedMairie && (
            <div className="space-y-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <p className="font-medium">{selectedServiceForRdv.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedMairie.name}</p>
                  {selectedServiceForRdv.price && (
                    <p className="text-sm text-primary mt-2">
                      Tarif : {selectedServiceForRdv.price.toLocaleString()} FCFA
                    </p>
                  )}
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground">
                Pour finaliser votre rendez-vous, vous allez être redirigé vers la page de la mairie où vous pourrez choisir une date et un créneau horaire.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAppointmentDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                if (selectedMairie && selectedServiceForRdv) {
                  navigate(`/rendez-vous?organization=${selectedMairie.id}&service=${selectedServiceForRdv.id}`);
                }
                setShowAppointmentDialog(false);
              }}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Continuer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GabonMairiesMap;
