import { pool } from "@szl-holdings/db";

export interface Gene {
  trait: string;
  value: number | string | boolean;
  weight: number;
  mutable: boolean;
}

export interface Genome {
  id?: number;
  genes: Gene[];
  fitnessScore: number;
  generation: number;
  parentGenomeId?: number;
  mutationHistory: MutationRecord[];
  isElite?: boolean;
  phenotype?: Record<string, unknown>;
}

export interface MutationRecord {
  trait: string;
  oldValue: unknown;
  newValue: unknown;
  generation: number;
  timestamp: string;
  strategy: string;
}

export interface PopulationConfig {
  populationSize: number;
  eliteCount: number;
  mutationRate: number;
  crossoverRate: number;
  selectionStrategy: "tournament" | "roulette" | "rank" | "elitist";
  convergenceThreshold: number;
  maxGenerations: number;
}

const DEFAULT_CONFIG: PopulationConfig = {
  populationSize: 20,
  eliteCount: 3,
  mutationRate: 0.15,
  crossoverRate: 0.7,
  selectionStrategy: "tournament",
  convergenceThreshold: 0.01,
  maxGenerations: 100,
};

export class EvolutionEngine {
  private config: PopulationConfig;

  constructor(config: Partial<PopulationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  initializePopulation(geneTemplate: Gene[], size?: number): Genome[] {
    const popSize = size || this.config.populationSize;
    const population: Genome[] = [];

    for (let i = 0; i < popSize; i++) {
      const genes = geneTemplate.map((template) => {
        const gene = { ...template };
        if (gene.mutable) {
          gene.value = this.randomizeGeneValue(gene);
        }
        return gene;
      });

      population.push({
        genes,
        fitnessScore: 0,
        generation: 0,
        mutationHistory: [],
      });
    }

    return population;
  }

  evaluateFitness(genome: Genome, objectiveFunction: (genes: Gene[]) => number): number {
    const score = objectiveFunction(genome.genes);
    genome.fitnessScore = Math.max(0, Math.min(1, score));
    return genome.fitnessScore;
  }

  select(population: Genome[]): Genome {
    switch (this.config.selectionStrategy) {
      case "tournament":
        return this.tournamentSelection(population);
      case "roulette":
        return this.rouletteSelection(population);
      case "rank":
        return this.rankSelection(population);
      case "elitist":
        return this.elitistSelection(population);
      default:
        return this.tournamentSelection(population);
    }
  }

  crossover(parent1: Genome, parent2: Genome, generation: number): Genome[] {
    if (Math.random() > this.config.crossoverRate) {
      return [{ ...parent1, generation }, { ...parent2, generation }];
    }

    const crossoverPoint = Math.floor(Math.random() * parent1.genes.length);

    const child1Genes = [
      ...parent1.genes.slice(0, crossoverPoint).map((g) => ({ ...g })),
      ...parent2.genes.slice(crossoverPoint).map((g) => ({ ...g })),
    ];

    const child2Genes = [
      ...parent2.genes.slice(0, crossoverPoint).map((g) => ({ ...g })),
      ...parent1.genes.slice(crossoverPoint).map((g) => ({ ...g })),
    ];

    return [
      {
        genes: child1Genes,
        fitnessScore: 0,
        generation,
        parentGenomeId: parent1.id,
        mutationHistory: [],
      },
      {
        genes: child2Genes,
        fitnessScore: 0,
        generation,
        parentGenomeId: parent2.id,
        mutationHistory: [],
      },
    ];
  }

  mutate(genome: Genome): Genome {
    const mutated = { ...genome, genes: genome.genes.map((g) => ({ ...g })) };

    for (const gene of mutated.genes) {
      if (gene.mutable && Math.random() < this.config.mutationRate) {
        const oldValue = gene.value;
        gene.value = this.mutateGeneValue(gene);

        mutated.mutationHistory = [
          ...mutated.mutationHistory,
          {
            trait: gene.trait,
            oldValue,
            newValue: gene.value,
            generation: genome.generation,
            timestamp: new Date().toISOString(),
            strategy: this.getMutationStrategy(gene),
          },
        ];
      }
    }

    return mutated;
  }

  evolve(
    population: Genome[],
    objectiveFunction: (genes: Gene[]) => number
  ): { nextGeneration: Genome[]; stats: GenerationStats } {
    for (const genome of population) {
      this.evaluateFitness(genome, objectiveFunction);
    }

    const sorted = [...population].sort((a, b) => b.fitnessScore - a.fitnessScore);
    const generation = sorted[0].generation + 1;

    const elites = sorted.slice(0, this.config.eliteCount).map((g) => ({
      ...g,
      generation,
      isElite: true,
    }));

    const nextGeneration: Genome[] = [...elites];

    while (nextGeneration.length < this.config.populationSize) {
      const parent1 = this.select(sorted);
      const parent2 = this.select(sorted);
      const [child1, child2] = this.crossover(parent1, parent2, generation);

      nextGeneration.push(this.mutate(child1));
      if (nextGeneration.length < this.config.populationSize) {
        nextGeneration.push(this.mutate(child2));
      }
    }

    const fitnessValues = sorted.map((g) => g.fitnessScore);
    const stats: GenerationStats = {
      generation,
      bestFitness: fitnessValues[0],
      avgFitness: fitnessValues.reduce((s, f) => s + f, 0) / fitnessValues.length,
      worstFitness: fitnessValues[fitnessValues.length - 1],
      diversity: this.calculateDiversity(sorted),
      eliteCount: this.config.eliteCount,
      mutationCount: nextGeneration.reduce((c, g) => c + g.mutationHistory.length, 0),
      populationSize: nextGeneration.length,
    };

    return { nextGeneration, stats };
  }

  hasConverged(fitnessHistory: GenerationStats[]): boolean {
    if (fitnessHistory.length < 5) return false;
    const recent = fitnessHistory.slice(-5);
    const maxDelta = Math.max(
      ...recent.slice(1).map((s, i) => Math.abs(s.bestFitness - recent[i].bestFitness))
    );
    return maxDelta < this.config.convergenceThreshold;
  }

  private tournamentSelection(population: Genome[], tournamentSize = 3): Genome {
    const tournament: Genome[] = [];
    for (let i = 0; i < tournamentSize; i++) {
      tournament.push(population[Math.floor(Math.random() * population.length)]);
    }
    return tournament.sort((a, b) => b.fitnessScore - a.fitnessScore)[0];
  }

  private rouletteSelection(population: Genome[]): Genome {
    const totalFitness = population.reduce((s, g) => s + g.fitnessScore, 0);
    if (totalFitness === 0) return population[Math.floor(Math.random() * population.length)];
    let spin = Math.random() * totalFitness;
    for (const genome of population) {
      spin -= genome.fitnessScore;
      if (spin <= 0) return genome;
    }
    return population[population.length - 1];
  }

  private rankSelection(population: Genome[]): Genome {
    const sorted = [...population].sort((a, b) => b.fitnessScore - a.fitnessScore);
    const totalRank = (sorted.length * (sorted.length + 1)) / 2;
    let spin = Math.random() * totalRank;
    for (let i = 0; i < sorted.length; i++) {
      spin -= sorted.length - i;
      if (spin <= 0) return sorted[i];
    }
    return sorted[0];
  }

  private elitistSelection(population: Genome[]): Genome {
    const sorted = [...population].sort((a, b) => b.fitnessScore - a.fitnessScore);
    const topHalf = sorted.slice(0, Math.ceil(sorted.length / 2));
    return topHalf[Math.floor(Math.random() * topHalf.length)];
  }

  private randomizeGeneValue(gene: Gene): number | string | boolean {
    if (typeof gene.value === "number") {
      return gene.value * (0.5 + Math.random());
    }
    if (typeof gene.value === "boolean") {
      return Math.random() > 0.5;
    }
    return gene.value;
  }

  private mutateGeneValue(gene: Gene): number | string | boolean {
    if (typeof gene.value === "number") {
      const delta = gene.value * 0.2 * (Math.random() * 2 - 1);
      return Math.max(0, gene.value + delta);
    }
    if (typeof gene.value === "boolean") {
      return !gene.value;
    }
    return gene.value;
  }

  private getMutationStrategy(gene: Gene): string {
    if (typeof gene.value === "number") return "gaussian_perturbation";
    if (typeof gene.value === "boolean") return "bit_flip";
    return "random_reset";
  }

  private calculateDiversity(population: Genome[]): number {
    if (population.length < 2) return 0;
    const numericGenes = population[0].genes
      .map((g, i) => (typeof g.value === "number" ? i : -1))
      .filter((i) => i >= 0);
    if (numericGenes.length === 0) return 0;

    let totalVariance = 0;
    for (const geneIdx of numericGenes) {
      const values = population.map((g) => g.genes[geneIdx].value as number);
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
      totalVariance += variance;
    }
    return totalVariance / numericGenes.length;
  }
}

export interface GenerationStats {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  worstFitness: number;
  diversity: number;
  eliteCount: number;
  mutationCount: number;
  populationSize: number;
}

export async function persistPopulation(
  orgId: number,
  populationId: number,
  genomes: Genome[],
  stats: GenerationStats
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE alloy_populations SET generation = $1, best_fitness = $2, avg_fitness = $3,
       fitness_history = fitness_history || $4::jsonb, status = $5, updated_at = NOW()
       WHERE id = $6`,
      [stats.generation, stats.bestFitness, stats.avgFitness, JSON.stringify([stats]), "evolving", populationId]
    );

    for (const genome of genomes) {
      await client.query(
        `INSERT INTO alloy_genomes (org_id, population_id, generation, parent_genome_id, genes, phenotype,
         fitness_score, mutation_history, is_elite, is_active, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, '{}')`,
        [
          orgId,
          populationId,
          genome.generation,
          genome.parentGenomeId || null,
          JSON.stringify(genome.genes),
          JSON.stringify(genome.phenotype || {}),
          genome.fitnessScore,
          JSON.stringify(genome.mutationHistory),
          genome.isElite ?? false,
        ]
      );
    }

    await client.query(
      `INSERT INTO alloy_evolution_events (org_id, population_id, event_type, generation, details)
       VALUES ($1, $2, 'generation_complete', $3, $4)`,
      [orgId, populationId, stats.generation, JSON.stringify(stats)]
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export function createWorkflowFitnessFunction(weights: {
  successWeight: number;
  latencyWeight: number;
  costWeight: number;
  accuracyWeight: number;
}): (genes: Gene[]) => number {
  return (genes: Gene[]) => {
    let score = 0;
    const geneMap = new Map(genes.map((g) => [g.trait, g]));

    const successRate = geneMap.get("success_rate");
    if (successRate && typeof successRate.value === "number") {
      score += successRate.value * weights.successWeight;
    }

    const latency = geneMap.get("avg_latency_ms");
    if (latency && typeof latency.value === "number") {
      score += Math.max(0, 1 - latency.value / 10000) * weights.latencyWeight;
    }

    const cost = geneMap.get("cost_per_run");
    if (cost && typeof cost.value === "number") {
      score += Math.max(0, 1 - cost.value / 100) * weights.costWeight;
    }

    const accuracy = geneMap.get("accuracy");
    if (accuracy && typeof accuracy.value === "number") {
      score += accuracy.value * weights.accuracyWeight;
    }

    const totalWeight =
      weights.successWeight + weights.latencyWeight + weights.costWeight + weights.accuracyWeight;
    return totalWeight > 0 ? score / totalWeight : 0;
  };
}
