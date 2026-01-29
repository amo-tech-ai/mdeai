// Shared listing types for apartments, cars, restaurants, events

export interface BaseListingFilters {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PriceRange {
  min?: number;
  max?: number;
}

// Apartments
export interface ApartmentFilters extends BaseListingFilters {
  neighborhoods?: string[];
  priceRange?: PriceRange;
  bedrooms?: number[];
  bathrooms?: number[];
  furnished?: boolean;
  petFriendly?: boolean;
  wifiSpeedMin?: number;
  availableFrom?: string;
  amenities?: string[];
}

export interface Apartment {
  id: string;
  title: string;
  neighborhood: string;
  description?: string;
  slug?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  size_sqm?: number;
  furnished?: boolean;
  floor_number?: number;
  total_floors?: number;
  wifi_speed?: number;
  amenities?: string[];
  building_amenities?: string[];
  price_monthly?: number;
  price_weekly?: number;
  price_daily?: number;
  currency?: string;
  deposit_amount?: number;
  available_from?: string;
  available_to?: string;
  minimum_stay_days?: number;
  maximum_stay_days?: number;
  utilities_included?: boolean;
  pet_friendly?: boolean;
  smoking_allowed?: boolean;
  parking_included?: boolean;
  images?: string[];
  video_url?: string;
  virtual_tour_url?: string;
  rating?: number;
  review_count?: number;
  host_id?: string;
  host_name?: string;
  host_response_time?: string;
  status?: string;
  featured?: boolean;
  verified?: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Rentals AI fields
  source_url?: string;
  freshness_status?: 'active' | 'unconfirmed' | 'stale';
  last_checked_at?: string;
  source_listing_id?: string;
}

// Cars
export interface CarFilters extends BaseListingFilters {
  vehicleTypes?: string[];
  transmission?: string[];
  priceRange?: PriceRange;
  features?: string[];
  pickupDateStart?: string;
  pickupDateEnd?: string;
  unlimitedMileage?: boolean;
  insuranceIncluded?: boolean;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  price_daily: number;
  description?: string | null;
  slug?: string | null;
  year?: number | null;
  vehicle_type?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  seats?: number | null;
  doors?: number | null;
  color?: string | null;
  features?: string[] | null;
  has_ac?: boolean | null;
  has_gps?: boolean | null;
  has_bluetooth?: boolean | null;
  price_weekly?: number | null;
  price_monthly?: number | null;
  currency?: string | null;
  deposit_amount?: number | null;
  insurance_included?: boolean | null;
  mileage_limit_daily?: number | null;
  unlimited_mileage?: boolean | null;
  available_from?: string | null;
  available_to?: string | null;
  minimum_rental_days?: number | null;
  pickup_locations?: unknown; // JSON type from DB
  delivery_available?: boolean | null;
  images?: string[] | null;
  rating?: number | null;
  review_count?: number | null;
  rental_company?: string | null;
  status?: string | null;
  featured?: boolean | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

// Common listing card display type
export interface ListingCardData {
  id: string;
  type: 'apartment' | 'car' | 'restaurant' | 'event';
  title: string;
  subtitle: string;
  image: string;
  price: string;
  priceSubtext?: string;
  rating?: number;
  reviewCount?: number;
  tags: string[];
  badges: { label: string; variant: 'default' | 'secondary' | 'outline' }[];
  location?: { lat: number; lng: number };
  isSaved?: boolean;
}
