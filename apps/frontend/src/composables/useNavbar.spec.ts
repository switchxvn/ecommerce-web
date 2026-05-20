import { defineComponent, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useNavbar', () => {
  const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
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

    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      const top = Number(this.getAttribute('data-top') ?? 0);

      return {
        top,
        left: 0,
        right: 0,
        bottom: top + 64,
        width: 320,
        height: 64,
        x: 0,
        y: top,
        toJSON: () => ({}),
      } as DOMRect;
    };

    document.querySelector = ((selectors: string) => {
      if (selectors === '.navigation-section') {
        return originalQuerySelector('[data-testid="navigation-section"]');
      }

      return originalQuerySelector(selectors);
    }) as typeof document.querySelector;
  });

  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
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
          <div ref="navWrapperRef" :data-top="${top}"></div>
          <nav data-testid="navigation-section"></nav>
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

  it('does not enable sticky mode at the top of the page on mobile', async () => {
    const wrapper = await mountNavbarHarness(0);

    expect((wrapper.vm as { isScrolled: boolean }).isScrolled).toBe(false);
    expect(document.documentElement.style.getPropertyValue('--nav-height')).toBe('');
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
    expect(document.documentElement.style.getPropertyValue('--nav-height')).toBe('0px');
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
});
