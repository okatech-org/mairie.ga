import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, MapPin, Users, Phone, Mail, Filter, Search, X } from 'lucide-react';
import { organizationService, Organization } from '@/services/organizationService';
import { Skeleton } from '@/components/ui/skeleton';

export const MairiesLogosSection = () => {
  const [mairies, setMairies] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMairies = async () => {
      try {
        const data = await organizationService.getAll();
        setMairies(data);
      } catch (error) {
        console.error('Error fetching mairies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMairies();
  }, []);

  const provinces = useMemo(() => {
    const uniqueProvinces = [...new Set(mairies.map(m => m.province).filter(Boolean))];
    return uniqueProvinces.sort();
  }, [mairies]);

  const filteredMairies = useMemo(() => {
    let result = mairies;
    
    if (selectedProvince) {
      result = result.filter(m => m.province === selectedProvince);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.city?.toLowerCase().includes(query) ||
        m.province?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [mairies, selectedProvince, searchQuery]);

  const clearFilters = () => {
    setSelectedProvince(null);
    setSearchQuery('');
  };

  const handleMairieClick = (mairie: Organization) => {
    navigate(`/entity/${mairie.id}`);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Building2 className="h-3 w-3 mr-1" />
              Nos Mairies
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Les Communes <span className="text-primary">Connectées</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6 flex flex-col items-center">
                  <Skeleton className="w-20 h-20 rounded-full mb-4" />
                  <Skeleton className="h-4 w-28 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">
            <Building2 className="h-3 w-3 mr-1" />
            Nos Mairies
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Les Communes <span className="text-primary">Connectées</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Découvrez les mairies du réseau MAIRIE.GA et accédez à leurs services en ligne
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une mairie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Province Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant={selectedProvince === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedProvince(null)}
              className="gap-1"
            >
              <Filter className="h-3 w-3" />
              Toutes ({mairies.length})
            </Button>
            {provinces.map((province) => {
              const count = mairies.filter(m => m.province === province).length;
              return (
                <Button
                  key={province}
                  variant={selectedProvince === province ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedProvince(province)}
                >
                  {province} ({count})
                </Button>
              );
            })}
          </div>

          {/* Active Filters Summary */}
          {(selectedProvince || searchQuery) && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>{filteredMairies.length} résultat{filteredMairies.length > 1 ? 's' : ''}</span>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto py-1 px-2">
                <X className="h-3 w-3 mr-1" />
                Effacer les filtres
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {filteredMairies.map((mairie, index) => (
            <motion.div
              key={mairie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              layout
            >
              <Card 
                className="group h-full overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/30 cursor-pointer"
                onClick={() => handleMairieClick(mairie)}
              >
                <CardContent className="p-4 md:p-6 flex flex-col items-center text-center">
                  {/* Logo */}
                  <div className="relative w-16 h-16 md:w-20 md:h-20 mb-4 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 p-1 transition-transform group-hover:scale-110">
                    {mairie.logo_url ? (
                      <img 
                        src={mairie.logo_url} 
                        alt={`Logo ${mairie.name}`}
                        className="w-full h-full object-contain rounded-full bg-white"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Nom */}
                  <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {mairie.name}
                  </h3>

                  {/* Province */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3" />
                    <span>{mairie.province}</span>
                  </div>

                  {/* Population */}
                  {mairie.population && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{mairie.population.toLocaleString()} hab.</span>
                    </div>
                  )}

                  {/* Contact info on hover (desktop only) */}
                  <div className="hidden md:flex flex-col gap-1 mt-3 pt-3 border-t w-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {mairie.contact_phone && (
                      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                        <Phone className="h-2.5 w-2.5" />
                        <span className="truncate">{mairie.contact_phone}</span>
                      </div>
                    )}
                    {mairie.contact_email && (
                      <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                        <Mail className="h-2.5 w-2.5" />
                        <span className="truncate">{mairie.contact_email}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stats Footer */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 md:gap-12">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-primary">{mairies.length}</p>
            <p className="text-sm text-muted-foreground">Mairies connectées</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-primary">{provinces.length}</p>
            <p className="text-sm text-muted-foreground">Provinces</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-primary">
              {mairies.reduce((sum, m) => sum + (m.population || 0), 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Habitants desservis</p>
          </div>
        </div>
      </div>
    </section>
  );
};