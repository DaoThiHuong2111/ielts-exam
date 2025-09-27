/**
 * Design Tokens for consistent styling across the application
 */

export const fontSizes = {
  xs: 'text-xs',        // 0.75rem - 12px
  sm: 'text-sm',        // 0.875rem - 14px  
  base: 'text-base',    // 1rem - 16px (default)
  md: 'text-lg',        // 1.125rem - 18px
  lg: 'text-xl',        // 1.25rem - 20px
  xl: 'text-2xl',       // 1.5rem - 24px
  '2xl': 'text-3xl',    // 2rem - 32px
  '3xl': 'text-4xl',    // 2.5rem - 40px
  '4xl': 'text-5xl',    // 3rem - 48px
  '5xl': 'text-6xl',    // 3.75rem - 60px
} as const

export const colors = {
  // Brand colors
  primary: 'text-brand-primary',
  secondary: 'text-brand-secondary', 
  accent: 'text-brand-accent',
  muted: 'text-brand-muted',
  
  // Background colors
  primaryBg: 'bg-brand-primary',
  secondaryBg: 'bg-brand-secondary',
  accentBg: 'bg-brand-accent',
  mutedBg: 'bg-brand-muted',
  
  // Border colors
  primaryBorder: 'border-brand-primary',
  secondaryBorder: 'border-brand-secondary',
  accentBorder: 'border-brand-accent',
  mutedBorder: 'border-brand-muted',
} as const

export const spacing = {
  xs: 'p-1',      // 4px
  sm: 'p-2',      // 8px
  base: 'p-4',    // 16px
  md: 'p-6',      // 24px
  lg: 'p-8',      // 32px
  xl: 'p-12',     // 48px
} as const

/**
 * Semantic component sizes
 */
export const componentSizes = {
  button: {
    sm: `${fontSizes.sm} px-3 py-1.5`,
    base: `${fontSizes.base} px-4 py-2`,
    lg: `${fontSizes.lg} px-6 py-3`,
  },
  
  heading: {
    h1: fontSizes['3xl'],
    h2: fontSizes['2xl'], 
    h3: fontSizes.xl,
    h4: fontSizes.lg,
    h5: fontSizes.md,
    h6: fontSizes.base,
  },
  
  logo: {
    sm: 'w-16 h-16',
    base: 'w-20 h-20',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  },
  
  icon: {
    sm: 'w-4 h-4',
    base: 'w-5 h-5', 
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  }
} as const

/**
 * Typography presets
 */
export const typography = {
  // Body text
  body: `${fontSizes.base} text-foreground`,
  bodyLarge: `${fontSizes.md} text-foreground`,
  bodySmall: `${fontSizes.sm} text-foreground`,
  
  // Navigation
  navItem: `${fontSizes.base} font-medium text-gray-800 hover:text-orange-500 transition-colors`,
  navItemMobile: `${fontSizes.base} font-medium text-gray-700 hover:text-orange-500 transition-colors`,
  
  // Buttons
  buttonPrimary: `${fontSizes.base} font-semibold text-black`,
  buttonSecondary: `${fontSizes.base} font-medium`,
  
  // Headings
  heading1: `${fontSizes['3xl']} font-bold`,
  heading2: `${fontSizes['2xl']} font-bold`, 
  heading3: `${fontSizes.xl} font-semibold`,
  heading4: `${fontSizes.lg} font-semibold`,
  
  // Footer
  footerHeading: `${fontSizes.xl} font-semibold text-slate-900 mb-4`,
  footerLink: `${fontSizes.base} hover:text-orange-500 transition-colors`,
  footerCopyright: `${fontSizes.base} text-slate-500`,
} as const

/**
 * Utility function to combine classes
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ')
}