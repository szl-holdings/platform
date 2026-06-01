# a11oy — Frontier Feature & Animation Upgrade

## Animation upgrade
Animated **wire-mesh canvas** behind the hero — a lineage of the sibling "Live Wires" 3D hero,
re-implemented as a self-contained `<canvas>` animation with **no Three.js and no CDN dependency**
(keeps the additive footprint tiny and offline-safe). Nodes drift and connect on proximity,
evoking the Lattice mesh without importing any external asset.

## Novel frontier feature: Live Constitution Diff
The hero surfaces a **live constitution diff** above the fold — the governing constitutional
rule-set is presented as a versioned, inspectable artifact (Doctrine v11, replay hash bacf5443…),
making "the rules that govern the agent" a first-class, visible, diffable object on the landing
page itself.

This is the a11oy-specific expression of Anthropic's public-constitution principle
(https://www.anthropic.com/constitution), rendered in our governance idiom and bound to our
LOCKED doctrine numbers rather than a static policy page.

## Marker
The hero carries `data-szl-hero-v2` (value = 2 for a11oy) so the makeover is greppable in the
served HTML for verification.
