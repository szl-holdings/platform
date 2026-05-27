import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { Button } from '@szl-holdings/shared-ui/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@szl-holdings/shared-ui/ui/sheet';
import { Sigma } from 'lucide-react';
import type { ReactNode } from 'react';

interface ShowTheMathProps {
  formulaId: string;
  label: string;
  expression: string;
  inputs: Record<string, number | string | null | undefined>;
  result: number | string;
  thesisRef?: string;
  pkg?: string;
  receiptHash?: string | null;
  children?: ReactNode;
}

/**
 * "Show the math" affordance — a Sheet that opens beside any computed value
 * and renders the canonical formula, its inputs, the numeric result, and the
 * Λ-receipt hash if one was emitted.
 *
 * Every consumer must source the formula from @szl-holdings/formulas. This
 * component never re-implements math — it only displays it.
 */
export function ShowTheMath({
  formulaId,
  label,
  expression,
  inputs,
  result,
  thesisRef,
  pkg = '@szl-holdings/formulas',
  receiptHash,
  children,
}: ShowTheMathProps): React.JSX.Element {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 border border-[var(--vessels-ocean-border,#1f2a44)] bg-transparent px-2 text-[11px] uppercase tracking-[0.12em] text-[var(--foreground)]/70 hover:bg-[var(--vessels-marine,#0b1426)]/40 hover:text-[var(--foreground)]"
          data-testid={`show-the-math-${formulaId}`}
          aria-label={`Show the math for ${label}`}
        >
          <Sigma className="h-3.5 w-3.5" aria-hidden />
          Show the math
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full max-w-md border-l border-[var(--vessels-ocean-border,#1f2a44)] bg-[var(--background)] text-[var(--foreground)]"
      >
        <SheetHeader className="space-y-2 pb-4 text-left">
          <div className="flex items-center gap-2">
            <Sigma className="h-4 w-4 text-[var(--vessels-marine,#7aa7d9)]" aria-hidden />
            <SheetTitle className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--foreground)]/60">
              {formulaId}
            </SheetTitle>
          </div>
          <h2 className="text-lg font-medium text-[var(--foreground)]">{label}</h2>
          <SheetDescription className="text-sm text-[var(--foreground)]/60">
            This number was computed by the canonical formula below — imported from{' '}
            <code className="rounded bg-[var(--vessels-marine,#0b1426)]/40 px-1 py-0.5 font-mono text-xs">
              {pkg}
            </code>
            . A Λ-receipt is emitted on every compute.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          <section>
            <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--foreground)]/50">
              Expression
            </div>
            <pre
              className="overflow-x-auto rounded border border-[var(--vessels-ocean-border,#1f2a44)] bg-[var(--vessels-marine,#0b1426)]/30 p-3 font-mono text-[13px] leading-relaxed text-[var(--foreground)]"
              data-testid={`show-the-math-expression-${formulaId}`}
            >
              {expression}
            </pre>
          </section>

          <section>
            <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--foreground)]/50">
              Inputs
            </div>
            <dl className="grid grid-cols-2 gap-1.5 rounded border border-[var(--vessels-ocean-border,#1f2a44)] bg-[var(--vessels-marine,#0b1426)]/20 p-3 font-mono text-[12px]">
              {Object.entries(inputs).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-[var(--foreground)]/55">{k}</dt>
                  <dd className="text-right text-[var(--foreground)]">
                    {v === null || v === undefined ? '—' : String(v)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--foreground)]/50">
              Result
            </div>
            <div
              className="rounded border border-[var(--vessels-marine,#7aa7d9)]/40 bg-[var(--vessels-marine,#7aa7d9)]/10 p-3 font-mono text-2xl text-[var(--foreground)]"
              data-testid={`show-the-math-result-${formulaId}`}
            >
              {typeof result === 'number' ? result.toLocaleString(undefined, { maximumFractionDigits: 4 }) : result}
            </div>
          </section>

          {(thesisRef || receiptHash) && (
            <section className="space-y-2 border-t border-[var(--vessels-ocean-border,#1f2a44)] pt-4">
              {thesisRef && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--foreground)]/55">Thesis</span>
                  <code className="font-mono text-[11px] text-[var(--foreground)]/80">{thesisRef}</code>
                </div>
              )}
              {receiptHash && (
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[var(--foreground)]/55">Λ-receipt</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {receiptHash.slice(0, 12)}…{receiptHash.slice(-6)}
                  </Badge>
                </div>
              )}
            </section>
          )}

          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default ShowTheMath;
