import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { AdvertisingPopupCampaign } from '../../types/advertising-popup';
import AdvertisingPopup from './AdvertisingPopup.vue';

type PopupWrapper = ReturnType<typeof mount>;
const wrappers: PopupWrapper[] = [];
const componentFile = './AdvertisingPopup.vue';
const componentSource = readFileSync(
  fileURLToPath(new URL(componentFile, import.meta.url)),
  'utf8'
);

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

  it('assigns distinct title relationships to simultaneous dialog instances', () => {
    mountPopup();
    mountPopup({ id: 43, title: 'Thông báo thứ hai' });
    const dialogs = Array.from(
      document.body.querySelectorAll('[role="dialog"]')
    );
    const titleIds = dialogs.map((dialog) =>
      dialog.getAttribute('aria-labelledby')
    );

    expect(new Set(titleIds).size).toBe(2);
    titleIds.forEach((id, index) => {
      expect(id).not.toBeNull();
      expect(dialogs[index].querySelector('h2')?.id).toBe(id);
    });
  });

  it('teleports the modal under document.body instead of the mount wrapper', () => {
    const wrapper = mountPopup();

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
    expect(
      document.body.querySelector('[data-testid="popup-overlay"]')
    ).not.toBeNull();
  });

  it('uses a centered fixed overlay and responsive scrollable card', () => {
    mountPopup();
    const overlay = document.body.querySelector(
      '[data-testid="popup-overlay"]'
    )!;
    const dialog = document.body.querySelector('[role="dialog"]')!;

    expect(overlay.className).toContain('fixed');
    expect(overlay.className).toContain('inset-0');
    expect(overlay.className).toContain('flex');
    expect(overlay.className).toContain('items-center');
    expect(overlay.className).toContain('justify-center');
    expect(dialog.className).toContain('w-full');
    expect(dialog.className).toContain('max-w-lg');
    expect(dialog.className).toContain('max-h-[calc(100dvh-2rem)]');
    expect(dialog.className).toContain('overflow-y-auto');
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
    expect(
      document.body.querySelector('[data-testid="popup-overlay"]')!.className
    ).toContain('bg-foreground/50');
  });

  it('uses restrained opacity/scale motion with reduced-motion disabled transitions', () => {
    expect(componentSource).toMatch(/transition:\s*opacity 180ms ease/);
    expect(componentSource).toMatch(/transform:\s*scale\(0\.98\)/);
    expect(componentSource).toContain(
      '@media (prefers-reduced-motion: reduce)'
    );
    expect(componentSource).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?transition:\s*none/
    );
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

  it('moves Tab to the first focusable element when focus is outside the dialog', async () => {
    mountPopup();
    await nextTick();
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    const close = document.body.querySelector<HTMLButtonElement>(
      '[aria-label="Đóng thông báo quảng cáo"]'
    )!;
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });

    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(close);
  });

  it('moves Shift+Tab to the last focusable element when focus is outside the dialog', async () => {
    mountPopup();
    await nextTick();
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    const cta = document.body.querySelector<HTMLAnchorElement>(
      '[data-testid="popup-cta"]'
    )!;
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });

    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(cta);
  });

  it('lets only the topmost dialog handle Escape and keeps the underlying modal active', async () => {
    const bottom = mountPopup();
    const top = mountPopup({ id: 43, title: 'Thông báo thứ hai' });
    await nextTick();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    expect(top.emitted('close')).toHaveLength(1);
    expect(bottom.emitted('close')).toBeUndefined();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('keeps focus in the top dialog when an underlying dialog unmounts', async () => {
    const bottom = mountPopup();
    const top = mountPopup({ id: 43, title: 'Thông báo thứ hai' });
    await nextTick();
    const topDialog =
      document.body.querySelectorAll<HTMLElement>('[role="dialog"]')[1];
    topDialog.querySelector<HTMLElement>('a[href]')!.focus();

    bottom.unmount();

    expect(topDialog.contains(document.activeElement)).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');
    top.unmount();
  });

  it('hands focus to the new top dialog when the current top unmounts', async () => {
    const bottom = mountPopup();
    const top = mountPopup({ id: 43, title: 'Thông báo thứ hai' });
    await nextTick();
    const bottomDialog =
      document.body.querySelectorAll<HTMLElement>('[role="dialog"]')[0];
    const bottomClose =
      bottomDialog.querySelector<HTMLButtonElement>('button')!;

    top.unmount();

    expect(document.activeElement).toBe(bottomClose);
    expect(document.body.style.overflow).toBe('hidden');
    bottom.unmount();
  });

  it.each([
    ['top-first', 1, 0],
    ['bottom-first', 0, 1],
  ])(
    'restores exact body overflow only after the final unmount (%s)',
    async (_name, firstIndex, lastIndex) => {
      document.body.style.overflow = 'scroll';
      const instances = [
        mountPopup(),
        mountPopup({ id: 43, title: 'Thông báo thứ hai' }),
      ];
      await nextTick();

      instances[firstIndex].unmount();
      expect(document.body.style.overflow).toBe('hidden');
      instances[lastIndex].unmount();
      expect(document.body.style.overflow).toBe('scroll');
    }
  );

  it('traps Tab only within the topmost dialog', async () => {
    mountPopup();
    mountPopup({ id: 43, title: 'Thông báo thứ hai' });
    await nextTick();
    const dialogs =
      document.body.querySelectorAll<HTMLElement>('[role="dialog"]');
    const bottomClose = dialogs[0].querySelector<HTMLButtonElement>('button')!;
    const topClose = dialogs[1].querySelector<HTMLButtonElement>('button')!;
    bottomClose.focus();

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Tab',
        bubbles: true,
        cancelable: true,
      })
    );

    expect(document.activeElement).toBe(topClose);
  });
});
