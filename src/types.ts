export type MarkerCategory = 'ice' | 'police';

export interface Marker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  category: MarkerCategory;
  createdAt: Date;
}

export interface MarkerFormData {
  category: MarkerCategory;
}