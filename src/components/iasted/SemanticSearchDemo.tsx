import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Loader2, Sparkles, FileText, Tag, Eye, ThumbsUp, Zap, Brain, TrendingUp, Filter, X, ChevronRight, Clock, CheckCircle, Share2, Link2, Mail, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { knowledgeBaseService, KBArticle } from '@/services/knowledge-base-service';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface SearchResult extends KBArticle {
  similarity?: number;
  keywordMatches?: string[];
}

interface CategoryInfo {
  name: string;
  count: number;
}

const SemanticSearchDemo = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'semantic' | 'text' | 'error' | null>(null);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  
  // Filters and suggestions
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [popularArticles, setPopularArticles] = useState<KBArticle[]>([]);
  const [popularTerms, setPopularTerms] = useState<string[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Article detail modal
  const [selectedArticle, setSelectedArticle] = useState<SearchResult | null>(null);
  const [markingHelpful, setMarkingHelpful] = useState(false);
  const [markedHelpful, setMarkedHelpful] = useState<Set<string>>(new Set());

  // Autocomplete
  const [suggestions, setSuggestions] = useState<KBArticle[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sharing
  const [linkCopied, setLinkCopied] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingInitial(true);
      try {
        const [categoriesData, popularData, termsData] = await Promise.all([
          knowledgeBaseService.getCategories(),
          knowledgeBaseService.getPopularArticles(5),
          knowledgeBaseService.getPopularSearchTerms()
        ]);
        setCategories(categoriesData);
        setPopularArticles(popularData);
        setPopularTerms(termsData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoadingInitial(false);
      }
    };
    loadInitialData();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced autocomplete search
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const results = await knowledgeBaseService.search(value);
        setSuggestions(results.slice(0, 5));
        setShowSuggestions(true);
      } catch (error) {
        console.error('Autocomplete error:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setShowSuggestions(false);
    setLoading(true);
    setResults([]);
    setSearchType(null);
    
    const startTime = performance.now();

    try {
      const response = await knowledgeBaseService.semanticSearch(query, { 
        limit: 10,
        category: selectedCategory || undefined
      });
      const endTime = performance.now();
      
      setResults(response.results as SearchResult[]);
      setSearchType(response.searchType);
      setSearchTime(endTime - startTime);
    } catch (error) {
      console.error('Search error:', error);
      setSearchType('error');
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    setShowSuggestions(false);
    setTimeout(() => handleSearch(), 100);
  };

  const handleSuggestionSelect = (article: KBArticle) => {
    setSelectedArticle(article as SearchResult);
    setShowSuggestions(false);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  // Sharing functions
  const getArticleUrl = (articleId: string) => {
    return `${window.location.origin}/recherche-kb?article=${articleId}`;
  };

  const handleCopyLink = async () => {
    if (!selectedArticle) return;
    
    try {
      await navigator.clipboard.writeText(getArticleUrl(selectedArticle.id));
      setLinkCopied(true);
      toast({
        title: "Lien copié !",
        description: "Le lien de l'article a été copié dans le presse-papier.",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive"
      });
    }
  };

  const handleShareByEmail = () => {
    if (!selectedArticle) return;
    
    const subject = encodeURIComponent(`Article: ${selectedArticle.title}`);
    const articleUrl = getArticleUrl(selectedArticle.id);
    const body = encodeURIComponent(
      `Je vous partage cet article de la base de connaissances:\n\n` +
      `${selectedArticle.title}\n\n` +
      `${selectedArticle.content.substring(0, 300)}...\n\n` +
      `Lire l'article complet: ${articleUrl}`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleMarkHelpful = async (articleId: string) => {
    if (markedHelpful.has(articleId)) return;
    
    setMarkingHelpful(true);
    try {
      await knowledgeBaseService.markHelpful(articleId);
      setMarkedHelpful(prev => new Set([...prev, articleId]));
      
      // Update the article in results and selected
      if (selectedArticle && selectedArticle.id === articleId) {
        setSelectedArticle({
          ...selectedArticle,
          helpfulCount: selectedArticle.helpfulCount + 1
        });
      }
      
      toast({
        title: "Merci pour votre retour !",
        description: "Cet article a été marqué comme utile.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer cet article comme utile.",
        variant: "destructive"
      });
    } finally {
      setMarkingHelpful(false);
    }
  };

  const getSearchTypeInfo = () => {
    switch (searchType) {
      case 'semantic':
        return {
          icon: <Brain className="h-4 w-4" />,
          label: 'Recherche sémantique IA',
          color: 'bg-purple-500/10 text-purple-600 border-purple-200',
          description: 'Résultats basés sur la compréhension du sens'
        };
      case 'text':
        return {
          icon: <FileText className="h-4 w-4" />,
          label: 'Recherche textuelle',
          color: 'bg-blue-500/10 text-blue-600 border-blue-200',
          description: 'Résultats basés sur les mots-clés'
        };
      case 'error':
        return {
          icon: <Zap className="h-4 w-4" />,
          label: 'Erreur',
          color: 'bg-red-500/10 text-red-600 border-red-200',
          description: 'Une erreur est survenue'
        };
      default:
        return null;
    }
  };

  const searchTypeInfo = getSearchTypeInfo();
  const hasSearched = searchType !== null;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Main Search Card */}
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Recherche Sémantique iAsted</CardTitle>
              <CardDescription>
                Trouvez rapidement des informations grâce à l'IA
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filtrer par catégorie</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Badge
                    key={cat.name}
                    variant={selectedCategory === cat.name ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all hover:bg-primary/10",
                      selectedCategory === cat.name && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleCategoryClick(cat.name)}
                  >
                    {cat.name}
                    <span className="ml-1 text-xs opacity-70">({cat.count})</span>
                    {selectedCategory === cat.name && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Input with Autocomplete */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Posez une question ou décrivez ce que vous cherchez..."
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="pl-10"
                />
                {loadingSuggestions && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={loading || !query.trim()}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                Rechercher
              </Button>
            </div>

            {/* Autocomplete Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg overflow-hidden"
              >
                <div className="p-2 text-xs text-muted-foreground border-b">
                  <Clock className="inline h-3 w-3 mr-1" />
                  Suggestions
                </div>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{suggestion.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {suggestion.category} • {suggestion.content.substring(0, 60)}...
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Popular Search Terms */}
          {popularTerms.length > 0 && !hasSearched && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Recherches populaires :</span>
              {popularTerms.slice(0, 6).map((term) => (
                <Button
                  key={term}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuggestionClick(term)}
                  className="h-7 text-xs hover:bg-primary/10"
                >
                  {term}
                </Button>
              ))}
            </div>
          )}

          {/* Search Info */}
          {searchTypeInfo && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("gap-1", searchTypeInfo.color)}>
                  {searchTypeInfo.icon}
                  {searchTypeInfo.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {searchTypeInfo.description}
                </span>
              </div>
              {searchTime !== null && (
                <span className="text-xs text-muted-foreground">
                  {searchTime.toFixed(0)} ms • {results.length} résultat{results.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {results.map((result, index) => (
                  <Card 
                    key={result.id} 
                    className={cn(
                      "transition-all hover:shadow-md cursor-pointer",
                      index === 0 && searchType === 'semantic' && "ring-2 ring-purple-500/20"
                    )}
                    onClick={() => setSelectedArticle(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {index === 0 && searchType === 'semantic' && (
                              <Badge className="bg-purple-500 text-white text-xs">
                                Meilleur résultat
                              </Badge>
                            )}
                            <h4 className="font-medium truncate">{result.title}</h4>
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {result.content.substring(0, 200)}...
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {result.category}
                            </Badge>
                            
                            {result.tags?.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs gap-1">
                                <Tag className="h-3 w-3" />
                                {tag}
                              </Badge>
                            ))}
                            
                            {result.keywordMatches && result.keywordMatches.length > 0 && (
                              <Badge variant="outline" className="text-xs gap-1 bg-green-500/10 text-green-600 border-green-200">
                                <Zap className="h-3 w-3" />
                                {result.keywordMatches.length} mot-clé{result.keywordMatches.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {result.similarity !== undefined && (
                            <div className="text-right">
                              <div className="text-lg font-bold text-purple-600">
                                {(result.similarity * 100).toFixed(0)}%
                              </div>
                              <div className="text-xs text-muted-foreground">similarité</div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {result.viewCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {result.helpfulCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Empty State */}
          {!loading && results.length === 0 && hasSearched && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-1">Aucun résultat trouvé</h3>
              <p className="text-sm text-muted-foreground">
                Essayez de reformuler votre recherche ou d'utiliser d'autres termes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular Articles Section */}
      {!hasSearched && popularArticles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Articles les plus consultés</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loadingInitial ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {popularArticles.map((article) => (
                  <Card 
                    key={article.id} 
                    className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                    onClick={() => setSelectedArticle(article as SearchResult)}
                  >
                    <CardContent className="p-4">
                      <Badge variant="secondary" className="text-xs mb-2">
                        {article.category}
                      </Badge>
                      <h4 className="font-medium text-sm line-clamp-2 mb-2">
                        {article.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {article.content.substring(0, 100)}...
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.viewCount} vues
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {article.helpfulCount}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Initial Help State */}
      {!hasSearched && !loadingInitial && popularArticles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 space-y-4">
            <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-indigo-500/10">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Recherche Sémantique IA</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Cette recherche utilise l'intelligence artificielle pour comprendre le sens de votre question 
                et trouver les articles les plus pertinents, même si les mots exacts ne correspondent pas.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {['Comment obtenir un acte de naissance ?', 'Démarches passeport', 'Mariage civil'].map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(example)}
                  className="text-xs"
                >
                  {example}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Article Detail Modal */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {selectedArticle && (
            <>
              <DialogHeader className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="secondary">{selectedArticle.category}</Badge>
                      {selectedArticle.subcategory && (
                        <Badge variant="outline">{selectedArticle.subcategory}</Badge>
                      )}
                      {selectedArticle.similarity !== undefined && (
                        <Badge className="bg-purple-500 text-white">
                          {(selectedArticle.similarity * 100).toFixed(0)}% pertinence
                        </Badge>
                      )}
                    </div>
                    <DialogTitle className="text-xl">{selectedArticle.title}</DialogTitle>
                  </div>
                  
                  {/* Share Button */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="shrink-0">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="end">
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={handleCopyLink}
                        >
                          {linkCopied ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                          {linkCopied ? "Copié !" : "Copier le lien"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={handleShareByEmail}
                        >
                          <Mail className="h-4 w-4" />
                          Envoyer par email
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <DialogDescription className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {selectedArticle.viewCount} vues
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {selectedArticle.helpfulCount} personnes ont trouvé cet article utile
                  </span>
                </DialogDescription>
              </DialogHeader>

              <Separator />

              <ScrollArea className="flex-1 pr-4">
                <div className="py-4 space-y-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {selectedArticle.content.split('\n').map((paragraph, index) => (
                      <p key={index} className="text-foreground leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                    <div className="pt-4">
                      <div className="text-sm font-medium mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedArticle.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Separator />

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Cet article vous a-t-il été utile ?
                </div>
                <Button
                  variant={markedHelpful.has(selectedArticle.id) ? "secondary" : "default"}
                  size="sm"
                  onClick={() => handleMarkHelpful(selectedArticle.id)}
                  disabled={markingHelpful || markedHelpful.has(selectedArticle.id)}
                  className="gap-2"
                >
                  {markingHelpful ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : markedHelpful.has(selectedArticle.id) ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <ThumbsUp className="h-4 w-4" />
                  )}
                  {markedHelpful.has(selectedArticle.id) ? "Merci !" : "Oui, c'est utile"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SemanticSearchDemo;