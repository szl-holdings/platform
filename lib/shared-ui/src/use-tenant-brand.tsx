import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface TenantBranding {
  id: number;
  tenantId: number;
  companyName: string | null;
  tagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  sidebarHeaderText: string | null;
  customDomainLabel: string | null;
  emailFromName: string | null;
  emailFooterText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantBrandConfig {
  companyName: string;
  tagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  sidebarHeaderText: string;
  customDomainLabel: string | null;
  emailFromName: string;
  emailFooterText: string | null;
  isCustomized: boolean;
}

const DEFAULT_BRAND: TenantBrandConfig = {
  companyName: "SZL Holdings",
  tagline: null,
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#6366f1",
  accentColor: "#7c3aed",
  sidebarHeaderText: "SZL Holdings",
  customDomainLabel: null,
  emailFromName: "SZL Holdings",
  emailFooterText: null,
  isCustomized: false,
};

export function mergeBranding(branding: TenantBranding | null): TenantBrandConfig {
  if (!branding) return DEFAULT_BRAND;
  return {
    companyName: branding.companyName ?? DEFAULT_BRAND.companyName,
    tagline: branding.tagline ?? null,
    logoUrl: branding.logoUrl ?? null,
    faviconUrl: branding.faviconUrl ?? null,
    primaryColor: branding.primaryColor ?? DEFAULT_BRAND.primaryColor,
    accentColor: branding.accentColor ?? DEFAULT_BRAND.accentColor,
    sidebarHeaderText: branding.sidebarHeaderText ?? branding.companyName ?? DEFAULT_BRAND.sidebarHeaderText,
    customDomainLabel: branding.customDomainLabel ?? null,
    emailFromName: branding.emailFromName ?? branding.companyName ?? DEFAULT_BRAND.emailFromName,
    emailFooterText: branding.emailFooterText ?? null,
    isCustomized: true,
  };
}

interface TenantBrandContextValue {
  brand: TenantBrandConfig;
  rawBranding: TenantBranding | null;
  isLoading: boolean;
  error: string | null;
  previewBrand: TenantBrandConfig | null;
  setPreview: (branding: Partial<TenantBrandConfig> | null) => void;
  activeBrand: TenantBrandConfig;
}

const TenantBrandContext = createContext<TenantBrandContextValue>({
  brand: DEFAULT_BRAND,
  rawBranding: null,
  isLoading: false,
  error: null,
  previewBrand: null,
  setPreview: () => {},
  activeBrand: DEFAULT_BRAND,
});

export interface TenantBrandProviderProps {
  children: ReactNode;
  azureTenantId?: string | null;
  apiBase?: string;
  initialBranding?: TenantBranding | null;
}

export function TenantBrandProvider({
  children,
  azureTenantId,
  apiBase = "",
  initialBranding = null,
}: TenantBrandProviderProps) {
  const [rawBranding, setRawBranding] = useState<TenantBranding | null>(initialBranding);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewBrand, setPreviewBrand] = useState<TenantBrandConfig | null>(null);

  useEffect(() => {
    if (!azureTenantId) return;

    setIsLoading(true);
    const url = `${apiBase}/api/tenant-branding/${encodeURIComponent(azureTenantId)}`;
    fetch(url)
      .then(r => r.json())
      .then((json) => {
        const b = json?.data?.branding ?? json?.branding ?? null;
        setRawBranding(b);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load branding");
      })
      .finally(() => setIsLoading(false));
  }, [azureTenantId, apiBase]);

  const brand = mergeBranding(rawBranding);

  const setPreview = useCallback((partial: Partial<TenantBrandConfig> | null) => {
    if (!partial) {
      setPreviewBrand(null);
    } else {
      setPreviewBrand(prev => ({ ...(prev ?? brand), ...partial }));
    }
  }, [brand]);

  const activeBrand = previewBrand ?? brand;

  return (
    <TenantBrandContext.Provider value={{ brand, rawBranding, isLoading, error, previewBrand, setPreview, activeBrand }}>
      {children}
    </TenantBrandContext.Provider>
  );
}

export function useTenantBrand(): TenantBrandContextValue {
  return useContext(TenantBrandContext);
}

export function useTenantCSSVars(): React.CSSProperties {
  const { activeBrand } = useTenantBrand();
  return {
    "--tenant-primary": activeBrand.primaryColor,
    "--tenant-accent": activeBrand.accentColor,
    "--tenant-company": `"${activeBrand.companyName}"`,
  } as React.CSSProperties;
}

export { DEFAULT_BRAND };
