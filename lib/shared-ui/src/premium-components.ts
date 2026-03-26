import { effects, colors, spacing, typography } from "./tokens";

export const kpiRibbon = {
  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    padding: "1rem 0",
  },
  item: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
    padding: "1.25rem",
    background: effects.glassmorphism.background,
    backdropFilter: effects.glassmorphism.backdropFilter,
    border: effects.glassmorphism.border,
    borderRadius: effects.borderRadius.md,
    transition: "all 0.2s ease",
  },
  itemHover: {
    background: colors.surface.glassHover,
    boxShadow: effects.shadow.md,
  },
  label: {
    color: colors.text.secondary,
    fontSize: "0.75rem",
    fontWeight: "500",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },
  value: {
    color: colors.text.primary,
    fontSize: "1.75rem",
    fontWeight: "700",
    lineHeight: "1.1",
    fontFamily: typography.fontFamily.display,
  },
  delta: {
    positive: {
      color: colors.status.success,
      fontSize: "0.75rem",
      fontWeight: "600",
    },
    negative: {
      color: colors.status.error,
      fontSize: "0.75rem",
      fontWeight: "600",
    },
    neutral: {
      color: colors.text.muted,
      fontSize: "0.75rem",
      fontWeight: "500",
    },
  },
  sparkline: {
    height: "2rem",
    width: "100%",
    marginTop: "0.5rem",
  },
} as const;

export const chartContainer = {
  wrapper: {
    background: effects.glassmorphism.background,
    backdropFilter: effects.glassmorphism.backdropFilter,
    border: effects.glassmorphism.border,
    borderRadius: effects.borderRadius.lg,
    padding: spacing.card.padding,
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: colors.text.primary,
    fontSize: "1rem",
    fontWeight: "600",
    fontFamily: typography.fontFamily.display,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: "0.75rem",
    marginTop: "0.25rem",
  },
  controls: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  },
  body: {
    flex: "1",
    minHeight: "200px",
    position: "relative" as const,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "0.75rem",
    borderTop: `1px solid ${colors.border.subtle}`,
    color: colors.text.muted,
    fontSize: "0.75rem",
  },
} as const;

export const dataTableShell = {
  container: {
    background: effects.glassmorphism.background,
    backdropFilter: effects.glassmorphism.backdropFilter,
    border: effects.glassmorphism.border,
    borderRadius: effects.borderRadius.lg,
    overflow: "hidden",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.25rem",
    borderBottom: `1px solid ${colors.border.subtle}`,
    gap: "1rem",
  },
  searchInput: {
    background: colors.background.tertiary,
    border: `1px solid ${colors.border.DEFAULT}`,
    borderRadius: effects.borderRadius.sm,
    padding: "0.5rem 0.75rem",
    color: colors.text.primary,
    fontSize: "0.875rem",
    outline: "none",
    minWidth: "200px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  headerRow: {
    borderBottom: `1px solid ${colors.border.DEFAULT}`,
  },
  headerCell: {
    padding: "0.75rem 1.25rem",
    color: colors.text.secondary,
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    textAlign: "left" as const,
    whiteSpace: "nowrap" as const,
    userSelect: "none" as const,
    cursor: "pointer",
  },
  row: {
    borderBottom: `1px solid ${colors.border.subtle}`,
    transition: "background 0.15s ease",
  },
  rowHover: {
    background: colors.surface.glass,
  },
  cell: {
    padding: "0.75rem 1.25rem",
    color: colors.text.primary,
    fontSize: "0.875rem",
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1.25rem",
    borderTop: `1px solid ${colors.border.subtle}`,
    color: colors.text.secondary,
    fontSize: "0.75rem",
  },
} as const;

