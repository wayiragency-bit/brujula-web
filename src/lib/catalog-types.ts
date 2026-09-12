export interface CatalogDestination {
  id: string;
  name: string;
  country: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CatalogServiceItem {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
}

export interface CatalogHotelListItem {
  id: string;
  destinationId: string;
  destination: CatalogDestination;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogAccommodationListItem {
  id: string;
  hotelId: string;
  name: string;
  capacityAdults: number;
  capacityChildren: number;
  bedConfiguration: string | null;
  description: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogHotelDetail extends CatalogHotelListItem {
  images: CatalogImage[];
  services: CatalogServiceItem[];
  accommodations: CatalogAccommodationListItem[];
}

export interface CatalogAccommodationDetail extends CatalogAccommodationListItem {
  images: CatalogImage[];
  services: CatalogServiceItem[];
}
