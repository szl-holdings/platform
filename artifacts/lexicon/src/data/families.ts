export interface FamilyNode {
  id: string;
  label: string;
  year?: number;
  description?: string;
  children?: FamilyNode[];
  isLeaf?: boolean;
  color?: string;
}

export interface FamilyTree {
  id: string;
  name: string;
  description: string;
  color: string;
  root: FamilyNode;
}

export const FAMILY_TREES: FamilyTree[] = [
  {
    id: 'gpl',
    name: 'GPL / LGPL / AGPL Family',
    description: 'The GNU copyleft license family, maintained by the Free Software Foundation.',
    color: '#f87171',
    root: {
      id: 'gpl-1.0',
      label: 'GPL 1.0',
      year: 1989,
      description: 'Original GNU GPL',
      children: [
        {
          id: 'gpl-2.0',
          label: 'GPL 2.0',
          year: 1991,
          description: 'Added liberty or death clause',
          children: [
            {
              id: 'gpl-3.0',
              label: 'GPL 3.0',
              year: 2007,
              description: 'Added anti-tivoization, patent protection',
              children: [
                {
                  id: 'agpl-3.0',
                  label: 'AGPL 3.0',
                  year: 2007,
                  description: 'GPL 3.0 + network-use clause',
                  isLeaf: true,
                },
              ],
            },
            {
              id: 'lgpl-2.1',
              label: 'LGPL 2.1',
              year: 1999,
              description: 'Weak copyleft for libraries',
              children: [
                {
                  id: 'lgpl-3.0',
                  label: 'LGPL 3.0',
                  year: 2007,
                  description: 'LGPL built on GPL 3.0',
                  isLeaf: true,
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'bsd',
    name: 'BSD License Family',
    description: 'The Berkeley Software Distribution license family, one of the oldest open source license families.',
    color: '#a3e635',
    root: {
      id: 'bsd',
      label: 'BSD 4-Clause (Original)',
      year: 1980,
      description: 'Original BSD with advertising clause',
      children: [
        {
          id: 'bsd-3-clause',
          label: 'BSD 3-Clause',
          year: 1990,
          description: 'Removed advertising clause, added non-endorsement',
          children: [
            {
              id: 'bsd-2-clause',
              label: 'BSD 2-Clause',
              year: 1999,
              description: 'Simplified — removed endorsement clause',
              children: [
                {
                  id: '0bsd',
                  label: 'BSD 0-Clause',
                  year: 2006,
                  description: 'No conditions at all',
                  isLeaf: true,
                },
                {
                  id: 'isc',
                  label: 'ISC',
                  year: 1995,
                  description: 'Simplified BSD equivalent',
                  isLeaf: true,
                },
              ],
            },
            {
              id: 'bsd-3-clause-clear',
              label: 'BSD 3-Clause Clear',
              year: 2010,
              description: 'Explicit no-patent grant',
              isLeaf: true,
            },
          ],
        },
      ],
    },
  },
  {
    id: 'creative-commons',
    name: 'Creative Commons Family',
    description: 'The Creative Commons license family, designed for creative works. Versions 4.0 are current.',
    color: '#38bdf8',
    root: {
      id: 'cc-root',
      label: 'Creative Commons',
      year: 2001,
      description: 'Founded by Lawrence Lessig',
      children: [
        {
          id: 'cc0-1.0',
          label: 'CC0 1.0',
          year: 2009,
          description: 'Public domain dedication',
          isLeaf: true,
          color: '#67e8f9',
        },
        {
          id: 'cc-by-root',
          label: 'CC BY (Attribution)',
          description: 'Attribution required',
          children: [
            { id: 'cc-by-2.0', label: 'CC BY 2.0', year: 2004, isLeaf: true },
            { id: 'cc-by-2.5', label: 'CC BY 2.5', year: 2005, isLeaf: true },
            { id: 'cc-by-3.0', label: 'CC BY 3.0', year: 2007, isLeaf: true },
            { id: 'cc-by-4.0', label: 'CC BY 4.0', year: 2013, description: 'Current', isLeaf: true },
          ],
        },
        {
          id: 'cc-by-sa-root',
          label: 'CC BY-SA (ShareAlike)',
          description: 'Attribution + share-alike',
          children: [
            { id: 'cc-by-sa-3.0', label: 'CC BY-SA 3.0', year: 2007, isLeaf: true },
            { id: 'cc-by-sa-4.0', label: 'CC BY-SA 4.0', year: 2013, description: 'Current', isLeaf: true },
          ],
        },
        {
          id: 'cc-by-nc-root',
          label: 'CC BY-NC (NonCommercial)',
          description: 'Attribution + non-commercial',
          children: [
            { id: 'cc-by-nc-2.0', label: 'CC BY-NC 2.0', year: 2004, isLeaf: true },
            { id: 'cc-by-nc-3.0', label: 'CC BY-NC 3.0', year: 2007, isLeaf: true },
            { id: 'cc-by-nc-4.0', label: 'CC BY-NC 4.0', year: 2013, description: 'Current', isLeaf: true },
          ],
        },
        {
          id: 'cc-by-nd-root',
          label: 'CC BY-ND (NoDerivatives)',
          description: 'Attribution + no derivatives',
          children: [
            { id: 'cc-by-nd-4.0', label: 'CC BY-ND 4.0', year: 2013, isLeaf: true },
          ],
        },
        {
          id: 'cc-by-nc-sa-root',
          label: 'CC BY-NC-SA',
          description: 'Non-commercial + share-alike',
          children: [
            { id: 'cc-by-nc-sa-2.0', label: 'CC BY-NC-SA 2.0', year: 2004, isLeaf: true },
            { id: 'cc-by-nc-sa-3.0', label: 'CC BY-NC-SA 3.0', year: 2007, isLeaf: true },
            { id: 'cc-by-nc-sa-4.0', label: 'CC BY-NC-SA 4.0', year: 2013, description: 'Current', isLeaf: true },
          ],
        },
        {
          id: 'cc-by-nc-nd-root',
          label: 'CC BY-NC-ND (Most Restrictive)',
          description: 'Non-commercial + no derivatives',
          children: [
            { id: 'cc-by-nc-nd-3.0', label: 'CC BY-NC-ND 3.0', year: 2007, isLeaf: true },
            { id: 'cc-by-nc-nd-4.0', label: 'CC BY-NC-ND 4.0', year: 2013, description: 'Current', isLeaf: true },
          ],
        },
      ],
    },
  },
  {
    id: 'openrail',
    name: 'OpenRAIL / RAIL Family',
    description: 'Responsible AI Licenses combining open access with ethical use restrictions. Developed by BigScience, Hugging Face, and others.',
    color: '#818cf8',
    root: {
      id: 'rail-origin',
      label: 'RAIL (Responsible AI License)',
      year: 2021,
      description: 'Origin concept from academic AI ethics work',
      children: [
        {
          id: 'openrail',
          label: 'OpenRAIL',
          year: 2022,
          description: 'Base open responsible-AI license',
          children: [
            {
              id: 'openrail++',
              label: 'OpenRAIL++',
              year: 2022,
              description: 'Copyleft restrictions propagate',
              isLeaf: true,
            },
            {
              id: 'bigscience-openrail-m',
              label: 'BigScience OPENRAIL-M',
              year: 2022,
              description: 'For BLOOM model',
              children: [
                {
                  id: 'bigscience-bloom-rail-1.0',
                  label: 'BLOOM RAIL 1.0',
                  year: 2022,
                  description: 'BLOOM-specific',
                  isLeaf: true,
                },
              ],
            },
            {
              id: 'creativeml-openrail-m',
              label: 'CreativeML OpenRAIL-M',
              year: 2022,
              description: 'For Stable Diffusion',
              children: [
                {
                  id: 'deepfloyd-if-license',
                  label: 'DeepFloyd IF License',
                  year: 2023,
                  description: 'Research-only variant',
                  isLeaf: true,
                },
                {
                  id: 'stable-diffusion-license',
                  label: 'SD RAIL-M Derivative',
                  year: 2022,
                  description: 'Various SD variants',
                  isLeaf: true,
                },
              ],
            },
            {
              id: 'bigcode-openrail-m',
              label: 'BigCode OpenRAIL-M',
              year: 2023,
              description: 'For code generation (StarCoder)',
              isLeaf: true,
            },
          ],
        },
      ],
    },
  },
  {
    id: 'llama',
    name: 'Llama License Family',
    description: 'Meta\'s evolving license family for the Llama series of large language models.',
    color: '#fb923c',
    root: {
      id: 'llama-root',
      label: 'Llama 1',
      year: 2023,
      description: 'Research-only; non-commercial',
      children: [
        {
          id: 'llama2',
          label: 'Llama 2',
          year: 2023,
          description: 'Commercial OK for <700M MAU',
          children: [
            {
              id: 'llama3',
              label: 'Llama 3',
              year: 2024,
              description: 'Commercial OK; derivatives named "Llama 3"',
              children: [
                {
                  id: 'llama3.1',
                  label: 'Llama 3.1',
                  year: 2024,
                  description: 'Adds distillation rights',
                  children: [
                    {
                      id: 'llama3.2',
                      label: 'Llama 3.2',
                      year: 2024,
                      description: 'Multimodal coverage',
                      children: [
                        {
                          id: 'llama3.3',
                          label: 'Llama 3.3',
                          year: 2024,
                          description: 'Current version',
                          isLeaf: true,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: 'bigscience',
    name: 'BigScience Family',
    description: 'Licenses developed by the BigScience Workshop for large language models and related research.',
    color: '#4ade80',
    root: {
      id: 'bigscience-root',
      label: 'BigScience Workshop',
      year: 2021,
      description: 'Collaborative research initiative',
      children: [
        {
          id: 'bigscience-bloom-rail-1.0',
          label: 'BLOOM RAIL 1.0',
          year: 2022,
          description: 'For BLOOM 176B model',
          isLeaf: true,
        },
        {
          id: 'bigscience-openrail-m',
          label: 'BigScience OpenRAIL-M',
          year: 2022,
          description: 'Model use variant of OpenRAIL',
          isLeaf: true,
        },
      ],
    },
  },
];

export function getFamilyTree(id: string): FamilyTree | undefined {
  return FAMILY_TREES.find((t) => t.id === id);
}

export function flattenTree(node: FamilyNode): FamilyNode[] {
  const result: FamilyNode[] = [node];
  if (node.children) {
    for (const child of node.children) {
      result.push(...flattenTree(child));
    }
  }
  return result;
}
