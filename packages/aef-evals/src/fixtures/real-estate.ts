import type { GoldenFixtureSet } from "../types.js";

export const realEstateFixtures: GoldenFixtureSet = {
  fixtureSetId: "terra-real-estate-intel-golden-v1",
  profileId: "terra_real_estate_intel",
  domain: "real-estate",
  description:
    "Golden retrieval fixtures for the Terra Real Estate Intelligence profile. Covers parcel ID lookup, APN search, comparable transaction retrieval, zoning, and lease analysis.",
  queries: [
    {
      queryId: "re-q001",
      query: "parcel 123-456-789 Dallas County TX property assessment",
      relevantChunkIds: ["chunk-parcel-123-456-789-assessment", "chunk-parcel-123-456-789-deed"],
      notes: "Parcel ID exact match should dominate results over county-level assessments.",
    },
    {
      queryId: "re-q002",
      query: "APN 123-456-789-0 comparable sales cap rate office building",
      relevantChunkIds: ["chunk-apn-123-456-789-0-comps", "chunk-office-cap-rate-dallas-2024"],
    },
    {
      queryId: "re-q003",
      query: "lease CONTRACT-2024-LEASE-001 triple net tenant occupancy",
      relevantChunkIds: ["chunk-lease-2024-001-terms", "chunk-lease-2024-001-nnn-clauses"],
    },
    {
      queryId: "re-q004",
      query: "zoning permit commercial mixed-use downtown redevelopment",
      relevantChunkIds: ["chunk-zoning-mixed-use-downtown", "chunk-permit-2024-redevelopment"],
    },
    {
      queryId: "re-q005",
      query: "NOI cap rate multifamily portfolio Q3 2024",
      relevantChunkIds: ["chunk-multifamily-noi-q3-2024", "chunk-portfolio-cap-rate-analysis"],
    },
  ],
  corpus: [
    {
      chunkId: "chunk-parcel-123-456-789-assessment",
      text: "Dallas County TX appraisal district property assessment for parcel 123-456-789: assessed value $4.8 million for the 2024 tax year, land 0.62 acres, improvements 18,400 sq ft office building. Parcel 123-456-789 located in central Dallas.",
    },
    {
      chunkId: "chunk-parcel-123-456-789-deed",
      text: "Recorded deed for parcel 123-456-789 in Dallas County, Texas, dated 2019-11-04. Grantor and grantee parties listed; conveyance is fee simple. Deed cross-references the Dallas County tax roll for parcel 123-456-789.",
    },
    {
      chunkId: "chunk-apn-123-456-789-0-comps",
      text: "Comparable sales analysis for APN 123-456-789-0 office building: three recent sales within 1 mile of the subject, average price per sq ft $268, average cap rate 7.1%. APN 123-456-789-0 comps support a current valuation in line with market.",
    },
    {
      chunkId: "chunk-office-cap-rate-dallas-2024",
      text: "Dallas office market cap rate survey 2024: Class A buildings trading at 6.4% to 6.9%, Class B at 7.0% to 7.8%. Cap rate expansion of 60 bps year over year reflects higher financing costs for office assets.",
    },
    {
      chunkId: "chunk-lease-2024-001-terms",
      text: "Lease CONTRACT-2024-LEASE-001 key terms: ten-year primary term, triple net (NNN) structure, base rent $32 per sq ft with 2.5% annual escalations. Tenant occupies 14,200 sq ft of the property under lease CONTRACT-2024-LEASE-001.",
    },
    {
      chunkId: "chunk-lease-2024-001-nnn-clauses",
      text: "NNN clauses for lease CONTRACT-2024-LEASE-001: tenant pays its pro-rata share of property taxes, insurance, and common-area maintenance. Triple net pass-throughs are reconciled annually under the lease.",
    },
    {
      chunkId: "chunk-zoning-mixed-use-downtown",
      text: "Downtown zoning code amendment establishes a mixed-use commercial district allowing ground-floor retail with residential above, building heights up to 180 feet. Mixed-use zoning is intended to support downtown redevelopment.",
    },
    {
      chunkId: "chunk-permit-2024-redevelopment",
      text: "Building permit issued 2024-03-22 for a downtown commercial redevelopment project: conversion of a 1970s office tower into a mixed-use development with 220 residential units and ground-floor retail.",
    },
    {
      chunkId: "chunk-multifamily-noi-q3-2024",
      text: "Multifamily portfolio Q3 2024 NOI summary: total net operating income $42.1 million across 14 garden-style assets, NOI growth of 4.2% year over year driven by rent escalations and stable occupancy.",
    },
    {
      chunkId: "chunk-portfolio-cap-rate-analysis",
      text: "Portfolio-level cap rate analysis for the multifamily holdings as of Q3 2024: weighted average cap rate 5.4% on trailing twelve-month NOI, with submarket cap rates ranging 4.9% to 6.1%.",
    },
    { chunkId: "chunk-distractor-recipe", text: "Recipe for sourdough boule using a 75 percent hydration dough and a 24-hour cold retard." },
    { chunkId: "chunk-distractor-music", text: "Concert review for a touring jazz quartet performing at a downtown venue last weekend." },
    { chunkId: "chunk-distractor-tax-form", text: "Instructions for preparing personal income tax returns including standard deduction and credit eligibility." },
    { chunkId: "chunk-distractor-software", text: "Release notes for a developer tooling package introducing a new CLI command and bug fixes." },
    { chunkId: "chunk-distractor-fitness", text: "Half marathon training plan for novice runners building from a 5k base over twelve weeks." },
  ],
};
