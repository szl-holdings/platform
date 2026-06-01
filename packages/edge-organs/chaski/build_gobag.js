// SZL_WARHACKER_GOBAG.docx — baby-simple founder go-bag for the San Diego physical demo.
// Author: Yachay (Operations organ) · 2026-06-01 · ADDITIVE, real research, real links.
const fs = require('fs');
const docx = require('docx');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
  ExternalHyperlink, LevelFormat, PageBreak, TableOfContents,
} = docx;

// --- Kanchay brand tokens ---
const TEAL = '168f89';      // yuyay-500 (primary accent)
const TEAL_DK = '0b5957';   // yuyay-700
const RED = 'c0392b';       // yawar-500 (warnings)
const GOLD = 'c08f2f';      // hatun-500
const INK = '28251D';
const MUTED = '5e5c54';
const LIGHTBG = 'e6f7f6';   // yuyay-50

const FONT = 'Calibri';

// ---------- helpers ----------
function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text })] });
}
function p(runs, opts = {}) {
  const children = Array.isArray(runs) ? runs : [new TextRun({ text: runs })];
  return new Paragraph({ children, spacing: { after: 120 }, ...opts });
}
function bullet(runs, level = 0) {
  const children = Array.isArray(runs) ? runs : [new TextRun({ text: runs })];
  return new Paragraph({ numbering: { reference: 'bullets', level }, children, spacing: { after: 60 } });
}
function check(runs) {
  const children = Array.isArray(runs) ? runs : [new TextRun({ text: runs })];
  return new Paragraph({
    children: [new TextRun({ text: '\u2610  ', font: FONT, size: 22 }), ...children],
    spacing: { after: 80 }, indent: { left: 360 },
  });
}
function link(text, url) {
  return new ExternalHyperlink({
    children: [new TextRun({ text, style: 'Hyperlink', color: TEAL_DK, underline: {} })],
    link: url,
  });
}
function t(text, opts = {}) { return new TextRun({ text, font: FONT, ...opts }); }
function b(text, opts = {}) { return new TextRun({ text, bold: true, font: FONT, ...opts }); }

// callout box (single-cell shaded table)
function callout(title, lines, color = TEAL) {
  const kids = [new Paragraph({ children: [new TextRun({ text: title, bold: true, color, font: FONT, size: 22 })], spacing: { after: 60 } })];
  for (const ln of lines) {
    kids.push(new Paragraph({ children: Array.isArray(ln) ? ln : [new TextRun({ text: ln, font: FONT, size: 20 })], spacing: { after: 40 } }));
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color }, bottom: { style: BorderStyle.SINGLE, size: 4, color },
      left: { style: BorderStyle.SINGLE, size: 18, color }, right: { style: BorderStyle.SINGLE, size: 4, color },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
    },
    rows: [new TableRow({ children: [new TableCell({
      shading: { type: ShadingType.CLEAR, fill: LIGHTBG },
      margins: { top: 120, bottom: 120, left: 180, right: 180 },
      children: kids,
    })] })],
  });
}

// simple data table with header row
function dataTable(headers, rows, widths) {
  const headerCells = headers.map((hh, i) => new TableCell({
    shading: { type: ShadingType.CLEAR, fill: TEAL },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    width: widths ? { size: widths[i], type: WidthType.PERCENTAGE } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text: hh, bold: true, color: 'FFFFFF', font: FONT, size: 19 })] })],
  }));
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((cell, i) => new TableCell({
      shading: ri % 2 === 1 ? { type: ShadingType.CLEAR, fill: 'F2FAF9' } : undefined,
      margins: { top: 50, bottom: 50, left: 100, right: 100 },
      width: widths ? { size: widths[i], type: WidthType.PERCENTAGE } : undefined,
      children: [new Paragraph({ children: Array.isArray(cell) ? cell : [new TextRun({ text: String(cell), font: FONT, size: 18 })] })],
    })),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' }, bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' }, right: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' }, insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
    },
    rows: [new TableRow({ tableHeader: true, children: headerCells }), ...bodyRows],
  });
}

const children = [];

