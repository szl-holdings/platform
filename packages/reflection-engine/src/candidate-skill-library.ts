import type { CandidateSkill } from './types.js';

export interface CandidateSkillLibraryQuery {
  status?: CandidateSkill['status'];
  category?: CandidateSkill['category'];
  limit?: number;
  offset?: number;
}

export interface CandidateSkillLibrary {
  registerDraft(skill: CandidateSkill): void;
  getDraft(skillId: string): CandidateSkill | undefined;
  listDrafts(query?: CandidateSkillLibraryQuery): CandidateSkill[];
  promote(skillId: string): boolean;
  count(status?: CandidateSkill['status']): number;
}

export class InMemoryCandidateSkillLibrary implements CandidateSkillLibrary {
  private readonly skills = new Map<string, CandidateSkill>();

  registerDraft(skill: CandidateSkill): void {
    const existing = this.skills.get(skill.skillId);
    if (existing) {
      return;
    }
    this.skills.set(skill.skillId, { ...skill, status: 'draft' });
  }

  getDraft(skillId: string): CandidateSkill | undefined {
    return this.skills.get(skillId);
  }

  listDrafts(query?: CandidateSkillLibraryQuery): CandidateSkill[] {
    let results = Array.from(this.skills.values());

    if (query?.status) {
      results = results.filter((s) => s.status === query.status);
    }
    if (query?.category) {
      results = results.filter((s) => s.category === query.category);
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const offset = query?.offset ?? 0;
    const limit = query?.limit ?? 50;
    return results.slice(offset, offset + limit);
  }

  promote(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;
    this.skills.set(skillId, { ...skill, status: 'active' });
    return true;
  }

  count(status?: CandidateSkill['status']): number {
    if (!status) return this.skills.size;
    let n = 0;
    for (const s of this.skills.values()) {
      if (s.status === status) n++;
    }
    return n;
  }
}

export const defaultCandidateSkillLibrary = new InMemoryCandidateSkillLibrary();
