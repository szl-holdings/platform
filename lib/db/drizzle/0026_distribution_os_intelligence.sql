CREATE TABLE IF NOT EXISTS "dos_virality_scores" (
  "id" SERIAL PRIMARY KEY,
  "article_id" INTEGER REFERENCES "dos_articles"("id") ON DELETE CASCADE,
  "content_title" TEXT NOT NULL,
  "content_type" TEXT NOT NULL DEFAULT 'article',
  "predicted_score" INTEGER NOT NULL DEFAULT 0,
  "engagement_probability" INTEGER NOT NULL DEFAULT 0,
  "reach_estimate" INTEGER NOT NULL DEFAULT 0,
  "conversion_probability" INTEGER NOT NULL DEFAULT 0,
  "trend_alignment" INTEGER NOT NULL DEFAULT 0,
  "audience_resonance" INTEGER NOT NULL DEFAULT 0,
  "competitive_gap" INTEGER NOT NULL DEFAULT 0,
  "recommendations" JSONB,
  "signals" JSONB,
  "scored_at" TIMESTAMP NOT NULL DEFAULT now(),
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "dos_audience_segments" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "size" INTEGER NOT NULL DEFAULT 0,
  "growth_rate" INTEGER NOT NULL DEFAULT 0,
  "engagement_score" INTEGER NOT NULL DEFAULT 0,
  "psychographics" JSONB,
  "top_content_types" JSONB,
  "top_topics" JSONB,
  "peak_engagement_hour" INTEGER,
  "preferred_platforms" JSONB,
  "avg_read_time" INTEGER,
  "conversion_rate" INTEGER NOT NULL DEFAULT 0,
  "revenue_contribution" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "dos_ab_tests" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "content_id" INTEGER,
  "content_type" TEXT NOT NULL DEFAULT 'article',
  "test_type" TEXT NOT NULL DEFAULT 'headline',
  "status" TEXT NOT NULL DEFAULT 'draft',
  "variants" JSONB,
  "traffic_split" JSONB,
  "winner_variant_id" TEXT,
  "significance_level" INTEGER NOT NULL DEFAULT 95,
  "current_significance" INTEGER NOT NULL DEFAULT 0,
  "total_impressions" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMP,
  "concluded_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "dos_monetization_rules" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "rule_type" TEXT NOT NULL DEFAULT 'sponsorship',
  "target_segment_id" INTEGER REFERENCES "dos_audience_segments"("id") ON DELETE SET NULL,
  "base_rate" INTEGER NOT NULL DEFAULT 0,
  "current_rate" INTEGER NOT NULL DEFAULT 0,
  "demand_score" INTEGER NOT NULL DEFAULT 50,
  "placement_config" JSONB,
  "revenue_attributed" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_adjusted_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "dos_seo_keywords" (
  "id" SERIAL PRIMARY KEY,
  "keyword" TEXT NOT NULL,
  "search_volume" INTEGER NOT NULL DEFAULT 0,
  "difficulty" INTEGER NOT NULL DEFAULT 0,
  "current_rank" INTEGER,
  "target_rank" INTEGER,
  "trend" TEXT NOT NULL DEFAULT 'stable',
  "category" TEXT NOT NULL DEFAULT 'target',
  "opportunity_score" INTEGER NOT NULL DEFAULT 0,
  "linked_article_id" INTEGER REFERENCES "dos_articles"("id") ON DELETE SET NULL,
  "competitor_ranks" JSONB,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "dos_trend_signals" (
  "id" SERIAL PRIMARY KEY,
  "topic" TEXT NOT NULL,
  "platform" TEXT NOT NULL DEFAULT 'x',
  "velocity_score" INTEGER NOT NULL DEFAULT 0,
  "sentiment_score" INTEGER NOT NULL DEFAULT 50,
  "hours_to_mainstream" INTEGER,
  "content_opportunity" TEXT,
  "related_keywords" JSONB,
  "sample_posts" JSONB,
  "status" TEXT NOT NULL DEFAULT 'emerging',
  "action_taken" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "dos_content_lifecycle" (
  "id" SERIAL PRIMARY KEY,
  "article_id" INTEGER REFERENCES "dos_articles"("id") ON DELETE CASCADE,
  "content_title" TEXT NOT NULL,
  "lifecycle_stage" TEXT NOT NULL DEFAULT 'ideation',
  "content_health_score" INTEGER NOT NULL DEFAULT 0,
  "is_evergreen" BOOLEAN NOT NULL DEFAULT false,
  "total_views" INTEGER NOT NULL DEFAULT 0,
  "monthly_views" INTEGER NOT NULL DEFAULT 0,
  "last_viewed_at" TIMESTAMP,
  "redistribution_count" INTEGER NOT NULL DEFAULT 0,
  "last_redistributed_at" TIMESTAMP,
  "recommended_action" TEXT NOT NULL DEFAULT 'none',
  "revenue_generated" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);
