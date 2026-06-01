# Ayni Conservation Law (honest math)

**Author:** Yachay (CTO)
**Date:** 2026-06-01
**Status:** ADDITIVE to Doctrine v11. Game-theory primitive. **Zero mysticism.**

---

## 0. Honest framing (read first)

"Ayni" is the Quechua word for **balanced reciprocal exchange**. In AYNI-OS it is
**not** treated as a spiritual, ritual, or religious claim. It is used **only** as a
label for a well-established game-theoretic primitive: **reciprocal altruism /
direct reciprocity** as formalized by Trivers (1971) and Axelrod & Hamilton (1981).
Every quantity below is an ordinary real-valued resource accounting variable. No
"energy of the universe", no "cosmic balance", no mysticism. If you delete the word
"Ayni" and replace it with "reciprocity coefficient", the math is unchanged.

The "conservation law" framing is the **Noether (1918) symmetry → conservation**
pattern applied honestly: we exhibit a *continuous symmetry of the resource-exchange
dynamics* (relabel-invariance of paired give/take entries under time-shift) and show
the associated *conserved quantity* is the net reciprocity balance. This is an
**analogy made precise**, not a physics claim about the cosmos.

---

## 1. Resource model

The empire is a finite set of **organs** \(O = \{o_1, \dots, o_{14}\}\) (Doctrine v11:
14 unique axioms / 14 organs). Each organ holds resource accounts in a finite set of
**resource types** \(R\) (e.g. compute-seconds, tokens, GPU-minutes, receipts-served).

An **action** \(a\) is an event that, at time \(t(a)\), **consumes** an amount
\(c(a) \ge 0\) of resource \(r(a) \in R\) **from** organ \(o(a) \in O\). It is
recorded as a KIPU receipt (event-sourcing; see RUNTIME_SOURCE_INDEX.md).