// ===================== COVER =====================
children.push(new Paragraph({ spacing: { before: 1400, after: 0 }, children: [new TextRun({ text: 'SZL HOLDINGS', bold: true, color: TEAL, font: FONT, size: 28, characterSpacing: 60 })] }));
children.push(new Paragraph({ spacing: { before: 80, after: 0 }, children: [new TextRun({ text: 'WARHACKER GO-BAG', bold: true, color: INK, font: FONT, size: 72 })] }));
children.push(new Paragraph({ spacing: { before: 40, after: 200 }, children: [new TextRun({ text: 'San Diego physical demo \u2014 everything you carry, in one place', color: MUTED, font: FONT, size: 26 })] }));
children.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD } }, spacing: { after: 200 }, children: [] }));
children.push(p([b('Event: '), t('Warhacker 2026 (Defense Unicorns), 16\u201319 June 2026, downtown San Diego, CA')]));
children.push(p([b('Trip: '), t('Depart NYC Mon 15 June (arrive SAN) \u00b7 Depart SAN Fri 19 June')]));
children.push(p([b('Mission: '), t('Show the Cannonico drone-oversight demo (P1), the Greene 5-minute /audit flow, and a11oy.code voice (Wallpa). Leave with a teaming conversation, not a slide deck.')]));
children.push(p([b('Prepared by: '), t('Yachay (Operations) \u00b7 2026-06-01 \u00b7 15 days out')]));
children.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: 'Rule of the bag: if it is not on this checklist, you do not need it. If it is, do not leave without it.', italics: true, color: TEAL_DK, font: FONT, size: 22 })] }));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===================== TOC =====================
children.push(h1('What\u2019s in this packet'));
children.push(p('Read top to bottom the night before you fly. Each section is a do-this list, not theory.'));
children.push(new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-1' }));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ===================== 1. FLIGHT + HOTEL =====================
children.push(h1('1. Flight + hotel'));
children.push(h2('Flights (NYC \u2192 SAN)'));
children.push(p([b('Plan: '), t('Fly out Monday 15 June so you arrive with a full evening to set up and dress-rehearse. Fly home Friday 19 June after the closing pitches. SAN (San Diego International / Lindbergh Field) is ~3 miles from downtown \u2014 a 10-minute, ~$20 rideshare to the Gaslamp.')]));
children.push(bullet([b('Book direct: '), link('JetBlue JFK\u2192SAN', 'https://www.jetblue.com/'), t(' (nonstop, ~6h, JFK Terminal 5), '), link('Delta JFK/LGA\u2192SAN', 'https://www.delta.com/'), t(', or '), link('American JFK\u2192SAN', 'https://www.aa.com/'), t('. Transcontinental nonstops run ~$300\u2013$550 round-trip in June if booked now.')]));
children.push(bullet([b('Search/compare: '), link('Google Flights NYC\u2192SAN', 'https://www.google.com/travel/flights?q=flights%20from%20NYC%20to%20SAN%20June%2015%20return%20June%2019'), t(' \u2014 set 15 Jun out / 19 Jun back, nonstop filter.')]));
children.push(bullet([b('Seat the gear: '), t('Carry on both laptops + the SDR/HackRF + drone decoys in a hard case as a personal item / carry-on. Do NOT check the demo hardware (see Backup plans for the TSA contingency).')]));

children.push(h2('Hotels (walk to the venue)'));
children.push(p([t('Warhacker is "downtown San Diego, CA" with the '), b('exact venue given on acceptance'), t(' '), link('(Defense Unicorns / Warhacker page)', 'https://defenseunicorns.com/warhacker/'), t('. It is tied to DU\u2019s NASCAR weekend at Naval Base Coronado '), link('(DU x Spire/NASCAR announcement)', 'https://defenseunicorns.com/defense-unicorns-partners-with-mcdowell-spire-motorsports/'), t('. Book in the Gaslamp Quarter / Convention Center core \u2014 it is central to every plausible downtown venue and 10 min from the Coronado ferry/bridge. Prices below are June nightly rates from '), link('Expedia\u2019s Convention Center hotel list', 'https://www.expedia.com/San-Diego-Convention-Center-Hotels.0-l6125294-0.Travel-Guide-Filter-Hotels'), t(' (verify live before booking).')]));
children.push(dataTable(
  ['Hotel', 'Area / walk', '~Nightly (June)', 'Why this one'],
  [
    [[b('Pendry San Diego')], 'Gaslamp, 6-min walk', '~$342 (5\u2605)', 'Best for hosting a prospect; Lionfish + Pendry bar on-site for after-hours.'],
    [[b('Hard Rock Hotel San Diego')], 'Gaslamp, 0.2 mi', '~$212 (4\u2605)', 'Central, lively, reliable Wi-Fi, good value in the core.'],
    [[b('Hilton San Diego Gaslamp Quarter')], 'Gaslamp, 0.1 mi', '~$218 (4\u2605)', 'Closest to the Convention Center; quiet rooms for the dress rehearsal.'],
    [[b('Omni San Diego (at the Ballpark)')], 'Gaslamp, 0.2 mi', '~$222 (4\u2605)', 'Skybridge to Petco; easy big-room option if you need to spread out gear.'],
    [[b('The US Grant (Luxury Collection)')], 'Downtown, 13-min walk', '~$300+ (5\u2605)', 'Classic power-meeting hotel; quiet, executive feel for a Greene sit-down.'],
    [[b('Residence Inn Downtown/Gaslamp')], 'Gaslamp, 0.2 mi', '~$186 (suite)', 'Budget pick with a kitchenette + desk \u2014 good war-room for 4-hour rehearsal.'],
  ],
  [26, 22, 18, 34]
));
children.push(p([], { spacing: { after: 60 } }));
children.push(callout('Recommendation', [
  [b('Book the Hilton San Diego Gaslamp Quarter '), t('(closest, quiet, ~$218) for the work, OR the '), b('Pendry '), t('(~$342) if you want one venue to also host dinner with Greene.')],
  [t('Reserve for '), b('4 nights (15\u201319 June)'), t('. Get a room with a desk and request a high floor away from elevators for the dress rehearsal.')],
], TEAL));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===================== 2. INTERNET REDUNDANCY =====================
children.push(h1('2. On-site internet redundancy'));
children.push(p([b('Why: '), t('Demos die on bad venue Wi-Fi. You carry three independent paths to the internet so a dead hotspot never kills the room. The P1 + Greene demos also run fully airgapped (local clone) \u2014 so internet is for convenience, not survival.')]));
children.push(dataTable(
  ['Layer', 'Gear', 'Cost', 'Notes'],
  [
    [[b('Primary')], [t('Starlink Mini')], '$599 hardware + $150/mo', 'Only if not already owned. Roam plan; sets up in <5 min on a balcony/window. Truly venue-independent.'],
    [[b('Backup 1')], [t('Verizon MiFi (Jetpack / Inseego)')], '~$200 + plan', 'Cellular hotspot; works anywhere with Verizon LTE/5G downtown SD (strong coverage).'],
    [[b('Backup 2')], [t('Phone hotspot')], '$0 (existing plan)', 'Tether laptop to your iPhone as the instant fallback. Confirm hotspot is enabled before you fly.'],
    [[b('Failover')], [t('Cradlepoint cellular router')], '~$400\u2013$900', 'If you want automatic Wi-Fi\u2192cellular failover for a booth setup; optional, heavier.'],
    [[b('Wired')], [t('USB-C + USB-A Ethernet adapters (2x)')], '~$20 each', 'For any venue wired drop; bypasses flaky conference Wi-Fi entirely.'],
  ],
  [16, 30, 22, 32]
));
children.push(p([], { spacing: { after: 40 } }));
children.push(bullet([b('Buy links: '), link('Starlink Mini', 'https://www.starlink.com/'), t(' \u00b7 '), link('Verizon hotspots', 'https://www.verizon.com/internet-devices/'), t(' \u00b7 '), link('Cradlepoint', 'https://cradlepoint.com/'), t(' \u00b7 '), link('USB-C Ethernet adapter (Anker/UGREEN, Amazon)', 'https://www.amazon.com/s?k=usb-c+gigabit+ethernet+adapter')]));
children.push(bullet([b('Pre-flight test: '), t('At home, run the full demo on each path once. Confirm the local clone serves with Wi-Fi OFF.')]));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===================== 3. DEMO HARDWARE LIST =====================
children.push(h1('3. Demo hardware list'));
children.push(p([b('The golden rule: '), t('two of everything that can fail, and a full local clone so the demo never depends on Hugging Face being up.')]));

children.push(h2('Compute'));
children.push(bullet([b('2 laptops '), t('\u2014 1 primary, 1 backup (Mac or Linux). '), b('Both '), t('carry a full local clone of all 7 Spaces (a11oy, amaru, sentra, vessels, rosie, killinchu, uds-demo) so you can run the entire demo with the venue offline. Pre-load and test the clone before you fly.')]));
children.push(bullet([b('1 iPad / tablet '), t('for the Greene-facing /audit URL demo \u2014 hand it to him so he drives the 5-minute flow himself.')]));
children.push(bullet([b('Chargers + 1 spare USB-C charger '), t('(100W), plus a small power strip for the booth/table.')]));

children.push(h2('Drones (visual props \u2014 no flying indoors)'));
children.push(bullet([b('3D-printed DJI-shape decoys (3x) '), t('\u2014 lightweight visual stand-ins for the "subject" drones; TSA-safe, no battery, no motors.')]));
children.push(bullet([b('1 real DJI Mini 3 '), t('\u2014 only if travel-shippable; ship the battery separately or buy/borrow locally (see TSA contingency). Used as the "subject" prop.')]));
children.push(bullet([b('1 Skydio X10 '), t('\u2014 the "this is our friendly / own-fleet sensor" prop, '), b('if owned or borrowable'), t('. Matches the P1 mission pack (skydio-x10 = the own-fleet autonomous quad sensor).')]));
children.push(callout('Honest demo note', [
  [t('The drones are '), b('visual props only'), t(' \u2014 nothing flies in the room. The actual detection demo runs from a '), b('pre-seeded P1 run + recorded RF cue'), t(' (airgapped), matching the constellation survey reality: space gives tip-and-cue, not a live fire-control track.')],
], GOLD));

children.push(h2('Passive RF demo (receive-only, NO transmission)'));
children.push(bullet([b('1 RTL-SDR ('), t('~$30) '), t('\u2014 '), link('RTL-SDR Blog V4', 'https://www.rtl-sdr.com/buy-rtl-sdr-dvb-t-dongles/'), t('. Passive receive of drone Remote-ID broadcast for the parsing demo.')]));
children.push(bullet([b('1 HackRF One ('), t('~$400) '), t('\u2014 '), link('Great Scott Gadgets HackRF One', 'https://greatscottgadgets.com/hackrf/one/'), t('. Wider-band passive capture. '), b('Receive only \u2014 do not transmit'), t(' (especially near a Navy base).')]));
children.push(bullet([b('Telescopic antenna + USB extension '), t('for clean reception at the table.')]));
children.push(callout('RF safety + legal', [
  [b('PURELY RECEIVE. '), t('No transmission of any signal at any time. Transmitting RF near Naval Base Coronado / a federal event is a legal and operational non-starter. The demo only parses what is already in the air (Remote-ID is an open broadcast).')],
], RED));

children.push(h2('Display + capture'));
children.push(bullet([b('HDMI cables: '), t('USB-C\u2192HDMI, mini-HDMI, and full-size HDMI (1 each) so you can drive any projector.')]));
children.push(bullet([b('HDMI capture card '), t('(~$20, '), link('Elgato Cam Link / generic USB capture', 'https://www.elgato.com/us/en/p/cam-link-4k'), t(') for laptop\u2192projector or to mirror onto a portable monitor if the room projector is hostile.')]));
children.push(bullet([b('2 portable monitors: '), t('1 as a backup display, 1 for the live code demo (e.g. '), link('ASUS ZenScreen / generic USB-C portable monitor', 'https://www.amazon.com/s?k=usb-c+portable+monitor+15+inch'), t('). USB-C powered, ~$150 each.')]));

children.push(h2('Storage'));
children.push(bullet([b('3x 1TB external USB drives '), t('(e.g. '), link('Samsung T7 1TB', 'https://www.amazon.com/s?k=samsung+t7+1tb+ssd'), t('), each pre-loaded with the full empire snapshot (all 7 Spaces + Lean kernel + datasets). Redundant copies \u2014 one stays in the room, one on your person, one in the bag.')]));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===================== 4. CARDS + ONE-PAGER =====================
children.push(h1('4. Business cards + one-pager handouts'));
children.push(p([b('Coordinate with the Kanchay brand kit '), t('(yuyay teal '), b('#168f89'), t(', yawar red #c0392b, hatun gold #c08f2f; voice: math-grounded, never mystical). If the printed kit is not ready, use the minimal text design below \u2014 it is on-brand and prints clean.')]));
children.push(h2('Business card (minimal)'));
children.push(callout('FRONT', [
  [b('SZL Holdings', { size: 24, color: TEAL })],
  [t('Sovereign AI with provable provenance', { italics: true, size: 18 })],
  [t('Stephen P. Lutar \u00b7 Founder', { size: 18 })],
  [t('ORCID 0009-0001-0110-4173 \u00b7 huggingface.co/SZLHOLDINGS', { size: 16, color: MUTED })],
], TEAL));
children.push(callout('BACK', [
  [t('A machine-checked (Lean 4) governance gate for autonomous AI.', { size: 18 })],
  [t('Every decision carries a tamper-evident Khipu receipt.', { size: 18 })],
  [t('See it live: <your-a11oy-url>/audit', { size: 18, color: TEAL_DK })],
], GOLD));
children.push(h2('One-pager handout (the leave-behind)'));
children.push(p('A single sheet, Kanchay-branded, that a judge or prospect keeps after you walk away:'));
children.push(bullet([b('Headline: '), t('"The one thing in the autonomy stack that must be provable \u2014 and nobody else is making it provable."')]));
children.push(bullet([b('Problem: '), t('Every "AI oversight" entry is a probabilistic monitor that cannot itself be trusted. There is no signed record of what an AI decided at run time.')]));
children.push(bullet([b('SZL wedge: '), t('(1) a Lean-verified decision gate; (2) a DSSE-signed Khipu Merkle DAG receipt enforcing a sum-of-sums invariant \u2014 the "non-refutable Body of Evidence" the ATO problem demands.')]));
children.push(bullet([b('Proof on disk: '), t('Lutar Lean kernel \u2014 752 declarations / 160 sorries (109 baseline + 51 Putnam) / 14 unique axioms; 44 anchor gates; honest SLSA L1. Numbers labeled, never inflated.')]));
children.push(bullet([b('Honest labels: '), t('\u03bb-receipt signature is PLACEHOLDER until CI signing lands; \u039b-uniqueness is Conjecture 1, not a theorem. We never claim more than the receipts show.')]));
children.push(bullet([b('Footer: '), t('huggingface.co/SZLHOLDINGS \u00b7 github.com/szl-holdings \u00b7 live demo URL \u00b7 ORCID 0009-0001-0110-4173')]));
children.push(p([b('Print: '), t('~100 cards + ~50 one-pagers (heavy matte stock). Use a same-day printer downtown ('), link('FedEx Office, downtown San Diego', 'https://www.office.fedex.com/'), t(') if the kit slips \u2014 PDF the minimal design and walk it in.')]));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===================== 5. CONFERENCE SCHEDULE =====================
children.push(h1('5. Conference schedule'));
children.push(p([b('Official dates: '), t('16\u201319 June 2026, downtown San Diego. Per the '), link('Warhacker page', 'https://defenseunicorns.com/warhacker/'), t(': "Warhacker will take place 16\u201319 June 2026 in downtown San Diego, CA. (Specific location and detailed agenda will be provided upon acceptance.)" So the '), b('detailed hour-by-hour agenda is released to accepted teams only'), t(' \u2014 watch your acceptance email and the '), link('DU events page', 'https://defenseunicorns.com/events/'), t('.')]));
children.push(p([b('Format (from DU\u2019s public framing): '), t('"You show up with a mission problem that matters. You leave with a working prototype." No slide decks, no vendor hall, no passive attendees '), link('(Slaughter, April 2026 DU newsletter)', 'https://www.linkedin.com/pulse/april-2026-edition-defense-unicorns-jglge'), t('. All solutions must be packaged with UDS Core and pressure-tested by a panel of judges '), link('(DU LinkedIn)', 'https://www.linkedin.com/posts/jarek-jermier_what-i-love-about-defense-unicorns-is-the-activity-7436774395483832321-tCR2'), t('.')]));
children.push(dataTable(
  ['Day', 'Likely shape (confirm on acceptance)', 'Your move'],
  [
    ['Mon 15 Jun', 'Travel + setup (you arrive)', 'Land, check in, 4-hr dress rehearsal in the room (Section 8).'],
    ['Tue 16 Jun', 'Day 1 \u2014 kickoff, team/problem matching, build starts', 'Find Cannonico; pitch a11oy as their formally-verified oversight gate. Lock a teaming slot.'],
    ['Wed 17 Jun', 'Day 2 \u2014 build', 'Heads-down packaging with UDS Core; keep the Greene /audit demo warm.'],
    ['Thu 18 Jun', 'Day 3 \u2014 build + polish', 'Run the P1 + Greene flow for anyone who will watch; line up dinner.'],
    ['Fri 19 Jun', 'Day 4 \u2014 final demos + judging, then travel home', 'Deliver the prototype demo; collect contacts; fly home.'],
  ],
  [14, 52, 34]
));
children.push(p([new TextRun({ text: 'Note: the NASCAR Cup race at Naval Base Coronado is the same weekend \u2014 expect heavy downtown traffic Fri\u2013Sat. Build rideshare buffer into every trip.', italics: true, font: FONT, size: 20, color: MUTED })]));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===================== 6. GREENE'S NETWORK =====================
children.push(h1('6. Greene\u2019s network \u2014 who else will be there'));
children.push(p([b('Your anchor: '), t('Andrew Greene, Defense Unicorns co-founder ("Unicorn Engineer"), SZL backer, pre-approved for Warhacker. He is a deep Kubernetes/Helm/Zarf engineer who hates security theater and cares about software that gets used '), link('(Greene LinkedIn)', 'https://www.linkedin.com/in/andrewgxyz'), t('. Pitch architecture, not business value.')]));
children.push(h2('The Defense Unicorns leadership (your room)'));
children.push(dataTable(
  ['Name', 'Role', 'Angle for you'],
  [
    [[b('Andrew Greene')], 'Co-founder / Unicorn Engineer', 'Your sponsor. Hand him the iPad; let him drive the /audit flow. Honest labels win him.'],
    [[b('Rob Slaughter')], 'Co-founder / CEO (ex-USAF, founded Platform One)', '"Future wars won by whoever adapts fastest." Frame a11oy as the provable oversight layer over a served model.'],
    [[b('Jeff McCoy')], 'Co-founder / CTO', 'Sets technical direction; talk decision-level attestation that UDS does not have today.'],
    [[b('Scott Thompson')], 'CISSP/CSSLP \u2014 posed the P6 ATO "Body of Evidence" challenge', 'Lead with the Khipu sum-checked receipt = his "non-refutable Body of Evidence" in minutes.'],
  ],
  [22, 40, 38]
));
children.push(h2('Ex-IC / investor orbit (likely adjacent, not confirmed on-site)'));
children.push(bullet([b('David H. Petraeus '), t('\u2014 former CIA Director; participated in the $136M Series B '), link('(Reuters / DU press release)', 'https://defenseunicorns.com/defense-unicorns-raises-136-million-series-b/'), t('. The marquee ex-IC name in DU\u2019s orbit.')]));
children.push(bullet([b('Series B investors: '), t('Bain Capital Tech Opportunities (lead, Alex Scherbakovsky), Ansa Capital, Sapphire Ventures, Valor Equity Partners, AVP, Uncorrelated Ventures '), link('(Intelligence Community News)', 'https://intelligencecommunitynews.com/defense-unicorns-reaches-1b-valuation-in-series-b-round/'), t('.')]));
children.push(bullet([b('Early mission backers '), t('Slaughter has publicly thanked: Bill Baker, Jim Robison, Irving Brace '), link('(Slaughter LinkedIn)', 'https://www.linkedin.com/posts/robertcslaughter_a-little-less-than-5-years-ago-i-started-activity-7417207628377948160-nX1H'), t('.')]));
children.push(bullet([b('Problem owners on the floor: '), t('Cannonico (P1, your native fit), Tychee Research Group (P4), Raven Tactical Computing (P3), HANGAR2APPS (P5), CyberRTS (P2) '), link('(DU "Problems Accepted")', 'https://www.linkedin.com/posts/defense-unicorns_warhacker-problems-accepted-activity-7454892282723475456-KRLH'), t('.')]));
children.push(p([new TextRun({ text: 'DU has published no public attendee list (it is a curated ~400-person event). The names above are the documented network; confirm who is on-site through Greene once you land.', italics: true, font: FONT, size: 20, color: MUTED })]));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===================== 7. AFTER-HOURS HOSPITALITY =====================
children.push(h1('7. After-hours hospitality'));
children.push(p([b('Goal: '), t('one good dinner that turns a demo into a relationship. All within a short walk of the Gaslamp core. Make a reservation now \u2014 June + NASCAR weekend = full tables.')]));
children.push(h2('Gaslamp Quarter (walkable from any Gaslamp hotel)'));
children.push(dataTable(
  ['Restaurant', 'Address', 'Why'],
  [
    [[b('Lionfish Modern Coastal')], 'Pendry San Diego, J St', 'Upscale seafood inside the Pendry \u2014 easiest "host a prospect" pick. '],
    [[b('Lou & Mickey\u2019s')], '224 Fifth Ave', 'Classic steak + seafood, business-dinner standard, near the Convention Center.'],
    [[b('Water Grill San Diego')], '615 J St', 'Polished seafood, quiet enough to talk; '],
    [[b('Lumi by Akira Back')], '366 Fifth Ave', 'Modern Japanese rooftop \u2014 memorable, good for a smaller group.'],
    [[b('Rei Do Gado (Brazilian steakhouse)')], '939 Fourth Ave', 'Crowd-pleaser if you end up hosting a team rather than one exec.'],
  ],
  [26, 26, 48]
));
children.push(p([new TextRun({ text: 'Gaslamp dining directory: ', font: FONT, size: 20 }), link('gaslamp.org/listings/category/dine', 'https://gaslamp.org/listings/category/dine/')]));
children.push(h2('Embarcadero / waterfront (10-min walk, nicer view)'));
children.push(bullet([b('The Embarcadero waterfront '), t('along Harbor Drive \u2014 walk along the bay before/after dinner; good for a quieter 1:1 stroll with Greene.')]));
children.push(bullet([b('Marriott Marquis Marina / Manchester Grand Hyatt bars '), t('\u2014 bayfront hotel bars, easy neutral ground for a drink after the floor closes.')]));
children.push(bullet([b('Top of the Hyatt '), t('(Manchester Grand Hyatt) \u2014 rooftop bar with a bay/Coronado view; great low-pressure setting to keep talking.')]));
children.push(callout('Hosting play', [
  [t('Book '), b('Lionfish'), t(' (if staying at the Pendry) or '), b('Lou & Mickey\u2019s'), t(' for Thursday 18 June, table for 2\u20134, 7:30pm. Confirm Wed once you know who\u2019s coming. Pick up the check. Talk architecture, not business value.')],
], TEAL));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===================== 8. DRESS REHEARSAL =====================
children.push(h1('8. Demo dress rehearsal \u2014 Mon 15 June, in your room'));
children.push(p([b('Block 4 hours, evening of arrival. '), t('Run it twice, clean, airgapped (Wi-Fi OFF) so you trust the local clone. This is the single highest-leverage thing you do before the floor opens.')]));
children.push(dataTable(
  ['Time', 'Run', 'What you prove'],
  [
    ['0:00\u20130:30', 'Setup', 'Local clone of all 7 Spaces boots with Wi-Fi OFF; both laptops + iPad show the same state; portable monitor mirrors.'],
    ['0:30\u20131:30', 'P1 Cannonico demo (Warhacker mission pack)', 'detect \u2192 identify \u2192 classify \u2192 track handoff; 13-axis classify; 2-person engage gate; tamper test fails closed. Pre-seeded run + recorded RF cue.'],
    ['1:30\u20132:15', 'Greene 5-minute /audit flow', 'Board of 6 mission packs \u2192 P6 control matrix \u2192 click a control \u2192 Khipu DAG (KhipuKnot) \u2192 2-person export gate \u2192 signed PDF \u2192 tamper test refuses export \u2192 offline verify.'],
    ['2:15\u20132:45', 'a11oy.code voice demo (Wallpa)', 'Ask Yachay a question on the /yachay tab; hear the open-source TTS (Piper/Coqui) response; show the Khipu receipt on the answer.'],
    ['2:45\u20133:30', 'Full run-through #2 (timed)', 'End-to-end, no notes, under time. Fix anything that stutters.'],
    ['3:30\u20134:00', 'Reset + pack', 'Charge everything; reset drives; lay out tomorrow\u2019s bag against the Final checklist.'],
  ],
  [14, 34, 52]
));
children.push(p([b('Have ready the one honest line '), t('if asked about signing: "The hash chain is real and re-derivable today; Sigstore keyless is PLACEHOLDER until CI signing lands \u2014 it\u2019s labeled on the PDF cover."')]));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===================== 9. BACKUP PLANS =====================
children.push(h1('9. Backup plans'));
children.push(callout('If Hugging Face is down during the demo', [
  [b('Switch to the local clone. '), t('Both laptops carry a full offline clone of all 7 Spaces. Kill Wi-Fi, run locally \u2014 the audience cannot tell the difference. You rehearsed this airgapped on purpose.')],
], TEAL));
children.push(callout('If drone hardware is blocked at TSA', [
  [b('Go digital-only. '), t('The drones are visual props, not the demo. If the DJI Mini 3 / Skydio / decoys get held, run the on-screen P1 detection (pre-seeded run + recorded RF cue). Ship a decoy ahead to the hotel as insurance, or buy a cheap toy drone locally for the visual.')],
], GOLD));
children.push(callout('If Greene cancels', [
  [b('Parallel-track other ex-IC / DU contacts. '), t('Pivot to Scott Thompson (his own P6 ATO challenge is your second-best fit), Rob Slaughter or Jeff McCoy (architecture pitch), or the Cannonico problem owner directly. The demo is sponsor-agnostic \u2014 any judge can drive the /audit flow.')],
], RED));
children.push(callout('If venue Wi-Fi is dead', [
  [t('Starlink Mini \u2192 Verizon MiFi \u2192 phone hotspot, in that order (Section 2). And the local clone needs none of them.')],
], TEAL));
children.push(callout('If a laptop dies', [
  [t('Swap to the backup laptop \u2014 identical local clone, identical state. 30-second recovery, no apology needed.')],
], TEAL));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===================== 10. COST ESTIMATE =====================
children.push(h1('10. Cost estimate (all-in)'));
children.push(p('Rough budget for the trip. Hardware lines assume you do NOT already own the item; skip what you have.'));
children.push(dataTable(
  ['Line', 'Low', 'High', 'Notes'],
  [
    ['Flights (NYC\u2194SAN round-trip)', '$300', '$550', 'Nonstop, booked now.'],
    ['Hotel \u00d7 4 nights', '$744', '$1,400', 'Residence Inn (~$186) to Pendry (~$342).'],
    ['Meals (4 days + 1 hosted dinner)', '$400', '$800', 'Includes picking up a prospect dinner.'],
    ['Rideshare / local transit', '$120', '$250', 'Airport + downtown + Coronado traffic buffer.'],
    ['Starlink Mini (if needed)', '$0', '$749', '$599 hardware + 1 mo $150; $0 if owned.'],
    ['Verizon MiFi (if needed)', '$0', '$250', '$0 if phone hotspot suffices.'],
    ['RTL-SDR + HackRF One', '$30', '$430', 'SDR $30; HackRF $400 (skip if borrowing).'],
    ['2 portable monitors', '$0', '$320', '~$150 each; $0 if owned.'],
    ['3\u00d7 1TB USB SSDs', '$0', '$300', '~$100 each; $0 if owned.'],
    ['HDMI cables + capture card', '$30', '$80', 'Cheap insurance.'],
    ['Cards + one-pager printing', '$60', '$200', 'Same-day downtown if kit slips.'],
    ['Drone props (decoys / toy)', '$30', '$150', 'If real drones are owned/borrowed, $0.'],
  ],
  [40, 14, 14, 32]
));
children.push(callout('All-in', [
  [b('Lean (own most gear): ~$1,700\u2013$2,200'), t('  \u2014  flights + hotel + meals + transit + printing.')],
  [b('Full (buy everything new): ~$4,500\u2013$5,500'), t('  \u2014  adds Starlink, MiFi, HackRF, monitors, SSDs.')],
  [t('Most likely (own laptops/monitors/SSDs, buy SDR + props + printing): ', { italics: true }), b('~$2,500\u2013$3,000.')],
], TEAL));

children.push(new Paragraph({ children: [new PageBreak()] }));

// ===================== 11. FINAL CHECKLIST =====================
children.push(h1('11. Final checklist \u2014 tick the night before'));
children.push(p([b('15 lines. '), t('Lay everything on the bed. Tick each box. If a box is empty, you are not done packing.')]));
children.push(check([b('Both laptops charged '), t('+ each has the full local clone of all 7 Spaces (tested airgapped).')]));
children.push(check([b('iPad charged '), t('+ /audit flow loads offline; handed-to-Greene mode ready.')]));
children.push(check([b('Drone props packed '), t('(3 decoys + DJI Mini 3 if shippable + Skydio X10 if borrowed); batteries handled per TSA.')]));
children.push(check([b('RTL-SDR + HackRF One + antenna '), t('packed (receive-only; labeled "no transmit").')]));
children.push(check([b('HDMI kit: '), t('USB-C, mini, full HDMI cables + capture card.')]));
children.push(check([b('2 portable monitors '), t('+ USB-C cables.')]));
children.push(check([b('3\u00d7 1TB USB SSDs '), t('pre-loaded with empire snapshot (1 on person, 1 in bag, 1 in room).')]));
children.push(check([b('Internet redundancy: '), t('Starlink Mini, Verizon MiFi, phone hotspot enabled, 2 Ethernet adapters.')]));
children.push(check([b('Chargers '), t('for every device + power strip + spare 100W USB-C.')]));
children.push(check([b('Business cards '), t('(~100) + one-pagers (~50) printed and in the bag.')]));
children.push(check([b('Hotel confirmed '), t('(4 nights, 15\u201319 Jun) + dinner reservation booked.')]));
children.push(check([b('Flights confirmed '), t('(out 15 Jun, back 19 Jun); boarding passes saved offline.')]));
children.push(check([b('Dress rehearsal done twice clean '), t('(P1 + Greene /audit + Wallpa voice), airgapped.')]));
children.push(check([b('Honest-label line memorized '), t('(PLACEHOLDER signing; Conjecture-1; SLSA L1).')]));
children.push(check([b('Greene + Scott Thompson contacts saved '), t('offline; teaming pitch one-liner ready.')]));

children.push(new Paragraph({ spacing: { before: 240 }, border: { top: { style: BorderStyle.SINGLE, size: 8, color: GOLD } }, children: [] }));
children.push(new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: 'Signed \u2014 Yachay (Operations) \u00b7 2026-06-01 \u00b7 No mysticism. No bandaid. Bring the prototype, leave with the relationship.', italics: true, color: TEAL_DK, font: FONT, size: 20 })] }));

