import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, MapPin, Users, Phone, Mail, Filter, Search, X, ArrowUpDown, Map, Grid3X3, List, Globe, ExternalLink, FileDown, FileSpreadsheet } from 'lucide-react';
import { organizationService, Organization } from '@/services/organizationService';
import { Skeleton } from '@/components/ui/skeleton';
import GabonMairiesMap from '@/components/home/GabonMairiesMap';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { exportMairiesToPDF, exportMairiesToExcel } from '@/utils/export-mairies';
import { toast } from 'sonner';

type SortOption = 'name' | 'population' | 'province';
type ViewMode = 'grid' | 'list' | 'map';

export const MairiesLogosSection = () => {
  const [mairies, setMairies] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
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

  const filteredAndSortedMairies = useMemo(() => {
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

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'population':
          return (b.population || 0) - (a.population || 0);
        case 'province':
          return (a.province || '').localeCompare(b.province || '');
        default:
          return 0;
      }
    });

    return result;
  }, [mairies, selectedProvince, searchQuery, sortBy]);

  const clearFilters = () => {
    setSelectedProvince(null);
    setSearchQuery('');
  };

  const handleExportPDF = () => {
    try {
      const dataToExport = filteredAndSortedMairies.length > 0 ? filteredAndSortedMairies : mairies;
      const title = selectedProvince
        ? `Mairies de la province ${selectedProvince}`
        : 'Liste des Mairies du Gabon';
      exportMairiesToPDF(dataToExport, title);
      toast.success('Export PDF généré avec succès');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  const handleExportExcel = () => {
    try {
      const dataToExport = filteredAndSortedMairies.length > 0 ? filteredAndSortedMairies : mairies;
      exportMairiesToExcel(dataToExport);
      toast.success('Export Excel (CSV) généré avec succès');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Erreur lors de l\'export Excel');
    }
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

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {filteredAndSortedMairies.map((mairie, index) => (
        <motion.div
          key={mairie.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03, duration: 0.3 }}
          layout
        >
          <Card
            className="group h-full overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/30 cursor-pointer"
            onClick={() => handleMairieClick(mairie)}
          >
            <CardContent className="p-4 md:p-6 flex flex-col items-center text-center">
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
              <h3 className="font-semibold text-sm md:text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                {mairie.name}
              </h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <MapPin className="h-3 w-3" />
                <span>{mairie.province}</span>
              </div>
              {mairie.population && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{mairie.population.toLocaleString()} hab.</span>
                </div>
              )}
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
  );

  const renderListView = () => (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[80px]">Logo</TableHead>
              <TableHead>Mairie</TableHead>
              <TableHead>Province / Département</TableHead>
              <TableHead className="text-right">Population</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Maire</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedMairies.map((mairie, index) => (
              <motion.tr
                key={mairie.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
                className="group hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleMairieClick(mairie)}
              >
                <TableCell>
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20 p-0.5">
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
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-semibold group-hover:text-primary transition-colors">{mairie.name}</p>
                    {mairie.address && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {mairie.address}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <Badge variant="secondary" className="mb-1">{mairie.province}</Badge>
                    {mairie.departement && (
                      <p className="text-xs text-muted-foreground">{mairie.departement}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {mairie.population ? (
                    <div className="flex items-center justify-end gap-1">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{mairie.population.toLocaleString()}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {mairie.contact_phone && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{mairie.contact_phone}</span>
                      </div>
                    )}
                    {mairie.contact_email && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[180px]">{mairie.contact_email}</span>
                      </div>
                    )}
                    {mairie.website && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <a
                          href={mairie.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Site web
                        </a>
                      </div>
                    )}
                    {!mairie.contact_phone && !mairie.contact_email && (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {mairie.maire_name ? (
                    <p className="text-sm">{mairie.maire_name}</p>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMairieClick(mairie);
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Voir
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        {/* Enhanced Header with Province Stats */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4">
            <MapPin className="h-3 w-3 mr-1" />
            Couverture Nationale
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            9 Provinces, <span className="text-primary">{mairies.length} Communes</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Explorez le réseau municipal unifié couvrant l'ensemble du territoire gabonais.
            Cliquez sur une mairie pour accéder à ses services.
          </p>

          {/* Quick Province Stats */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {provinces.slice(0, 5).map((province) => {
              const count = mairies.filter(m => m.province === province).length;
              return (
                <Badge
                  key={province}
                  variant={selectedProvince === province ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => setSelectedProvince(selectedProvince === province ? null : province)}
                >
                  {province} ({count})
                </Badge>
              );
            })}
            {provinces.length > 5 && (
              <Badge variant="outline" className="cursor-default">
                +{provinces.length - 5} autres
              </Badge>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg border bg-muted p-1">
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="gap-2"
            >
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Carte</span>
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="gap-2"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Grille</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Liste</span>
            </Button>
          </div>

          {/* Export Buttons */}
          <div className="inline-flex rounded-lg border bg-muted p-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportPDF}
              className="gap-2"
              title="Exporter en PDF"
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportExcel}
              className="gap-2"
              title="Exporter en Excel (CSV)"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {viewMode === 'map' ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GabonMairiesMap />
            </motion.div>
          ) : (
            <motion.div
              key="grid-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Search, Filter and Sort Section */}
              <div className="mb-8 space-y-4">
                {/* Search Bar and Sort */}
                <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                  <div className="flex-1 relative">
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

                  {/* Sort Dropdown */}
                  <div className="flex gap-2">
                    <Button
                      variant={sortBy === 'name' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy('name')}
                      className="gap-1"
                    >
                      <ArrowUpDown className="h-3 w-3" />
                      A-Z
                    </Button>
                    <Button
                      variant={sortBy === 'population' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy('population')}
                      className="gap-1"
                    >
                      <Users className="h-3 w-3" />
                      Population
                    </Button>
                    <Button
                      variant={sortBy === 'province' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy('province')}
                      className="gap-1"
                    >
                      <MapPin className="h-3 w-3" />
                      Province
                    </Button>
                  </div>
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
                    <span>{filteredAndSortedMairies.length} résultat{filteredAndSortedMairies.length > 1 ? 's' : ''}</span>
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto py-1 px-2">
                      <X className="h-3 w-3 mr-1" />
                      Effacer les filtres
                    </Button>
                  </div>
                )}
              </div>

              {viewMode === 'grid' ? renderGridView() : renderListView()}
            </motion.div>
          )}
        </AnimatePresence>

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