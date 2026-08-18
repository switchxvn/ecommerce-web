interface ModalRegistration {
  element: () => HTMLElement | null;
  focusInitial: () => void;
  onEscape: () => void;
}

interface ModalEntry extends ModalRegistration {
  token: symbol;
}

const stack: ModalEntry[] = [];
let originalBodyOverflow = '';
let originalFocus: HTMLElement | null = null;
let fallbackId = 0;

const focusableElements = (entry: ModalEntry) =>
  Array.from(
    entry
      .element()
      ?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []
  ).filter((element) => !element.hasAttribute('disabled'));

const handleKeydown = (event: KeyboardEvent) => {
  const top = stack.at(-1);
  if (!top) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    top.onEscape();
    return;
  }
  if (event.key !== 'Tab') return;

  const elements = focusableElements(top);
  if (elements.length === 0) {
    event.preventDefault();
    return;
  }

  const first = elements[0];
  const last = elements[elements.length - 1];
  if (!top.element()?.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

export const modalTitleId = (instanceUid?: number) =>
  `advertising-popup-title-${instanceUid ?? `fallback-${++fallbackId}`}`;

export const registerModal = (registration: ModalRegistration) => {
  if (stack.length === 0) {
    originalBodyOverflow = document.body.style.overflow;
    originalFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeydown);
  }

  const entry = { ...registration, token: Symbol('modal-stack-entry') };
  stack.push(entry);
  entry.focusInitial();
  return entry.token;
};

export const unregisterModal = (token: symbol | null) => {
  if (!token) return;
  const index = stack.findIndex((entry) => entry.token === token);
  if (index === -1) return;

  const wasTopmost = index === stack.length - 1;
  stack.splice(index, 1);

  if (stack.length === 0) {
    document.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = originalBodyOverflow;
    if (originalFocus?.isConnected) originalFocus.focus();
    originalFocus = null;
  } else if (wasTopmost) {
    stack.at(-1)?.focusInitial();
  }
};
