import React, { useState, useCallback, useEffect } from 'react';
import { Search, Loader2, Sparkles, FileText, Tag, Eye, ThumbsUp, Zap, Brain, TrendingUp, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { knowledgeBaseService, KBArticle } from '@/services/knowledge-base-service';
import { cn } from '@/lib/utils';

interface SearchResult extends KBArticle {
  similarity?: number;
  keywordMatches?: string[];
}

interface CategoryInfo {
  name: string;
  count: number;
}

const SemanticSearchDemo = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'semantic' | 'text' | 'error' | null>(null);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  
  // New states for filters and suggestions
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [popularArticles, setPopularArticles] = useState<KBArticle[]>([]);
  const [popularTerms, setPopularTerms] = useState<string[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

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

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

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
  };

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    // Auto search after setting query
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
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

          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Posez une question ou décrivez ce que vous cherchez..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
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
                      "transition-all hover:shadow-md",
                      index === 0 && searchType === 'semantic' && "ring-2 ring-purple-500/20"
                    )}
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
                    onClick={() => handleSuggestionClick(article.title)}
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
    </div>
  );
};

export default SemanticSearchDemo;