export const statusPill = {
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0.25rem 0.75rem",
    borderRadius: effects.borderRadius.full,
    fontSize: "0.75rem",
    fontWeight: "600",
    letterSpacing: "0.02em",
    lineHeight: "1",
    whiteSpace: "nowrap" as const,
  },
  variants: {
    success: {
      background: "hsla(160, 80%, 55%, 0.15)",
      color: colors.status.success,
      border: "1px solid hsla(160, 80%, 55%, 0.25)",
    },
    warning: {
      background: "hsla(40, 95%, 60%, 0.15)",
      color: colors.status.warning,
      border: "1px solid hsla(40, 95%, 60%, 0.25)",
    },
    error: {
      background: "hsla(350, 80%, 60%, 0.15)",
      color: colors.status.error,
      border: "1px solid hsla(350, 80%, 60%, 0.25)",
    },
    info: {
      background: "hsla(210, 90%, 60%, 0.15)",
      color: colors.status.info,
      border: "1px solid hsla(210, 90%, 60%, 0.25)",
    },
    neutral: {
      background: "hsla(0, 0%, 100%, 0.08)",
      color: colors.text.secondary,
      border: `1px solid ${colors.border.DEFAULT}`,
    },
  },
  dot: {
    width: "0.375rem",
    height: "0.375rem",
    borderRadius: "50%",
  },
} as const;

export const alertBanner = {
  base: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
    padding: "1rem 1.25rem",
    borderRadius: effects.borderRadius.md,
    fontSize: "0.875rem",
    lineHeight: "1.5",
  },
  variants: {
    info: {
      background: "hsla(210, 90%, 60%, 0.1)",
      border: "1px solid hsla(210, 90%, 60%, 0.2)",
      color: colors.text.primary,
    },
    success: {
      background: "hsla(160, 80%, 55%, 0.1)",
      border: "1px solid hsla(160, 80%, 55%, 0.2)",
      color: colors.text.primary,
    },
    warning: {
      background: "hsla(40, 95%, 60%, 0.1)",
      border: "1px solid hsla(40, 95%, 60%, 0.2)",
      color: colors.text.primary,
    },
    error: {
      background: "hsla(350, 80%, 60%, 0.1)",
      border: "1px solid hsla(350, 80%, 60%, 0.2)",
      color: colors.text.primary,
    },
  },
  icon: {
    flexShrink: 0,
    width: "1.25rem",
    height: "1.25rem",
    marginTop: "0.125rem",
  },
  content: {
    flex: "1",
  },
  title: {
    fontWeight: "600",
    marginBottom: "0.25rem",
  },
  dismiss: {
    flexShrink: 0,
    background: "none",
    border: "none",
    color: colors.text.muted,
    cursor: "pointer",
    padding: "0.25rem",
    borderRadius: effects.borderRadius.sm,
    transition: "color 0.15s ease",
  },
} as const;

export const modalDrawer = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: colors.background.overlay,
    backdropFilter: "blur(4px)",
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: colors.background.secondary,
    border: `1px solid ${colors.border.DEFAULT}`,
    borderRadius: effects.borderRadius.xl,
    boxShadow: effects.shadow.xl,
    width: "100%",
    maxWidth: "32rem",
    maxHeight: "85vh",
    overflow: "auto",
  },
  drawer: {
    position: "fixed" as const,
    top: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    maxWidth: "28rem",
    background: colors.background.secondary,
    border: `1px solid ${colors.border.DEFAULT}`,
    boxShadow: effects.shadow.xl,
    zIndex: 51,
    overflow: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem",
    borderBottom: `1px solid ${colors.border.subtle}`,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: "1.125rem",
    fontWeight: "600",
    fontFamily: typography.fontFamily.display,
  },
  body: {
    padding: "1.5rem",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    padding: "1.25rem 1.5rem",
    borderTop: `1px solid ${colors.border.subtle}`,
  },
} as const;

