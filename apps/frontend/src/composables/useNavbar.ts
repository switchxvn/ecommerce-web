import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const MOBILE_STICKY_ACTIVATION_OFFSET = 12;
const STICKY_RELEASE_OFFSET = 4;

export const useNavbar = () => {
  const isMobileMenuOpen = ref(false);
  const isScrolled = ref(false);
  const lastScrollPosition = ref(0);
  const navWrapperRef = ref<HTMLElement | null>(null);
  const initialNavPosition = ref<number>(0);
  const isInitialized = ref(false);
  const activeMegaMenu = ref<number | null>(null);
  const activeMobileMegaMenu = ref<number | null>(null);
  const megaMenuTimeout = ref<number | null>(null);

  const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
  };

  const toggleMobileMegaMenu = (itemId: number) => {
    activeMobileMegaMenu.value = activeMobileMegaMenu.value === itemId ? null : itemId;
  };

  const showMegaMenu = (id: number) => {
    if (megaMenuTimeout.value) {
      clearTimeout(megaMenuTimeout.value);
      megaMenuTimeout.value = null;
    }
    activeMegaMenu.value = id;
  };

  const hideMegaMenu = () => {
    megaMenuTimeout.value = window.setTimeout(() => {
      activeMegaMenu.value = null;
    }, 300);
  };

  const keepMegaMenu = () => {
    if (megaMenuTimeout.value) {
      clearTimeout(megaMenuTimeout.value);
      megaMenuTimeout.value = null;
    }
  };

  const handleScroll = () => {
    if (!navWrapperRef.value || !isInitialized.value) return;
    
    const currentScrollPosition = Math.round(window.scrollY);

    const stickyStart = Math.max(initialNavPosition.value, MOBILE_STICKY_ACTIVATION_OFFSET);
    const stickyRelease = Math.max(initialNavPosition.value - STICKY_RELEASE_OFFSET, 0);

    if (!isScrolled.value && currentScrollPosition > stickyStart) {
      isScrolled.value = true;
      nextTick(() => {
        const nav = document.querySelector('.navigation-section') as HTMLElement;
        if (nav) {
          const navHeight = Math.round(nav.offsetHeight);
          document.documentElement.style.setProperty('--nav-height', `${navHeight}px`);
        }
      });
    } else if (isScrolled.value && currentScrollPosition <= stickyRelease) {
      isScrolled.value = false;
      document.documentElement.style.setProperty('--nav-height', '0px');
    }
    
    lastScrollPosition.value = currentScrollPosition;
  };

  const handleResize = () => {
    if (navWrapperRef.value) {
      const navRect = navWrapperRef.value.getBoundingClientRect();
      initialNavPosition.value = navRect.top + window.scrollY;
    }
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
      document.body.classList.toggle('has-sticky-nav', isScrolled.value);
    }
  };

  onMounted(() => {
    nextTick(() => {
      if (navWrapperRef.value) {
        const navRect = navWrapperRef.value.getBoundingClientRect();
        initialNavPosition.value = navRect.top + window.scrollY;
        isInitialized.value = true;
        handleScroll();
      }
    });
    
    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    updateBodyPadding();
  });

  onUnmounted(() => {
    document.body.style.overflow = '';
    window.removeEventListener('scroll', throttledHandleScroll);
    window.removeEventListener('resize', handleResize);
    document.documentElement.style.removeProperty('--nav-height');
    document.documentElement.style.removeProperty('--mobile-menu-top');
    document.body.classList.remove('has-sticky-nav');
  });

  return {
    isMobileMenuOpen,
    isScrolled,
    navWrapperRef,
    activeMegaMenu,
    activeMobileMegaMenu,
    toggleMobileMenu,
    toggleMobileMegaMenu,
    showMegaMenu,
    hideMegaMenu,
    keepMegaMenu,
    updateBodyPadding
  };
}; 
