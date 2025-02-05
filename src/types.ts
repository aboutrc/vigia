export type MarkerCategory = 'ice' | 'police';

export interface Marker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  category: MarkerCategory;
  upvotes: number;
  createdAt: Date;
  user_id?: string;
  active?: boolean;
  lastConfirmed?: string;
  confirmationsCount?: number;
  lastStatusChange?: string;
  isEditing?: boolean;
}

export interface MarkerFormData {
  category: MarkerCategory;
}