# How We Built Vessels: Lessons from Maritime Domain Intelligence

Maritime intelligence is one of the most underserved enterprise domains. When we started building Vessels, we expected the technical challenges to be the hard part — ingesting AIS data at scale, normalizing weather feeds, building compliance databases. Those were solvable problems.

The real challenge was earning trust in a domain that has been burned by technology promises before.

## The Maritime Technology Gap

The maritime industry has a complicated relationship with technology. Every few years, a well-funded startup arrives with promises of "digital transformation" and "the Uber of shipping." Most of them build beautiful interfaces on top of data sources that maritime professionals already access, charge enterprise prices for what amounts to a nicer map, and fail within three years.

The result is a deep and justified skepticism toward technology vendors. Maritime professionals — ship managers, charterers, port operators, compliance officers — have seen too many demos that look impressive and products that do not work at sea.

## How We Earned Trust

Vessels earned trust by doing three things that most maritime tech startups skip:

**1. We Built for Intermittent Connectivity**

Most maritime software assumes continuous internet connectivity. This is a fantasy. Vessels at sea have satellite connections that are expensive, slow, and intermittent. Any system that depends on a constant connection to a cloud backend is effectively unusable for the hours — sometimes days — when connectivity drops.

Vessels was designed for disconnected operation from day one. The mobile app syncs when connectivity is available and operates fully offline when it is not. When connectivity is restored, all offline actions are reconciled with the central system automatically.

**2. We Respected Domain Vocabulary**

Maritime has its own vocabulary — charterers, laytime, demurrage, port state control, ISPS compliance, Annex VI requirements. Most technology vendors flatten this vocabulary into generic terms because their systems were designed for general use and adapted for maritime.

Vessels uses maritime vocabulary natively. A voyage is a voyage, not a "trip." A charterer is a charterer, not a "customer." This seems like a small thing, but it is the difference between a system that feels like it was built for maritime professionals and one that feels like it was repurposed from a logistics startup.

**3. We Showed the Work**

When Vessels makes a recommendation — a route suggestion, a compliance alert, a risk assessment — it shows the source data, the analysis method, and the confidence level. Maritime professionals do not trust black boxes. They trust systems that show their work.

Every recommendation in Vessels includes source attribution: which AIS data points informed the analysis, which weather model was used, which regulatory database was consulted. If a professional disagrees with the recommendation, they can see exactly where their assessment differs from the system's — and provide feedback that improves future recommendations.

## Technical Lessons

**AIS data is noisy.** Position reports are sometimes delayed, sometimes duplicated, sometimes clearly erroneous (a vessel cannot be in two oceans simultaneously). Building a reliable maritime intelligence system requires robust data quality controls, not just data ingestion.

**Weather integration is critical.** A vessel tracking system without weather context is incomplete. Route assessments, ETA predictions, and risk evaluations all depend on weather data — not just current conditions, but forecasts along the entire planned route.

**Compliance is a moving target.** Maritime regulations change frequently, vary by jurisdiction, and often conflict with each other. Building a compliance engine that stays current requires continuous monitoring of regulatory sources and rapid propagation of changes to affected vessels.

## The Result

Vessels provides maritime operators with something most have never had: a single intelligence surface that combines fleet tracking, voyage management, compliance monitoring, and commercial analytics in one system.

Not another map with dots. An intelligence platform that understands the maritime domain as well as the professionals who use it.

---

*Stephen Lutar is the Founder & CEO of SZL Holdings. [szlholdings.com](https://szlholdings.com)*
