/**
 * Accessibility Utilities for ivo Electronics
 * 
 * WCAG 2.2 AA compliance helpers
 */

// ============================================
// FOCUS MANAGEMENT
// ============================================

/**
 * Trap focus within a modal/dialog
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown);
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Restore focus to previously focused element
 */
export function restoreFocus(previouslyFocused: HTMLElement | null): void {
  if (previouslyFocused) {
    previouslyFocused.focus();
  }
}

// ============================================
// SCREEN READER ANNOUNCEMENTS
// ============================================

let liveRegion: HTMLElement | null = null;

/**
 * Announce message to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  liveRegion.setAttribute('aria-live', priority);
  liveRegion.textContent = '';
  
  // Small delay to ensure announcement
  setTimeout(() => {
    if (liveRegion) {
      liveRegion.textContent = message;
    }
  }, 100);
}

/**
 * Announce cart updates
 */
export function announceCartUpdate(itemCount: number): void {
  announce(`${itemCount} ${itemCount === 1 ? 'item' : 'items'} in cart`);
}

/**
 * Announce checkout state changes
 */
export function announceCheckoutStep(step: number, totalSteps: number): void {
  announce(`Step ${step} of ${totalSteps}`);
}

// ============================================
// KEYBOARD NAVIGATION
// ============================================

/**
 * Handle keyboard interactions for custom components
 */
export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  options: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
  }
): void {
  switch (event.key) {
    case 'Enter':
      options.onEnter?.();
      break;
    case ' ':
      event.preventDefault();
      options.onSpace?.();
      break;
    case 'Escape':
      options.onEscape?.();
      break;
    case 'ArrowUp':
      event.preventDefault();
      options.onArrowUp?.();
      break;
    case 'ArrowDown':
      event.preventDefault();
      options.onArrowDown?.();
      break;
    case 'ArrowLeft':
      event.preventDefault();
      options.onArrowLeft?.();
      break;
    case 'ArrowRight':
      event.preventDefault();
      options.onArrowRight?.();
      break;
  }
}

// ============================================
// ACCESSIBILITY CHECKS
// ============================================

/**
 * Check if color contrast meets WCAG AA standards
 */
export function checkContrastRatio(foreground: string, background: string): {
  ratio: number;
  aa: boolean;
  aaa: boolean;
} {
  // Simplified contrast ratio calculation
  // In production, use a proper color contrast library
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);
  
  const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                (Math.min(fgLuminance, bgLuminance) + 0.05);
  
  return {
    ratio,
    aa: ratio >= 4.5, // Normal text
    aaa: ratio >= 7,  // Large text
  };
}

function getRelativeLuminance(color: string): number {
  // Simplified - in production, parse hex/rgb properly
  return 0.5; // Placeholder
}

/**
 * Check if touch target meets minimum size (44x44px)
 */
export function checkTouchTargetSize(width: number, height: number): boolean {
  return width >= 44 && height >= 44;
}

// ============================================
// REDUCED MOTION
// ============================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration based on motion preference
 */
export function getAnimationDuration(preferred: string, reduced: string = '0ms'): string {
  return prefersReducedMotion() ? reduced : preferred;
}

// ============================================
// FORM VALIDATION
// ============================================

/**
 * Generate accessible error message
 */
export function generateErrorMessage(field: string, error: string): string {
  return `${field}: ${error}`;
}

/**
 * Associate error message with input
 */
export function getAriaDescribedBy(inputId: string): string {
  return `${inputId}-error`;
}

// ============================================
// SKIP LINKS
// ============================================

/**
 * Create skip link for keyboard navigation
 */
export function createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.textContent = text;
  link.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded';
  
  return link;
}

// ============================================
// ARIA HELPERS
// ============================================

/**
 * Generate unique ID for ARIA attributes
 */
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if element is visible to screen readers
 */
export function isAccessible(element: HTMLElement): boolean {
  // Check if element is hidden
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') {
    return false;
  }
  
  // Check if element has display: none or visibility: hidden
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  
  return true;
}

// ============================================
// ACCESSIBILITY TESTING HELPERS
// ============================================

/**
 * Run basic accessibility checks on element
 */
export function runAccessibilityChecks(element: HTMLElement): {
  passed: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check for alt text on images
  const images = element.querySelectorAll('img');
  images.forEach(img => {
    if (!img.alt && img.alt !== '') {
      issues.push('Image missing alt text');
    }
  });
  
  // Check for labels on inputs
  const inputs = element.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const id = input.id;
    const label = element.querySelector(`label[for="${id}"]`);
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    
    if (!label && !ariaLabel && !ariaLabelledBy) {
      issues.push('Input missing label');
    }
  });
  
  // Check for heading hierarchy
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName[1]);
    if (level > lastLevel + 1 && lastLevel > 0) {
      issues.push(`Heading level skipped: h${lastLevel} to h${level}`);
    }
    lastLevel = level;
  });
  
  return {
    passed: issues.length === 0,
    issues,
  };
}
