import { Mail, Phone } from 'lucide-vue-next';

export type FooterContactIconKind = 'phone' | 'email';

export const resolveFooterContactIcon = (kind: FooterContactIconKind) => {
  return kind === 'phone' ? Phone : Mail;
};
