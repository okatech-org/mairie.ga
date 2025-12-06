export interface MairieGabon {
  id: string;
  name: string;
  province: string;
  departement: string;
  coordinates: [number, number]; // [longitude, latitude]
  population?: number;
  maire?: string;
  contact?: string;
  isCapitalProvince?: boolean;
}

export const mairiesGabon: MairieGabon[] = [
  // Estuaire
  { id: "1", name: "Mairie de Libreville", province: "Estuaire", departement: "Libreville", coordinates: [9.4536, 0.3924], population: 703904, isCapitalProvince: true },
  { id: "2", name: "Mairie d'Owendo", province: "Estuaire", departement: "Libreville", coordinates: [9.4944, 0.2833], population: 79300 },
  { id: "3", name: "Mairie d'Akanda", province: "Estuaire", departement: "Komo-Mondah", coordinates: [9.4667, 0.5167], population: 25000 },
  { id: "4", name: "Mairie de Ntoum", province: "Estuaire", departement: "Komo-Mondah", coordinates: [9.7667, 0.3833], population: 12500 },
  { id: "5", name: "Mairie de Cocobeach", province: "Estuaire", departement: "Komo-Océan", coordinates: [9.5833, 1.0000], population: 8000 },
  { id: "6", name: "Mairie de Kango", province: "Estuaire", departement: "Komo", coordinates: [10.1500, 0.1833], population: 6500 },
  { id: "7", name: "Mairie de Mébesse", province: "Estuaire", departement: "Noya", coordinates: [10.5000, 0.0500], population: 3500 },
  { id: "8", name: "Mairie de Nkan", province: "Estuaire", departement: "Noya", coordinates: [10.3000, 0.1000], population: 2800 },
  { id: "9", name: "Mairie de Bikele", province: "Estuaire", departement: "Komo-Mondah", coordinates: [9.7500, 0.5000], population: 2500 },
  { id: "10", name: "Mairie d'Andok Foula", province: "Estuaire", departement: "Komo", coordinates: [10.0000, 0.2500], population: 1800 },
  { id: "11", name: "Mairie de Cap Estérias", province: "Estuaire", departement: "Libreville", coordinates: [9.3333, 0.6167], population: 3200 },
  { id: "12", name: "Mairie de Santa Clara", province: "Estuaire", departement: "Libreville", coordinates: [9.3667, 0.5667], population: 2100 },

  // Haut-Ogooué
  { id: "13", name: "Mairie de Franceville", province: "Haut-Ogooué", departement: "Passa", coordinates: [13.5833, -1.6333], population: 110568, isCapitalProvince: true },
  { id: "14", name: "Mairie de Moanda", province: "Haut-Ogooué", departement: "Lébombi-Léyou", coordinates: [13.2000, -1.5333], population: 54000 },
  { id: "15", name: "Mairie de Mounana", province: "Haut-Ogooué", departement: "Lébombi-Léyou", coordinates: [13.1667, -1.4000], population: 12000 },
  { id: "16", name: "Mairie d'Okondja", province: "Haut-Ogooué", departement: "Sébé-Brikolo", coordinates: [13.6833, -0.6500], population: 8500 },
  { id: "17", name: "Mairie de Léconi", province: "Haut-Ogooué", departement: "Plateaux", coordinates: [14.2500, -1.5833], population: 5200 },
  { id: "18", name: "Mairie de Bongoville", province: "Haut-Ogooué", departement: "Djoué", coordinates: [13.9833, -1.9333], population: 4500 },
  { id: "19", name: "Mairie d'Akiéni", province: "Haut-Ogooué", departement: "Plateaux", coordinates: [13.9333, -1.3167], population: 3800 },
  { id: "20", name: "Mairie de Boumango", province: "Haut-Ogooué", departement: "Bayi-Brikolo", coordinates: [13.0833, -1.1500], population: 2900 },

  // Moyen-Ogooué
  { id: "21", name: "Mairie de Lambaréné", province: "Moyen-Ogooué", departement: "Ogooué et lacs", coordinates: [10.2333, -0.7000], population: 38775, isCapitalProvince: true },
  { id: "22", name: "Mairie de Ndjolé", province: "Moyen-Ogooué", departement: "Abanga-Bigné", coordinates: [10.7667, -0.1833], population: 8500 },
  { id: "23", name: "Mairie de Bifoun", province: "Moyen-Ogooué", departement: "Abanga-Bigné", coordinates: [10.4000, -0.3500], population: 3200 },
  { id: "24", name: "Mairie d'Ogooué", province: "Moyen-Ogooué", departement: "Ogooué et lacs", coordinates: [10.1000, -0.8500], population: 2400 },
  { id: "25", name: "Mairie de Makouké", province: "Moyen-Ogooué", departement: "Abanga-Bigné", coordinates: [10.5500, -0.2500], population: 1800 },

  // Ngounié
  { id: "26", name: "Mairie de Mouila", province: "Ngounié", departement: "Douya-Onoye", coordinates: [11.0500, -1.8667], population: 27206, isCapitalProvince: true },
  { id: "27", name: "Mairie de Ndendé", province: "Ngounié", departement: "Dola", coordinates: [11.3500, -2.4000], population: 8500 },
  { id: "28", name: "Mairie de Fougamou", province: "Ngounié", departement: "Tsamba-Magotsi", coordinates: [10.5833, -1.2167], population: 6200 },
  { id: "29", name: "Mairie de Mbigou", province: "Ngounié", departement: "Boumi-Louétsi", coordinates: [11.9333, -2.1500], population: 4800 },
  { id: "30", name: "Mairie de Mimongo", province: "Ngounié", departement: "Ogoulou", coordinates: [11.6167, -1.6500], population: 3500 },
  { id: "31", name: "Mairie de Guietsou", province: "Ngounié", departement: "Douya-Onoye", coordinates: [11.1500, -1.7500], population: 2200 },

  // Nyanga
  { id: "32", name: "Mairie de Tchibanga", province: "Nyanga", departement: "Basse-Banio", coordinates: [11.0333, -2.8500], population: 31500, isCapitalProvince: true },
  { id: "33", name: "Mairie de Mayumba", province: "Nyanga", departement: "Basse-Banio", coordinates: [10.6500, -3.4333], population: 5000 },
  { id: "34", name: "Mairie de Moabi", province: "Nyanga", departement: "Douigni", coordinates: [10.9333, -2.4500], population: 3800 },
  { id: "35", name: "Mairie de Moulengui-Binza", province: "Nyanga", departement: "Mougoutsi", coordinates: [11.2000, -2.6500], population: 2500 },

  // Ogooué-Maritime
  { id: "36", name: "Mairie de Port-Gentil", province: "Ogooué-Maritime", departement: "Bendjé", coordinates: [8.7833, -0.7167], population: 136462, isCapitalProvince: true },
  { id: "37", name: "Mairie de Gamba", province: "Ogooué-Maritime", departement: "Etimboué", coordinates: [10.0000, -2.6500], population: 9000 },
  { id: "38", name: "Mairie d'Omboué", province: "Ogooué-Maritime", departement: "Etimboué", coordinates: [9.2500, -1.5667], population: 4500 },
  { id: "39", name: "Mairie de Sette Cama", province: "Ogooué-Maritime", departement: "Ndougou", coordinates: [9.7500, -2.5333], population: 2000 },
  { id: "40", name: "Mairie d'Ozouri", province: "Ogooué-Maritime", departement: "Bendjé", coordinates: [8.9000, -0.5500], population: 1500 },

  // Ogooué-Ivindo
  { id: "41", name: "Mairie de Makokou", province: "Ogooué-Ivindo", departement: "Ivindo", coordinates: [12.8667, 0.5667], population: 17070, isCapitalProvince: true },
  { id: "42", name: "Mairie de Booué", province: "Ogooué-Ivindo", departement: "Lopé", coordinates: [11.9333, -0.1000], population: 5500 },
  { id: "43", name: "Mairie de Mékambo", province: "Ogooué-Ivindo", departement: "Zadié", coordinates: [14.0500, 1.0167], population: 4200 },
  { id: "44", name: "Mairie d'Ovan", province: "Ogooué-Ivindo", departement: "Ivindo", coordinates: [12.0000, 0.4000], population: 2800 },

  // Ogooué-Lolo
  { id: "45", name: "Mairie de Koulamoutou", province: "Ogooué-Lolo", departement: "Offoué-Onoye", coordinates: [12.4833, -1.1333], population: 20403, isCapitalProvince: true },
  { id: "46", name: "Mairie de Lastoursville", province: "Ogooué-Lolo", departement: "Mulundu", coordinates: [12.7333, -0.8167], population: 8000 },
  { id: "47", name: "Mairie de Pana", province: "Ogooué-Lolo", departement: "Lombo-Bouenguidi", coordinates: [12.2000, -1.4000], population: 3500 },
  { id: "48", name: "Mairie d'Iboundji", province: "Ogooué-Lolo", departement: "Lolo-Bouenguidi", coordinates: [11.8500, -1.5500], population: 2800 },

  // Woleu-Ntem
  { id: "49", name: "Mairie d'Oyem", province: "Woleu-Ntem", departement: "Woleu", coordinates: [11.5833, 1.6000], population: 39430, isCapitalProvince: true },
  { id: "50", name: "Mairie de Bitam", province: "Woleu-Ntem", departement: "Ntem", coordinates: [11.4833, 2.0833], population: 12000 },
  { id: "51", name: "Mairie de Minvoul", province: "Woleu-Ntem", departement: "Haut-Ntem", coordinates: [12.1333, 2.1500], population: 5500 },
  { id: "52", name: "Mairie de Mitzic", province: "Woleu-Ntem", departement: "Okano", coordinates: [11.5500, 0.7833], population: 8000 },
];

export const provinces = [
  { name: "Estuaire", capital: "Libreville", color: "#009e49" },
  { name: "Haut-Ogooué", capital: "Franceville", color: "#fcd116" },
  { name: "Moyen-Ogooué", capital: "Lambaréné", color: "#3a75c4" },
  { name: "Ngounié", capital: "Mouila", color: "#e31b23" },
  { name: "Nyanga", capital: "Tchibanga", color: "#9b59b6" },
  { name: "Ogooué-Maritime", capital: "Port-Gentil", color: "#00bcd4" },
  { name: "Ogooué-Ivindo", capital: "Makokou", color: "#ff9800" },
  { name: "Ogooué-Lolo", capital: "Koulamoutou", color: "#795548" },
  { name: "Woleu-Ntem", capital: "Oyem", color: "#607d8b" },
];
