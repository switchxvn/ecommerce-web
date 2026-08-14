export interface AdvertisingPopup {
  id: number;
  name: string;
  title: string;
  content: string;
  ctaLabel: string;
  ctaUrl: string;
  isActive: boolean;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PopupFormState {
  name: string;
  title: string;
  content: string;
  ctaLabel: string;
  ctaUrl: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
}

export interface PopupMutationInput {
  name: string;
  title: string;
  content: string;
  ctaLabel: string;
  ctaUrl: string;
  startsAt: Date | null;
  endsAt: Date | null;
}

export const createDefaultPopupForm = (): PopupFormState => ({
  name: '',
  title: 'Ưu đãi đặt vé hôm nay',
  content:
    '🎫 Đặt vé trực tuyến nhanh chóng\nGiữ chỗ ngay để không bỏ lỡ hành trình của bạn.',
  ctaLabel: 'Đặt vé ngay',
  ctaUrl: '/order-ticket',
  isActive: false,
  startsAt: '',
  endsAt: '',
});

const toOptionalDate = (value: string): Date | null => {
  const normalized = value.trim();
  return normalized ? new Date(normalized) : null;
};

export const toPopupMutationInput = (
  form: PopupFormState
): PopupMutationInput => ({
  name: form.name.trim(),
  title: form.title.trim(),
  content: form.content,
  ctaLabel: form.ctaLabel.trim(),
  ctaUrl: form.ctaUrl.trim(),
  startsAt: toOptionalDate(form.startsAt),
  endsAt: toOptionalDate(form.endsAt),
});

const toDateTimeLocal = (value: Date | string | null): string => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000
  );
  return localDate.toISOString().slice(0, 16);
};

export const popupToFormState = (popup: AdvertisingPopup): PopupFormState => ({
  name: popup.name,
  title: popup.title,
  content: popup.content,
  ctaLabel: popup.ctaLabel,
  ctaUrl: popup.ctaUrl,
  isActive: popup.isActive,
  startsAt: toDateTimeLocal(popup.startsAt),
  endsAt: toDateTimeLocal(popup.endsAt),
});
