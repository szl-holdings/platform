# Carlota Jo Consulting: Demo Script

**Duration:** 4–6 minutes  
**Persona:** Prospect / Client  
**URL:** `/carlota-jo/`  
**Pre-requisite:** None (public site); booking integration uses Outlook Calendar

---

## Pre-Demo Checklist

- [ ] Home page loads with live World Bank / BLS data in the insights section
- [ ] Booking flow accessible at `/carlota-jo/booking`
- [ ] Services page shows consulting service offerings
- [ ] Contact form accessible

---

## Step 1 — Home Page (1 min)

**URL:** `/carlota-jo/`

> "Carlota Jo is the consulting and advisory platform. The home page opens with live economic insights — current data from the World Bank and Bureau of Labor Statistics."

Point to the live feed indicators.

> "These numbers update from live APIs — not cached. When the BLS releases new employment figures, this page reflects them within the hour."

---

## Step 2 — Services (1 min)

**URL:** `/carlota-jo/services`

> "The services catalog covers advisory, fractional CFO, strategy, and expertise brokering. Each service has a defined engagement structure, pricing transparency, and a booking flow."

---

## Step 3 — Booking (2 min)

**URL:** `/carlota-jo/booking`

> "The booking system is live — it connects directly to Outlook Calendar via the Microsoft Graph API. When a client books a slot, it appears in the calendar immediately."

Demonstrate the booking form (do not complete the booking unless in a safe test state).

> "When a booking is confirmed, the client receives a confirmation email, the session appears in Outlook, and the engagement record is created in the platform's time-tracking system."

---

## Step 4 — Insights (1 min)

**URL:** `/carlota-jo/insights`

> "The insights section surfaces advisory content connected to live economic signals. When BLS releases a jobs report, the advisory team can publish context the same day."

---

## Avoidance Guide

- Do NOT demo Stripe payment if Stripe is in test mode — explain "payment processing activates at commercial launch"
- Expert Network / Marketplace is seeded — frame as "the marketplace is in early design partner phase; the infrastructure is built"
- Google OAuth sign-in is unavailable without `GOOGLE_CLIENT_ID` — do not click Google sign-in button

---

## Questions to Anticipate

**"Is this a real business or a demo?"**  
> "Carlota Jo is a live consulting practice. The booking system, time-tracking, and invoicing are all operational. The marketplace layer is in design-partner phase."

**"How does billing work?"**  
> "Invoices are generated automatically from time entries. Stripe handles payment collection. In the current phase, invoices are sent directly — the Stripe payment flow activates when the practice scales to subscription-based retainers."
