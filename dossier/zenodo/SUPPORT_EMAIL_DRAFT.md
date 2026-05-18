<!-- doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header. -->
# Zenodo Support — DOI re-mint request (ready to send)

**To:** info@zenodo.org
**Subject:** DOI 10.5281/zenodo.19983066 not registered with DataCite — please re-mint

---

Hello Zenodo Support,

I'm writing about a published record on Zenodo whose DOI never registered
with DataCite, so it returns 404 from doi.org while the underlying record
itself is fine.

Record details:

- Record ID: **19983066**
- DOI: **10.5281/zenodo.19983066**
- Concept DOI: 10.5281/zenodo.19944926
- Title: "The Loop Is the Product"
- Owner: Stephen P. Lutar Jr. (ORCID 0009-0001-0110-4173)
- Account email: stephenlutar2@gmail.com
- Published: 2026-05-02
- Direct URL (works): https://zenodo.org/records/19983066

What I am observing (verified after >24 hours, not a propagation delay):

1. Zenodo API reports the record as `state=done`, `status=published`,
   `submitted=true`.
2. The record loads correctly at https://zenodo.org/records/19983066 (HTTP 200).
3. https://doi.org/10.5281/zenodo.19983066 returns **HTTP 404 — DOI NOT FOUND**.
4. https://api.datacite.org/dois/10.5281/zenodo.19983066 returns
   **HTTP 404 — "The resource you are looking for doesn't exist."**
5. https://hdl.handle.net/api/handles/10.5281/zenodo.19983066 also returns 404.
6. By contrast, the concept DOI 10.5281/zenodo.19944926 is `findable` in
   DataCite (registered 2026-05-01) and resolves correctly via doi.org.
7. Older versions of this same work (19944926, 19944926, 19867281) all
   resolve correctly via doi.org with HTTP 302 redirects.

Diagnosis: this looks like a one-off Zenodo→DataCite minting failure for
this specific version. The record was published successfully on Zenodo
but the DOI was never handed off to DataCite for registration.

Could you please re-trigger DataCite registration for DOI
10.5281/zenodo.19983066? If that is not possible from your side, please
let me know what the recommended remediation is — I would prefer not to
publish a new version solely to work around this, since the v3 paper has
already been cited externally with this DOI.

Thank you for your help.

Best regards,
Stephen P. Lutar Jr.
Founder & CEO, SZL Holdings
ORCID: 0009-0001-0110-4173
stephenlutar2@gmail.com
