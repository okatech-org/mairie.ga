import { useState, useEffect, useCallback } from 'react';
import { MunicipalServiceType } from '@/types/municipal-services';

const FAVORITES_KEY = 'favorite_services';

export const useFavoriteServices = () => {
  const [favorites, setFavorites] = useState<MunicipalServiceType[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  const saveFavorites = useCallback((newFavorites: MunicipalServiceType[]) => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    setFavorites(newFavorites);
  }, []);

  const addFavorite = useCallback((serviceId: MunicipalServiceType) => {
    if (!favorites.includes(serviceId)) {
      saveFavorites([...favorites, serviceId]);
    }
  }, [favorites, saveFavorites]);

  const removeFavorite = useCallback((serviceId: MunicipalServiceType) => {
    saveFavorites(favorites.filter(id => id !== serviceId));
  }, [favorites, saveFavorites]);

  const toggleFavorite = useCallback((serviceId: MunicipalServiceType) => {
    if (favorites.includes(serviceId)) {
      removeFavorite(serviceId);
    } else {
      addFavorite(serviceId);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((serviceId: MunicipalServiceType) => {
    return favorites.includes(serviceId);
  }, [favorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite
  };
};
