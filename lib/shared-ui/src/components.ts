import { effects, colors, spacing } from "./tokens";

export const glassCard = {
  base: {
    background: effects.glassmorphism.background,
    backdropFilter: effects.glassmorphism.backdropFilter,
    border: effects.glassmorphism.border,
    borderRadius: effects.borderRadius.lg,
    padding: spacing.card.padding,
  },
  elevated: {
    background: effects.glassmorphismStrong.background,
    backdropFilter: effects.glassmorphismStrong.backdropFilter,
    border: effects.glassmorphismStrong.border,
    borderRadius: effects.borderRadius.lg,
    padding: spacing.card.padding,
    boxShadow: effects.shadow.lg,
  },
  interactive: {
    background: effects.glassmorphism.background,
    backdropFilter: effects.glassmorphism.backdropFilter,
    border: effects.glassmorphism.border,
    borderRadius: effects.borderRadius.lg,
    padding: spacing.card.padding,
    transition: "all 0.2s ease",
    cursor: "pointer",
    _hover: {
      background: colors.surface.glassHover,
      boxShadow: effects.shadow.md,
    },
  },
} as const;

export const dashboardLayout = {
  container: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    minHeight: "100vh",
    background: colors.background.primary,
  },
  sidebar: {
    background: colors.background.secondary,
    borderRight: `1px solid ${colors.border.DEFAULT}`,
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  main: {
    padding: spacing.page.x,
    overflow: "auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "2rem",
    borderBottom: `1px solid ${colors.border.subtle}`,
    marginBottom: "2rem",
  },
} as const;

export const setupLayout = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: effects.gradient.meshDark,
    padding: spacing.page.x,
  },
  card: {
    ...glassCard.elevated,
    maxWidth: "480px",
    width: "100%",
    textAlign: "center" as const,
  },
  title: {
    color: colors.text.primary,
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "0.5rem",
  },
  description: {
    color: colors.text.secondary,
    fontSize: "0.875rem",
    lineHeight: "1.5",
    marginBottom: "1.5rem",
  },
} as const;

export const emptyState = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 2rem",
    textAlign: "center" as const,
  },
  icon: {
    width: "4rem",
    height: "4rem",
    color: colors.text.muted,
    marginBottom: "1rem",
    opacity: 0.5,
  },
  title: {
    color: colors.text.primary,
    fontSize: "1.125rem",
    fontWeight: "600",
    marginBottom: "0.5rem",
  },
  description: {
    color: colors.text.secondary,
    fontSize: "0.875rem",
    maxWidth: "20rem",
  },
  action: {
    marginTop: "1.5rem",
    background: effects.gradient.primary,
    color: colors.text.primary,
    border: "none",
    borderRadius: effects.borderRadius.md,
    padding: "0.625rem 1.25rem",
    fontSize: "0.875rem",
    fontWeight: "500",
    cursor: "pointer",
  },
} as const;

export const statCard = {
  container: {
    ...glassCard.base,
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  },
  label: {
    color: colors.text.secondary,
    fontSize: "0.75rem",
    fontWeight: "500",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  value: {
    color: colors.text.primary,
    fontSize: "2rem",
    fontWeight: "700",
    lineHeight: "1",
  },
  trend: {
    up: { color: colors.status.success, fontSize: "0.75rem" },
    down: { color: colors.status.error, fontSize: "0.75rem" },
    neutral: { color: colors.text.muted, fontSize: "0.75rem" },
  },
} as const;
