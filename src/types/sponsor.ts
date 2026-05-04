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
