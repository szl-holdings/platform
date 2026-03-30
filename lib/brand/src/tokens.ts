export interface BrandTokens {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
    surface: string;
    surfaceHover: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    gradient: {
      primary: string;
      subtle: string;
      text: string;
    };
    semantic: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  typography: {
    displayFont: string;
    bodyFont: string;
    monoFont: string;
    displayWeight: string;
    headingWeight: string;
    bodyWeight: string;
  };
  logo: {
    initials: string;
    shape: "rounded" | "circle" | "square";
    iconType?: string;
  };
  motion: {
    duration: string;
    easing: string;
    stagger: number;
  };
  ui: {
    borderRadius: string;
    mode: "light" | "dark";
  };
}

export type BrandSlug =
  | "szl-holdings"
  | "vessels"
  | "inca"
  | "carlota-jo"
  | "stephen"
  | "firestorm"
  | "dreamscape"
  | "terra"
  | "lyte"
  | "msp"
  | "alloy";
