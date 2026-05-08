import {
  Home,
  Calendar,
  UtensilsCrossed,
  Map,
  Music2,
  Briefcase,
  Building2,
  Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type WorkspaceId =
  | 'real-estate'
  | 'events'
  | 'restaurants'
  | 'tours'
  | 'nightlife'
  | 'organizers'
  | 'landlords'
  | 'sponsors';

export type WorkspaceGroup = 'explore' | 'manage';

export interface QuickFilter {
  label: string;
  query: string;
}

export interface WorkspaceConfig {
  id: WorkspaceId;
  label: string;
  icon: LucideIcon;
  href: string;
  chatPrompt: string;
  quickFilters: QuickFilter[];
  mapCategory: string;
  agentHint: string;
  group: WorkspaceGroup;
}

export const WORKSPACES: WorkspaceConfig[] = [
  {
    id: 'real-estate',
    label: 'Real Estate',
    icon: Home,
    href: '/chat',
    chatPrompt: 'What kind of place are you looking for in Medellín?',
    quickFilters: [
      { label: 'Furnished 1BR', query: 'furnished 1 bedroom apartments in Medellín' },
      { label: 'Under $800', query: 'apartments under $800/month in Medellín' },
      { label: 'Pet-friendly', query: 'pet-friendly rentals in El Poblado' },
      { label: 'Monthly stay', query: 'monthly rentals with fast WiFi in Laureles' },
    ],
    mapCategory: 'rental',
    agentHint:
      'User is looking for rentals/real estate. Call rentals_search FIRST for any apartment or housing query.',
    group: 'explore',
  },
  {
    id: 'events',
    label: 'Events',
    icon: Calendar,
    href: '/events',
    chatPrompt: 'What kind of events are you looking for in Medellín?',
    quickFilters: [
      { label: 'Tonight', query: 'events happening tonight in Medellín' },
      { label: 'This weekend', query: 'events this weekend in Medellín' },
      { label: 'Free entry', query: 'free events in Medellín' },
      { label: 'Salsa nights', query: 'salsa dancing events in Medellín' },
    ],
    mapCategory: 'event',
    agentHint: 'User is looking for events. Call event_search FIRST for any event or nightlife query.',
    group: 'explore',
  },
  {
    id: 'restaurants',
    label: 'Restaurants',
    icon: UtensilsCrossed,
    href: '/restaurants',
    chatPrompt: 'What are you in the mood to eat in Medellín?',
    quickFilters: [
      { label: 'Rooftop dining', query: 'rooftop restaurants in El Poblado' },
      { label: 'Local food', query: 'authentic Colombian restaurants in Medellín' },
      { label: 'Brunch spots', query: 'best brunch spots in Medellín' },
      { label: 'Date night', query: 'romantic restaurants in Medellín' },
    ],
    mapCategory: 'restaurant',
    agentHint:
      'User is looking for restaurants and dining. Recommend based on neighborhood and cuisine preferences.',
    group: 'explore',
  },
  {
    id: 'tours',
    label: 'Tours',
    icon: Map,
    href: '/tours',
    chatPrompt: 'What kind of experiences are you looking for in Medellín?',
    quickFilters: [
      { label: 'City tour', query: 'Medellín city tours and day trips' },
      { label: 'Coffee region', query: 'coffee region tours from Medellín' },
      { label: 'Food tour', query: 'food and market tours in Medellín' },
      { label: 'Hiking', query: 'hiking and nature tours near Medellín' },
    ],
    mapCategory: 'tour',
    agentHint:
      'User is looking for tours and experiences. Help them find guided tours and activities in and around Medellín.',
    group: 'explore',
  },
  {
    id: 'nightlife',
    label: 'Nightlife',
    icon: Music2,
    href: '/nightlife',
    chatPrompt: 'What vibe are you looking for tonight in Medellín?',
    quickFilters: [
      { label: 'Salsa clubs', query: 'best salsa clubs in Medellín tonight' },
      { label: 'Reggaeton', query: 'reggaeton clubs and parties in Medellín' },
      { label: 'Rooftop bars', query: 'rooftop bars with views in El Poblado' },
      { label: 'Live music', query: 'live music venues in Medellín tonight' },
    ],
    mapCategory: 'nightlife',
    agentHint: 'User is looking for nightlife. Help them find clubs, bars, and live music events.',
    group: 'explore',
  },
  {
    id: 'organizers',
    label: 'Organizers',
    icon: Briefcase,
    href: '/host',
    chatPrompt:
      'What would you like to manage today? I can help you create events, manage tickets, or find sponsors.',
    quickFilters: [
      { label: 'Create event', query: 'I want to create a new event in Medellín' },
      { label: 'Manage tickets', query: 'help me manage tickets for my event' },
      { label: 'Find sponsors', query: 'I need sponsors for my event' },
      { label: 'View analytics', query: 'show me my event analytics' },
    ],
    mapCategory: 'venue',
    agentHint:
      'User is an event organizer. Help them create events, manage tickets, check-in attendees, and connect with sponsors.',
    group: 'manage',
  },
  {
    id: 'landlords',
    label: 'Landlords',
    icon: Building2,
    href: '/host/listings',
    chatPrompt:
      'What would you like to manage? I can help you list your property, track leads, or handle applications.',
    quickFilters: [
      { label: 'List property', query: 'I want to list my property for rent' },
      { label: 'Manage leads', query: 'show me my rental leads and inquiries' },
      { label: 'Applications', query: 'show me my rental applications' },
      { label: 'Payouts', query: 'show me my payout history' },
    ],
    mapCategory: 'rental',
    agentHint:
      'User is a landlord/property owner. Help them list properties, manage leads, review applications, and track payouts.',
    group: 'manage',
  },
  {
    id: 'sponsors',
    label: 'Sponsors',
    icon: Star,
    href: '/sponsor/apply',
    chatPrompt:
      'Welcome! I can help you sponsor events and reach your target audience in Medellín. What kind of audience are you trying to reach?',
    quickFilters: [
      { label: 'Apply to sponsor', query: 'I want to sponsor events in Medellín' },
      { label: 'View packages', query: 'what sponsorship packages are available?' },
      { label: 'My campaigns', query: 'show me my active sponsorship campaigns' },
      { label: 'ROI report', query: 'show me my sponsorship performance metrics' },
    ],
    mapCategory: 'venue',
    agentHint:
      'User is a potential sponsor or brand partner. Help them understand sponsorship packages, apply, and track campaign performance.',
    group: 'manage',
  },
];

export const WORKSPACE_MAP: Record<WorkspaceId, WorkspaceConfig> = Object.fromEntries(
  WORKSPACES.map((w) => [w.id, w]),
) as Record<WorkspaceId, WorkspaceConfig>;

export const EXPLORE_WORKSPACES = WORKSPACES.filter((w) => w.group === 'explore');
export const MANAGE_WORKSPACES = WORKSPACES.filter((w) => w.group === 'manage');
