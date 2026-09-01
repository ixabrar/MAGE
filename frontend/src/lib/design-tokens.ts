export const colors = {
  primary: "#1b1938",
  primaryDeep: "#0e0c1f",
  onPrimary: "#ffffff",
  ink: "#292827",
  inkMute: "#73706d",
  inkFaint: "#9a9794",
  canvas: "#ffffff",
  canvasSoft: "#fafaf8",
  surfaceVioletSoft: "#c9b4fa",
  surfaceTealDeep: "#0e3030",
  surfaceTealMid: "#155555",
  hairline: "#e8e4dd",
  hairlineDark: "#3f3a52",
  onDarkMute: "#bcbac9",
  onDarkFaint: "#5a5772",
  muted: "#73706d",
  foreground: "#292827",
} as const;

export const typography = {
  displayXxl: {
    fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "64px",
    fontWeight: 540,
    lineHeight: 0.96,
    letterSpacing: 0,
  },
  displayXl: {
    fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "48px",
    fontWeight: 460,
    lineHeight: 0.96,
    letterSpacing: "-1.32px",
  },
  displayLg: {
    fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "28px",
    fontWeight: 540,
    lineHeight: 1.14,
    letterSpacing: "-0.63px",
  },
  displayMd: {
    fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "22px",
    fontWeight: 460,
    lineHeight: 1.1,
    letterSpacing: "-0.315px",
  },
  headingLg: {
    fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "20px",
    fontWeight: 460,
    lineHeight: 1.2,
    letterSpacing: "-0.4px",
  },
  bodyLg: {
    fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "18px",
    fontWeight: 540,
    lineHeight: 1.5,
    letterSpacing: "-0.135px",
  },
  bodyMd: {
    fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "16px",
    fontWeight: 460,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  bodyStrong: {
    fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "18.72px",
    fontWeight: 700,
    lineHeight: 1.5,
    letterSpacing: 0,
  },
  buttonMd: {
    fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "16px",
    fontWeight: 700,
    lineHeight: 1.0,
    letterSpacing: 0,
  },
  buttonCap: {
    fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1.0,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "14px",
    fontWeight: 460,
    lineHeight: 1.4,
    letterSpacing: 0,
  },
  micro: {
    fontFamily: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "12px",
    fontWeight: 540,
    lineHeight: 1.4,
    letterSpacing: 0,
  },
} as const;

export const spacing = {
  xxs: "2px",
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  xxl: "32px",
  huge: "64px",
} as const;

export const rounded = {
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;

export const tokens = {
  colors,
  typography,
  spacing,
  rounded,
  font: {
    sans: "'Inter Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
  },
};

// Backward-compatibility aliases for tokens used across components
// TODO: replace usages with `font.sans` / new color tokens from DESIGN-superhuman.md
export const aliases = {
  colors: {
    ...colors,
    canvas: colors.canvas,
    foreground: colors.ink,
    muted: colors.inkMute,
    hairline: colors.hairline,
    hairlineDim: colors.hairline,
  },
  font: {
    ...tokens.font,
  },
} as const;
