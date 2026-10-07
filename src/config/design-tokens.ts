/**
 * Design Tokens for ivo Electronics
 * 
 * Semantic design tokens for consistent theming.
 * Based on Figma UI Kit specifications.
 */

export const designTokens = {
  // ============================================
  // COLOR TOKENS
  // ============================================
  colors: {
    // Brand colors
    brand: {
      primary: '#1a1a1a',
      secondary: '#666666',
      accent: '#ff6b6b',
    },

    // Surface colors
    surface: {
      background: '#ffffff',
      surface: '#f8f8f8',
      elevated: '#ffffff',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },

    // Text colors
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
      muted: '#999999',
      inverse: '#ffffff',
      disabled: '#cccccc',
    },

    // Border colors
    border: {
      default: '#e0e0e0',
      light: '#f0f0f0',
      focus: '#1a1a1a',
      error: '#ef4444',
      success: '#10b981',
    },

    // Status colors
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },

    // Interactive colors
    interactive: {
      primary: '#1a1a1a',
      primaryHover: '#333333',
      primaryActive: '#000000',
      secondary: '#ffffff',
      secondaryHover: '#f8f8f8',
      secondaryActive: '#f0f0f0',
      disabled: '#e0e0e0',
    },
  },

  // ============================================
  // TYPOGRAPHY TOKENS
  // ============================================
  typography: {
    fontFamily: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'JetBrains Mono, "Fira Code", monospace',
    },

    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },

    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },

    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  // ============================================
  // SPACING TOKENS
  // ============================================
  spacing: {
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    8: '2rem',        // 32px
    10: '2.5rem',     // 40px
    12: '3rem',       // 48px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
  },

  // ============================================
  // LAYOUT TOKENS
  // ============================================
  layout: {
    maxWidth: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },

    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },

    containerPadding: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
    },
  },

  // ============================================
  // BORDER & SHADOW TOKENS
  // ============================================
  borders: {
    radius: {
      none: '0',
      sm: '0.25rem',    // 4px
      md: '0.375rem',   // 6px
      lg: '0.5rem',     // 8px
      xl: '0.75rem',    // 12px
      '2xl': '1rem',    // 16px
      '3xl': '1.5rem',  // 24px
      full: '9999px',
    },

    width: {
      0: '0',
      1: '1px',
      2: '2px',
      4: '4px',
    },
  },

  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  // ============================================
  // MOTION TOKENS
  // ============================================
  motion: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
    },

    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // ============================================
  // Z-INDEX TOKENS
  // ============================================
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    toast: 1500,
    tooltip: 1600,
  },

  // ============================================
  // PRODUCT IMAGE TOKENS
  // ============================================
  productImages: {
    aspectRatio: '4/5', // Fashion-style portrait
    sizes: {
      thumbnail: '100px',
      small: '200px',
      medium: '400px',
      large: '600px',
      xlarge: '800px',
    },
    objectFit: 'cover',
    fallback: '/images/product-placeholder.svg',
  },
} as const;

// ============================================
// TOKEN HELPERS
// ============================================

export type ColorToken = keyof typeof designTokens.colors;
export type SpacingToken = keyof typeof designTokens.spacing;
export type FontSizeToken = keyof typeof designTokens.typography.fontSize;

/**
 * Get color value from token
 */
export function getColor(category: ColorToken, shade: string): string {
  const colors = designTokens.colors[category] as any;
  return colors[shade] || colors;
}

/**
 * Get spacing value from token
 */
export function getSpacing(token: SpacingToken): string {
  return designTokens.spacing[token];
}

/**
 * Get font size value from token
 */
export function getFontSize(token: FontSizeToken): string {
  return designTokens.typography.fontSize[token];
}

/**
 * Generate CSS custom properties from tokens
 */
export function generateCSSVariables(): string {
  const vars: string[] = [];

  // Colors
  Object.entries(designTokens.colors).forEach(([category, shades]) => {
    Object.entries(shades as object).forEach(([shade, value]) => {
      vars.push(`--color-${category}-${shade}: ${value};`);
    });
  });

  // Spacing
  Object.entries(designTokens.spacing).forEach(([token, value]) => {
    vars.push(`--spacing-${token}: ${value};`);
  });

  // Typography
  Object.entries(designTokens.typography.fontSize).forEach(([token, value]) => {
    vars.push(`--font-size-${token}: ${value};`);
  });

  // Borders
  Object.entries(designTokens.borders.radius).forEach(([token, value]) => {
    vars.push(`--radius-${token}: ${value};`);
  });

  // Shadows
  Object.entries(designTokens.shadows).forEach(([token, value]) => {
    vars.push(`--shadow-${token}: ${value};`);
  });

  return vars.join('\n  ');
}