export const skeletonLoader = {
  base: {
    background: `linear-gradient(90deg, ${colors.surface.glass} 25%, ${colors.surface.glassHover} 50%, ${colors.surface.glass} 75%)`,
    backgroundSize: "200% 100%",
    borderRadius: effects.borderRadius.sm,
  },
  text: {
    height: "0.875rem",
    width: "100%",
    borderRadius: effects.borderRadius.sm,
    marginBottom: "0.5rem",
  },
  heading: {
    height: "1.5rem",
    width: "60%",
    borderRadius: effects.borderRadius.sm,
    marginBottom: "0.75rem",
  },
  avatar: {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: effects.borderRadius.full,
  },
  card: {
    height: "8rem",
    borderRadius: effects.borderRadius.lg,
  },
  chart: {
    height: "12rem",
    borderRadius: effects.borderRadius.lg,
  },
  row: {
    height: "3rem",
    borderRadius: effects.borderRadius.sm,
    marginBottom: "0.5rem",
  },
} as const;

export const premiumFormElements = {
  inputGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.375rem",
  },
  label: {
    color: colors.text.secondary,
    fontSize: "0.8125rem",
    fontWeight: "500",
    letterSpacing: "0.01em",
  },
  input: {
    background: colors.background.tertiary,
    border: `1px solid ${colors.border.DEFAULT}`,
    borderRadius: effects.borderRadius.md,
    padding: "0.625rem 0.875rem",
    color: colors.text.primary,
    fontSize: "0.875rem",
    lineHeight: "1.5",
    outline: "none",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    width: "100%",
  },
  inputFocus: {
    borderColor: colors.primary.DEFAULT,
    boxShadow: `0 0 0 3px ${colors.primary.muted}`,
  },
  inputError: {
    borderColor: colors.status.error,
    boxShadow: "0 0 0 3px hsla(350, 80%, 60%, 0.15)",
  },
  select: {
    background: colors.background.tertiary,
    border: `1px solid ${colors.border.DEFAULT}`,
    borderRadius: effects.borderRadius.md,
    padding: "0.625rem 2rem 0.625rem 0.875rem",
    color: colors.text.primary,
    fontSize: "0.875rem",
    appearance: "none" as const,
    cursor: "pointer",
    width: "100%",
  },
  textarea: {
    background: colors.background.tertiary,
    border: `1px solid ${colors.border.DEFAULT}`,
    borderRadius: effects.borderRadius.md,
    padding: "0.625rem 0.875rem",
    color: colors.text.primary,
    fontSize: "0.875rem",
    lineHeight: "1.6",
    resize: "vertical" as const,
    minHeight: "5rem",
    width: "100%",
  },
  checkbox: {
    wrapper: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      cursor: "pointer",
    },
    box: {
      width: "1.125rem",
      height: "1.125rem",
      borderRadius: effects.borderRadius.sm,
      border: `2px solid ${colors.border.strong}`,
      transition: "all 0.15s ease",
    },
    boxChecked: {
      background: colors.primary.DEFAULT,
      borderColor: colors.primary.DEFAULT,
    },
  },
  helperText: {
    color: colors.text.muted,
    fontSize: "0.75rem",
    marginTop: "0.25rem",
  },
  errorText: {
    color: colors.status.error,
    fontSize: "0.75rem",
    marginTop: "0.25rem",
  },
  button: {
    primary: {
      background: effects.gradient.primary,
      color: colors.text.primary,
      border: "none",
      borderRadius: effects.borderRadius.md,
      padding: "0.625rem 1.25rem",
      fontSize: "0.875rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "opacity 0.15s ease, transform 0.1s ease",
    },
    secondary: {
      background: "transparent",
      color: colors.text.primary,
      border: `1px solid ${colors.border.strong}`,
      borderRadius: effects.borderRadius.md,
      padding: "0.625rem 1.25rem",
      fontSize: "0.875rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.15s ease",
    },
    ghost: {
      background: "transparent",
      color: colors.text.secondary,
      border: "none",
      borderRadius: effects.borderRadius.md,
      padding: "0.625rem 1rem",
      fontSize: "0.875rem",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.15s ease",
    },
    danger: {
      background: colors.status.error,
      color: colors.text.primary,
      border: "none",
      borderRadius: effects.borderRadius.md,
      padding: "0.625rem 1.25rem",
      fontSize: "0.875rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "opacity 0.15s ease",
    },
  },
} as const;
