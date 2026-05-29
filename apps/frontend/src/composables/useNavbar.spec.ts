import { defineComponent, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useNavbar', () => {
  const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
  const originalOffsetHeightDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
  const originalQuerySelector = document.querySelector.bind(document);

  beforeEach(() => {
    document.documentElement.style.removeProperty('--nav-height');
    document.documentElement.style.removeProperty('--mobile-menu-top');
    document.body.className = '';

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
      configurable: true,
    });

    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      const top = Number(this.getAttribute('data-top') ?? 0);
      const height = Number(this.getAttribute('data-height') ?? 64);

      return {
        top,
        left: 0,
        right: 0,
        bottom: top + height,
        width: 320,
        height,
        x: 0,
        y: top,
        toJSON: () => ({}),
      } as DOMRect;
    };

    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return Number(this.getAttribute('data-height') ?? 64);
      },
    });

    document.querySelector = ((selectors: string) => {
      if (selectors === '.navigation-section') {
        return originalQuerySelector('[data-testid="navigation-section"]');
      }

      return originalQuerySelector(selectors);
    }) as typeof document.querySelector;
  });

  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    if (originalOffsetHeightDescriptor) {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeightDescriptor);
    }
    document.querySelector = originalQuerySelector as typeof document.querySelector;
    vi.unstubAllGlobals();
  });

  const mountNavbarHarness = async (top = 0) => {
    const { useNavbar } = await import('./useNavbar');

    const TestComponent = defineComponent({
      setup() {
        return useNavbar();
      },
      template: `
        <div>
          <div ref="navWrapperRef" :data-top="${top}" data-height="64"></div>
          <nav data-testid="navigation-section" data-height="64"></nav>
        </div>
      `,
    });

    const wrapper = mount(TestComponent, {
      attachTo: document.body,
    });

    await nextTick();
    await nextTick();

    return wrapper;
  };

  it('does not enable sticky shadow at the top of the page on mobile', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 390,
      writable: true,
      configurable: true,
    });

    const wrapper = await mountNavbarHarness(0);

    expect((wrapper.vm as { isScrolled: boolean }).isScrolled).toBe(false);
    expect(document.documentElement.style.getPropertyValue('--nav-height')).toBe('64px');
    expect((wrapper.vm as { navHeight: number }).navHeight).toBe(64);
  });

  it('enables sticky mode after scrolling past the activation threshold', async () => {
    const wrapper = await mountNavbarHarness(0);

    Object.defineProperty(window, 'scrollY', {
      value: 24,
      writable: true,
      configurable: true,
    });

    window.dispatchEvent(new Event('scroll'));
    await nextTick();

    expect((wrapper.vm as { isScrolled: boolean }).isScrolled).toBe(true);
    expect(document.documentElement.style.getPropertyValue('--nav-height')).toBe('64px');
    expect(document.body.classList.contains('has-sticky-nav')).toBe(true);
  });

  it('keeps sticky mode stable during small upward scroll changes', async () => {
    const wrapper = await mountNavbarHarness(0);

    Object.defineProperty(window, 'scrollY', {
      value: 24,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('scroll'));
    await nextTick();

    Object.defineProperty(window, 'scrollY', {
      value: 8,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('scroll'));
    await nextTick();

    expect((wrapper.vm as { isScrolled: boolean }).isScrolled).toBe(true);
  });

  it('removes sticky body padding after returning to the top', async () => {
    const wrapper = await mountNavbarHarness(0);

    Object.defineProperty(window, 'scrollY', {
      value: 24,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('scroll'));
    await nextTick();

    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('scroll'));
    await nextTick();

    expect((wrapper.vm as { isScrolled: boolean }).isScrolled).toBe(false);
    expect(document.body.classList.contains('has-sticky-nav')).toBe(false);
    expect(document.documentElement.style.getPropertyValue('--nav-height')).toBe('0px');
  });

  it('keeps mobile nav fixed and only toggles scroll shadow', async () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 390,
      writable: true,
      configurable: true,
    });

    const wrapper = await mountNavbarHarness(0);

    Object.defineProperty(window, 'scrollY', {
      value: 24,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('scroll'));
    await nextTick();

    expect((wrapper.vm as { isScrolled: boolean }).isScrolled).toBe(true);
    expect(document.body.classList.contains('has-sticky-nav')).toBe(false);
    expect(document.documentElement.style.getPropertyValue('--nav-height')).toBe('64px');
    expect((wrapper.vm as { navHeight: number }).navHeight).toBe(64);
  });

  it('does not open the mega menu immediately on accidental hover', async () => {
    vi.useFakeTimers();

    const wrapper = await mountNavbarHarness(0);
    const vm = wrapper.vm as {
      activeMegaMenu: number | null;
      showMegaMenu: (id: number) => void;
    };

    vm.showMegaMenu(7);

    expect(vm.activeMegaMenu).toBe(null);

    vi.advanceTimersByTime(149);
    await nextTick();

    expect(vm.activeMegaMenu).toBe(null);

    vi.advanceTimersByTime(1);
    await nextTick();

    expect(vm.activeMegaMenu).toBe(7);
  });

  it('cancels a scheduled mega menu open when the pointer leaves quickly', async () => {
    vi.useFakeTimers();

    const wrapper = await mountNavbarHarness(0);
    const vm = wrapper.vm as {
      activeMegaMenu: number | null;
      showMegaMenu: (id: number) => void;
      hideMegaMenu: () => void;
    };

    vm.showMegaMenu(9);
    vm.hideMegaMenu();

    vi.runAllTimers();
    await nextTick();

    expect(vm.activeMegaMenu).toBe(null);
  });
});
