export type ActivationType =
  | 'title_naming'
  | 'category_powered_by'
  | 'contestant_sponsor'
  | 'venue_sponsor'
  | 'digital';

export type SponsorTier = 'bronze' | 'silver' | 'gold' | 'premium';

export const TIER_PRICES_COP_CENTS: Record<SponsorTier, number> = {
  bronze:  500_000_00,
  silver:  2_000_000_00,
  gold:    5_000_000_00,
  premium: 15_000_000_00,
};

// Human-readable COP display (divide by 100 for pesos)
export const TIER_LABELS: Record<SponsorTier, string> = {
  bronze:  '$500.000 COP',
  silver:  '$2.000.000 COP',
  gold:    '$5.000.000 COP',
  premium: '$15.000.000+ COP',
};

export type PricingModel = 'flat' | 'cpl' | 'cpa' | 'cpm' | 'hybrid';

export interface SponsorOrganizationInput {
  legal_name: string;
  display_name: string;
  website?: string;
  industry?: string;
  tax_id?: string;
  contact_full_name: string;
  contact_email: string;
  contact_whatsapp?: string;
}

export interface SponsorApplicationInput {
  event_id: string;
  event_title?: string;
  activation_type: ActivationType;
  tier: SponsorTier;
  pricing_model: PricingModel;
  flat_price_cents: number;
  campaign_goals?: Record<string, unknown>;
}

export interface SponsorAssetInput {
  logo_path?: string;
  video_path?: string;
  tagline?: string;
  utm_destination: string;
  brand_color?: string;
}

export interface WizardDraft {
  step: 1 | 2 | 3 | 4;
  organization: Partial<SponsorOrganizationInput>;
  application: Partial<SponsorApplicationInput>;
  assets: Partial<SponsorAssetInput>;
  draft_application_id?: string;
  draft_organization_id?: string;
}

export interface SponsorApplicationCreateResponse {
  success: true;
  data: {
    application_id: string;
    organization_id: string;
  };
}

export interface SponsorPlacement {
  id: string;
  application_id: string;
  surface: string;
  surface_ref: string | null;
  asset_id: string | null;
  utm_destination: string;
  start_at: string;
  end_at: string;
  active: boolean;
  weight: number;
  // joined
  asset_storage_path?: string | null;
  asset_alt_text?: string | null;
}

export type SponsorSurface =
  | 'contest_header'
  | 'category_header'
  | 'leaderboard_footer'
  | 'contestant_profile'
  | 'digital_banner'
  | 'push_notif'
  | 'social_post'
  | 'qr_station';

// ─── Dashboard types (task 052) ───────────────────────────────────────────────

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'live'
  | 'closed';

export type InvoiceStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface SponsorOrganization {
  id: string;
  legal_name: string;
  display_name: string;
  website?: string;
  industry?: string;
  tax_id?: string;
  primary_contact_user_id: string;
  status: string;
  created_at: string;
}

export interface SponsorApplication {
  id: string;
  organization_id: string;
  event_id: string;
  activation_type: ActivationType;
  tier: SponsorTier;
  pricing_model: string;
  flat_price_cents?: number;
  campaign_goals: Record<string, unknown>;
  status: ApplicationStatus;
  rejection_reason?: string;
  submitted_at?: string;
  approved_at?: string;
  created_at: string;
  dispute_freeze: boolean;
  contract_status?: string;
}

export interface SponsorInvoice {
  id: string;
  application_id: string;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  stripe_session_id?: string;
  paid_at?: string;
}

export interface SponsorRoiDaily {
  placement_id: string;
  day: string;
  impressions: number;
  clicks: number;
  attributed_conversions: number;
  attributed_revenue_cents: number;
}

/** Price in COP pesos (not cents) — for display in the sponsor dashboard */
export const TIER_PRICES: Record<SponsorTier, number> = {
  bronze:  500_000,
  silver:  2_000_000,
  gold:    5_000_000,
  premium: 15_000_000,
};

export const TIER_BENEFITS: Record<SponsorTier, string[]> = {
  bronze:  ['Leaderboard footer', '1 social mention'],
  silver:  ['Leaderboard footer', 'Category co-branding', '3 social mentions', 'Push notification'],
  gold:    ['Contestant sponsor', '10 social mentions', 'Every-broadcast logo', 'Category co-branding', 'Push notification'],
  premium: ['Title naming rights', 'Email blast', 'Co-branded campaign', 'All Gold benefits'],
};