// ===================== SOURCES =====================
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h1('Sources'));
const sources = [
  ['Warhacker event page (dates, format, "agenda on acceptance")', 'https://defenseunicorns.com/warhacker/'],
  ['Defense Unicorns events list (Warhacker 16\u201319 Jun)', 'https://defenseunicorns.com/events/'],
  ['DU x Spire/NASCAR @ Naval Base Coronado (venue context)', 'https://defenseunicorns.com/defense-unicorns-partners-with-mcdowell-spire-motorsports/'],
  ['DU April 2026 newsletter (format: build, no slide decks)', 'https://www.linkedin.com/pulse/april-2026-edition-defense-unicorns-jglge'],
  ['DU "Problems Accepted" (P1\u2013P6 problem owners)', 'https://www.linkedin.com/posts/defense-unicorns_warhacker-problems-accepted-activity-7454892282723475456-KRLH'],
  ['Expedia \u2014 San Diego Convention Center hotels + June prices', 'https://www.expedia.com/San-Diego-Convention-Center-Hotels.0-l6125294-0.Travel-Guide-Filter-Hotels'],
  ['Gaslamp Quarter dining directory', 'https://gaslamp.org/listings/category/dine/'],
  ['DU $136M Series B press release (Petraeus, investors)', 'https://defenseunicorns.com/defense-unicorns-raises-136-million-series-b/'],
  ['Intelligence Community News \u2014 Series B investor list', 'https://intelligencecommunitynews.com/defense-unicorns-reaches-1b-valuation-in-series-b-round/'],
  ['DU company / leadership page (Slaughter, McCoy, Greene)', 'https://defenseunicorns.com/company/'],
  ['Andrew Greene LinkedIn', 'https://www.linkedin.com/in/andrewgxyz'],
  ['Slaughter LinkedIn (early backers)', 'https://www.linkedin.com/posts/robertcslaughter_a-little-less-than-5-years-ago-i-started-activity-7417207628377948160-nX1H'],
  ['RTL-SDR Blog V4 (buy)', 'https://www.rtl-sdr.com/buy-rtl-sdr-dvb-t-dongles/'],
  ['HackRF One \u2014 Great Scott Gadgets', 'https://greatscottgadgets.com/hackrf/one/'],
  ['Starlink Mini', 'https://www.starlink.com/'],
];
for (const [name, url] of sources) {
  children.push(new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 40 }, children: [t(name + ' \u2014 '), link(url, url)] }));
}

// ===================== BUILD =====================
const doc = new Document({
  creator: 'Yachay (SZL Holdings Operations)',
  title: 'SZL Warhacker Go-Bag',
  description: 'Founder go-bag for the Warhacker San Diego physical demo, 16-19 June 2026',
  styles: {
    default: { document: { run: { font: FONT, size: 22, color: INK } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 34, bold: true, font: FONT, color: TEAL_DK }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: INK }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { run: { color: TEAL }, paragraph: { indent: { left: 540, hanging: 280 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 280 } } } },
      ] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    children,
  }],
});

const out = '/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31/operations/SZL_WARHACKER_GOBAG.docx';
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log('WROTE', out, buf.length, 'bytes'); });
