export interface InspoItem {
  id: string;
  imageUrl: string;
  title: string;
}

export interface InspoSection {
  id: string;
  title: string;
  items: InspoItem[];
}

// Hardcoded trending data for Phase 1
// These would come from an API in Phase 2
export const inspoSections: InspoSection[] = [
  {
    id: 'leather-trench',
    title: 'Leather Trench Season',
    items: [
      {
        id: 'lt-1',
        imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=600&fit=crop',
        title: 'Classic Black Leather',
      },
      {
        id: 'lt-2',
        imageUrl: 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=400&h=600&fit=crop',
        title: 'Brown Moto Jacket',
      },
      {
        id: 'lt-3',
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=600&fit=crop',
        title: 'Oversized Trench',
      },
      {
        id: 'lt-4',
        imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&h=600&fit=crop',
        title: 'Cropped Biker',
      },
    ],
  },
  {
    id: 'diwali-glam',
    title: 'Diwali Ready',
    items: [
      {
        id: 'df-1',
        imageUrl: 'https://images.unsplash.com/photo-1583391727516-6ce8f47377d4?w=400&h=600&fit=crop',
        title: 'Traditional Gold',
      },
      {
        id: 'df-2',
        imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=600&fit=crop',
        title: 'Silk Saree Drape',
      },
      {
        id: 'df-3',
        imageUrl: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=600&fit=crop',
        title: 'Anarkali Elegance',
      },
      {
        id: 'df-4',
        imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=600&fit=crop',
        title: 'Lehenga Layers',
      },
    ],
  },
  {
    id: 'minimalist-mumbai',
    title: 'Minimalist Mumbai',
    items: [
      {
        id: 'mm-1',
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop',
        title: 'White Shirt Edit',
      },
      {
        id: 'mm-2',
        imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=600&fit=crop',
        title: 'Neutral Layers',
      },
      {
        id: 'mm-3',
        imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=600&fit=crop',
        title: 'Linen Love',
      },
      {
        id: 'mm-4',
        imageUrl: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=600&fit=crop',
        title: 'Beige Essentials',
      },
    ],
  },
];
