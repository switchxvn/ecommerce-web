import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const MOBILE_STICKY_ACTIVATION_OFFSET = 12;
const STICKY_RELEASE_OFFSET = 4;
const MEGA_MENU_OPEN_DELAY = 150;
const MEGA_MENU_CLOSE_DELAY = 220;
const MOBILE_BREAKPOINT = 768;

export const useNavbar = () => {
  const isMobileMenuOpen = ref(false);
  const isScrolled = ref(false);
  const lastScrollPosition = ref(0);
  const navWrapperRef = ref<HTMLElement | null>(null);
  const initialNavPosition = ref<number>(0);
  const isInitialized = ref(false);
  const activeMegaMenu = ref<number | null>(null);
  const activeMobileMegaMenu = ref<number | null>(null);
  const navHeight = ref(0);
  const megaMenuOpenTimeout = ref<number | null>(null);
  const megaMenuCloseTimeout = ref<number | null>(null);

  const clearMegaMenuOpenTimeout = () => {
    if (megaMenuOpenTimeout.value) {
      clearTimeout(megaMenuOpenTimeout.value);
      megaMenuOpenTimeout.value = null;
    }
  };

  const clearMegaMenuCloseTimeout = () => {
    if (megaMenuCloseTimeout.value) {
      clearTimeout(megaMenuCloseTimeout.value);
      megaMenuCloseTimeout.value = null;
    }
  };

  const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
  };

  const toggleMobileMegaMenu = (itemId: number) => {
    activeMobileMegaMenu.value = activeMobileMegaMenu.value === itemId ? null : itemId;
  };

  const showMegaMenu = (id: number) => {
    clearMegaMenuCloseTimeout();

    if (activeMegaMenu.value === id) {
      clearMegaMenuOpenTimeout();
      return;
    }

    if (activeMegaMenu.value !== null) {
      clearMegaMenuOpenTimeout();
      activeMegaMenu.value = id;
      return;
    }

    clearMegaMenuOpenTimeout();
    megaMenuOpenTimeout.value = window.setTimeout(() => {
      activeMegaMenu.value = id;
      megaMenuOpenTimeout.value = null;
    }, MEGA_MENU_OPEN_DELAY);
  };

  const hideMegaMenu = () => {
    clearMegaMenuOpenTimeout();
    clearMegaMenuCloseTimeout();

    megaMenuCloseTimeout.value = window.setTimeout(() => {
      activeMegaMenu.value = null;
      megaMenuCloseTimeout.value = null;
    }, MEGA_MENU_CLOSE_DELAY);
  };

  const keepMegaMenu = () => {
    clearMegaMenuCloseTimeout();
  };

  const isMobileStickyMode = () =>
    typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

  const syncStickyHeight = () => {
    if (!navWrapperRef.value) {
      return;
    }

    navHeight.value = Math.round(navWrapperRef.value.offsetHeight);
    document.documentElement.style.setProperty('--nav-height', `${navHeight.value}px`);
    document.documentElement.style.setProperty(
      '--mobile-nav-offset',
      isMobileStickyMode() ? `${navHeight.value}px` : '0px'
    );
  };

  const setStickyState = (sticky: boolean) => {
    isScrolled.value = sticky;

    if (sticky || isMobileStickyMode()) {
      syncStickyHeight();
    } else {
      document.documentElement.style.setProperty('--nav-height', '0px');
    }

    updateBodyPadding();
  };

  const handleScroll = () => {
    if (!navWrapperRef.value || !isInitialized.value) return;
    
    const currentScrollPosition = Math.round(window.scrollY);

    if (isMobileStickyMode()) {
      isScrolled.value = currentScrollPosition > MOBILE_STICKY_ACTIVATION_OFFSET;
      lastScrollPosition.value = currentScrollPosition;
      return;
    }

    const stickyStart = Math.max(initialNavPosition.value, MOBILE_STICKY_ACTIVATION_OFFSET);
    const stickyRelease = Math.max(initialNavPosition.value - STICKY_RELEASE_OFFSET, 0);

    if (!isScrolled.value && currentScrollPosition > stickyStart) {
      setStickyState(true);
    } else if (isScrolled.value && currentScrollPosition <= stickyRelease) {
      setStickyState(false);
    }
    
    lastScrollPosition.value = currentScrollPosition;
  };

  const handleResize = () => {
    if (navWrapperRef.value) {
      const navRect = navWrapperRef.value.getBoundingClientRect();
      initialNavPosition.value = navRect.top + window.scrollY;

      if (isScrolled.value) {
        syncStickyHeight();
      }
    }

    updateBodyPadding();
  };

  const throttledHandleScroll = (() => {
    let frame: number | undefined;
    
    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      
      frame = requestAnimationFrame(() => {
        handleScroll();
      });
    };
  })();

  const updateBodyPadding = () => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle(
        'has-sticky-nav',
        isScrolled.value && !isMobileStickyMode()
      );
      document.documentElement.style.setProperty(
        '--mobile-nav-offset',
        isMobileStickyMode() ? `${navHeight.value}px` : '0px'
      );
    }
  };

  onMounted(() => {
    nextTick(() => {
      if (navWrapperRef.value) {
        const navRect = navWrapperRef.value.getBoundingClientRect();
        initialNavPosition.value = navRect.top + window.scrollY;
        isInitialized.value = true;
        syncStickyHeight();
        updateBodyPadding();
        handleScroll();
      }
    });
    
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    updateBodyPadding();
  });

  onUnmounted(() => {
    clearMegaMenuOpenTimeout();
    clearMegaMenuCloseTimeout();
    document.body.style.overflow = '';
    window.removeEventListener('scroll', throttledHandleScroll);
    window.removeEventListener('resize', handleResize);
    document.documentElement.style.removeProperty('--nav-height');
    document.documentElement.style.removeProperty('--mobile-nav-offset');
    document.documentElement.style.removeProperty('--mobile-menu-top');
    document.body.classList.remove('has-sticky-nav');
  });

  return {
    isMobileMenuOpen,
    isScrolled,
    navWrapperRef,
    activeMegaMenu,
    activeMobileMegaMenu,
    navHeight,
    toggleMobileMenu,
    toggleMobileMegaMenu,
    showMegaMenu,
    hideMegaMenu,
    keepMegaMenu,
    updateBodyPadding
  };
}; 
