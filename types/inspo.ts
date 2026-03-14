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