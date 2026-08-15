import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import type { AdvertisingPopupCampaign } from '../../types/advertising-popup';
import AdvertisingPopup from './AdvertisingPopup.vue';

type PopupWrapper = ReturnType<typeof mount>;
const wrappers: PopupWrapper[] = [];

const campaign: AdvertisingPopupCampaign = {
  id: 42,
  name: 'Welcome campaign',
  title: 'Ưu đãi cuối tuần 🎉',
  content: 'Dòng thứ nhất\nDòng thứ hai <script>window.pwned = true</script>',
  ctaLabel: 'Xem ưu đãi',
  ctaUrl: '/khuyen-mai',
  isActive: true,
  startsAt: null,
  endsAt: null,
};

const mountPopup = (overrides: Partial<AdvertisingPopupCampaign> = {}) => {
  const wrapper = mount(AdvertisingPopup, {
    attachTo: document.body,
    props: { campaign: { ...campaign, ...overrides } },
    global: {
      stubs: {
        NuxtLink: {
          props: ['to'],
          template: '<a :href="to"><slot /></a>',
        },
        Transition: false,
      },
    },
  });
  wrappers.push(wrapper);
  return wrapper;
};

describe('AdvertisingPopup', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  it('renders an accessible dialog with a uniquely linked title', () => {
    const wrapper = mountPopup();
    const dialog = document.body.querySelector('[role="dialog"]')!;
    const titleId = dialog.getAttribute('aria-labelledby')!;

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(titleId).toMatch(/^advertising-popup-title-/);
    expect(document.getElementById(titleId)?.textContent).toBe(campaign.title);
    expect(
      document.body.querySelector('[aria-label="Đóng thông báo quảng cáo"]')
    ).not.toBeNull();
  });

  it('renders emoji and multiline content as plain text', () => {
    mountPopup();
    const content = document.body.querySelector(
      '[data-testid="popup-content"]'
    )!;

    expect(content.textContent).toContain(
      'Dòng thứ nhất\nDòng thứ hai <script>'
    );
    expect(content.classList.contains('whitespace-pre-line')).toBe(true);
    expect(content.querySelector('script')).toBeNull();
    expect(document.body.querySelector('script')).toBeNull();
  });

  it('uses semantic theme classes without inline promotional colors', () => {
    mountPopup();
    const dialog = document.body.querySelector('[role="dialog"]')!;

    expect(dialog.className).toContain('bg-card');
    expect(dialog.className).toContain('text-card-foreground');
    expect(dialog.className).toContain('border-border');
    expect(dialog.getAttribute('style')).toBeNull();
    expect(document.body.innerHTML).not.toMatch(/(?:gold|amber|yellow|brown)/i);
  });

  it.each([
    ['close button', '[aria-label="Đóng thông báo quảng cáo"]', 'click'],
    ['overlay', '[data-testid="popup-overlay"]', 'click'],
  ])('emits close from the %s', async (_name, selector, event) => {
    const wrapper = mountPopup();
    document.body
      .querySelector<HTMLElement>(selector)!
      .dispatchEvent(new MouseEvent(event, { bubbles: true }));
    await nextTick();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits close on Escape but not on a click inside the dialog', async () => {
    const wrapper = mountPopup();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();
    expect(wrapper.emitted('close')).toHaveLength(1);

    document.body
      .querySelector('[role="dialog"]')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('renders internal CTA with NuxtLink semantics', () => {
    mountPopup();
    const link = document.body.querySelector('[data-testid="popup-cta"]')!;
    expect(link.getAttribute('href')).toBe('/khuyen-mai');
    expect(link.getAttribute('target')).toBeNull();
  });

  it('renders safe HTTPS CTA as a protected new-tab link', () => {
    mountPopup({ ctaUrl: 'https://example.com/sale' });
    const link = document.body.querySelector('[data-testid="popup-cta"]')!;
    expect(link.getAttribute('href')).toBe('https://example.com/sale');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it.each([
    'javascript:alert(1)',
    'http://example.com',
    '//evil.test',
    '/safe\\evil',
  ])('does not render an unsafe CTA: %s', (ctaUrl) => {
    mountPopup({ ctaUrl });
    expect(document.body.querySelector('[data-testid="popup-cta"]')).toBeNull();
  });

  it('locks body scrolling and restores its exact prior value', () => {
    document.body.style.overflow = 'scroll';
    const wrapper = mountPopup();
    expect(document.body.style.overflow).toBe('hidden');
    wrapper.unmount();
    expect(document.body.style.overflow).toBe('scroll');
  });

  it('focuses the close button initially and restores previous focus', async () => {
    const previous = document.createElement('button');
    document.body.append(previous);
    previous.focus();
    const wrapper = mountPopup();
    await nextTick();

    expect(document.activeElement?.getAttribute('aria-label')).toBe(
      'Đóng thông báo quảng cáo'
    );
    wrapper.unmount();
    expect(document.activeElement).toBe(previous);
  });

  it('wraps Tab forward from the last focusable element', async () => {
    mountPopup();
    await nextTick();
    const close = document.body.querySelector<HTMLButtonElement>(
      '[aria-label="Đóng thông báo quảng cáo"]'
    )!;
    const cta = document.body.querySelector<HTMLAnchorElement>(
      '[data-testid="popup-cta"]'
    )!;
    cta.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })
    );
    expect(document.activeElement).toBe(close);
  });

  it('wraps Shift+Tab backward from the first focusable element', async () => {
    mountPopup();
    await nextTick();
    const close = document.body.querySelector<HTMLButtonElement>(
      '[aria-label="Đóng thông báo quảng cáo"]'
    )!;
    const cta = document.body.querySelector<HTMLAnchorElement>(
      '[data-testid="popup-cta"]'
    )!;
    close.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      })
    );
    expect(document.activeElement).toBe(cta);
  });
});
