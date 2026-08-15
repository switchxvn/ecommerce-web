export interface AdvertisingPopupCampaign {
  id: number;
  name: string;
  title: string;
  content: string;
  ctaLabel: string;
  ctaUrl: string;
  isActive: boolean;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
}