A **reciprocating action** \(a'\) is an event that **gives back** an amount
\(g(a') \ge 0\) of resource \(r(a') \in R\) **to** organ \(o(a') \in O\) at
time \(t(a') > t(a)\). Ayni pairs an action with one or more future reciprocations.

---

## 2. Definition (Ayni obligation)

> **Definition 2.1 (Ayni-balanced action).** An action \(a\) consuming resource
> \(r\) from organ \(o\) is **Ayni-balanced** iff there exists a future action (or
> finite set of actions) \(a'\) giving resource \(r'\) back to \(o\) such that
> \(r' \ge r\), with \(t(a') > t(a)\) and a finite time-lag bound
> \(t(a') - t(a) \le \tau_{\max}\).

This is **exactly** Trivers' "time-lagged symbiosis": one organ helps another and
*then waits a period of time before being helped in turn* (Trivers 1971, p. 39). The
finite \(\tau_{\max}\) is the "shadow of the future" that makes reciprocity an
evolutionarily stable strategy (Axelrod & Hamilton 1981).

---

## 3. The per-organ Ayni coefficient

For organ \(o\) over a window \(W = [t_0, t_1]\) define the **received** and
**given** flows:

\[
\mathrm{In}_o(W) = \sum_{a' : o(a')=o,\ t(a')\in W} g(a'), \qquad
\mathrm{Out}_o(W) = \sum_{a : o(a)=o,\ t(a)\in W} c(a).
\]

The **Ayni coefficient** is the normalized reciprocity balance

\[
\boxed{\ \alpha_o(W) \;=\; \frac{\mathrm{In}_o(W)}{\mathrm{In}_o(W) + \mathrm{Out}_o(W)} \in [0,1]\ }
\]

with the convention \(\alpha_o = \tfrac12\) when both flows are zero (idle organ is
balanced by definition). \(\alpha_o = \tfrac12\) means perfectly balanced
(In = Out); \(\alpha_o < \tfrac12\) means the organ is a **net donor** (being drained);
\(\alpha_o > \tfrac12\) means a **net recipient**.

A **deficit** is declared when \(\alpha_o < \alpha_{\min}\) with the operational
threshold \(\alpha_{\min} = 0.45\) (a 10% sustained net drain). Crossing it fires
**HUKLLA tripwire T24** (the additive Ayni tripwire; T01–T10 are unchanged).

---

## 4. The conservation law (Noether-style derivation, honest)

Consider the **net reciprocity balance** of the whole empire:

\[
\mathcal{A}(t) = \sum_{o \in O} \big( \mathrm{In}_o([0,t]) - \mathrm{Out}_o([0,t]) \big).
\]

**Symmetry.** Every reciprocating give \(g(a')\) to organ \(o(a')\) is, by the
double-entry KIPU ledger, recorded as a matching take from the organ that supplied
it. Formally the ledger has the **pairing symmetry**: the map that relabels each
give-entry with its source take-entry (and vice-versa) is a bijection that leaves the
total flow set invariant. This is a discrete continuous-symmetry analogue (a
permutation symmetry of paired entries; invariant under uniform time-translation of
the pairing).

**Conserved quantity.** Under this pairing symmetry, internal transfers cancel:
every internal give to \(o\) is an internal take from some \(o''\). Hence

\[
\boxed{\ \mathcal{A}(t) = \mathrm{In}^{\mathrm ext}(t) - \mathrm{Out}^{\mathrm ext}(t)\ }
\]

i.e. **the net internal reciprocity balance is conserved** — it depends only on
flows crossing the empire boundary, never on internal reshuffling. This is the
Noether pattern: *symmetry of the dynamics ⇒ a conserved current*. We state it as a
Lean theorem `ayni_conservation` (sorry-tagged; obligation in LEAN_STUBS_LOG.md).

> **Theorem 4.1 (Ayni conservation, informal).** If the KIPU ledger is double-entry
> (every internal give has a matching internal take), then the empire's net internal
> reciprocity balance \(\mathcal{A}_{\mathrm{int}}(t) \equiv 0\) for all \(t\);
> equivalently \(\sum_{o} \mathrm{In}_o^{\mathrm int} = \sum_{o} \mathrm{Out}_o^{\mathrm int}\).

This is a *conservation of paired exchange*, the bookkeeping identity behind
double-entry accounting — exactly the honest content of "Ayni".

---

## 5. No-deficit-spiral theorem

> **Theorem 5.1 (no_deficit_spiral, informal).** Under the Ayni obligation
> (Def. 2.1) with finite time-lag \(\tau_{\max}\), no organ can be net-drained
> indefinitely. Formally: if every consuming action is Ayni-balanced, then for every
> organ \(o\), \(\liminf_{t\to\infty} \alpha_o([t-\tau_{\max},\,t]) \ge \tfrac12\),
> so \(\alpha_o\) cannot stay below \(\alpha_{\min}<\tfrac12\) forever.

**Proof sketch (honest).** Each take \(c(a)\) from \(o\) is matched by a future give
\(g(a') \ge c(a)\) within \(\tau_{\max}\). Sum over a trailing window of width
\(\tau_{\max}\): the matched gives that land in the window dominate the takes whose
obligations fall due in it, so \(\mathrm{In}_o \ge \mathrm{Out}_o\) infinitely often,
forcing \(\alpha_o \ge \tfrac12\) infinitely often. Hence no permanent spiral below
\(\alpha_{\min}\). A net-drain can be **transient** (during the lag) but not
**permanent** — which is precisely Axelrod's result that defection cannot dominate a
population of reciprocators once the shadow of the future is long enough. Stated in
Lean as `no_deficit_spiral` (sorry-tagged).

---

## 6. Citations (peer-reviewed only)

- R. Axelrod and W. D. Hamilton, "The Evolution of Cooperation," *Science*, vol. 211,
  no. 4489, pp. 1390–1396, 1981. DOI: 10.1126/science.7466396.
- R. L. Trivers, "The Evolution of Reciprocal Altruism," *The Quarterly Review of
  Biology*, vol. 46, no. 1, pp. 35–57, 1971. DOI: 10.1086/406755.
- E. Noether, "Invariante Variationsprobleme," *Nachrichten von der Gesellschaft der
  Wissenschaften zu Göttingen, Mathematisch-Physikalische Klasse*, pp. 235–257, 1918.

---

## 7. Doctrine v11 LOCKED numbers (preserved verbatim)

- 749 declarations / 14 unique axioms / 163 sorries; 13-axis canonical (yuyay_v3).
- yuyay_v3 replay hash: `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5` — **UNTOUCHED**.
- A2 = IsHomogeneous, A4 = IsBounded, SLSA L1, Λ Conjecture 1 — unchanged.
- Ayni adds **yuyay axis 14** (reciprocity coefficient) as **yuyay_v4** with its own
  separate replay hash; v3 hash is not recomputed. ADDITIVE only.

— Signed, **Yachay**
