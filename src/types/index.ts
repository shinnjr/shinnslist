// === Core Types (platform-agnostic — ported from React Native) ===

export interface InterestCategory {
  id: string;
  emoji: string;
  label: string;
  subcategories: string[];
  keywords: string[];
  msrpCategories: string[];
}

export interface TasteProfile {
  selectedInterests: string[];
  interestWeights: Record<string, number>;
  negativeKeywords: string[];
  priceRange: { min: number; max: number };
  maxDistance: number;
  updatedAt: number;
}

export interface Listing {
  id: string;
  source: 'nextdoor' | 'offerup' | 'facebook' | 'craigslist' | 'trashnothing' | 'ebay';
  sourceUrl: string;
  title: string;
  description: string;
  photos: string[];
  price: number;
  estimatedValue: number | null;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor' | 'unknown';
  flags: ListingFlag[];
  location: {
    lat: number;
    lng: number;
    city: string;
    state: string;
  };
  postedAt: number;
  expiresAt: number | null;
}

export type ListingFlag = 
  | 'scam' 
  | 'damaged' 
  | 'free' 
  | 'undervalued' 
  | 'high-value'
  | 'expiring-soon';

export type FeedTab = 'for-you' | 'latest' | 'events' | 'saved';
export type SwipeDirection = 'right' | 'left' | 'up';

export interface CustomZone {
  id: string;
  name: string;
  polygon: { lat: number; lng: number }[];
  enabled: boolean;
}

export interface RouteAlert {
  id: string;
  name: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  maxDetourMinutes: number;
  enabled: boolean;
  schedule?: {
    days: number[];
    timeWindow: { start: string; end: string };
  };
}

export type OnboardingStep = 'welcome' | 'interests' | 'location' | 'notifications' | 'done';

export interface User {
  id: string;
  email: string;
  tasteProfile: TasteProfile;
  zones: CustomZone[];
  routeAlerts: RouteAlert[];
  savedListings: string[];
  dismissedListings: string[];
  claimedListings: string[];
  subscription: 'free' | 'pro' | 'flipper';
  onboardingComplete: boolean;
  createdAt: number;
}

// === Onboarding Card ===
export interface OnboardingCard {
  id: string;
  emoji: string;
  label: string;
  imageHint: string;
  categories: string[];
  weight: number;
}

// === Interest Grouping ===
export interface InterestGrouping {
  id: string;
  emoji: string;
  label: string;
  description: string;
  categories: string[];
}
