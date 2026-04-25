export type PluginCategory = 'Featured' | 'Coding' | 'Design' | 'Engineering' | 'Lifestyle' | 'Productivity' | 'Research';

export interface Plugin {
  name: string;
  slug: string;
  category: PluginCategory;
  description: string;
  tags: string[];
  credentials: string[];
  homepage: string;
  mcpCompatible: boolean;
}

export interface RoutingResult {
  goal: string;
  primary: {
    name: string;
    slug: string;
    reason: string;
    credentials: string[];
  } | null;
  supporting: Array<{ name: string; slug: string; role: string }>;
  credentialsRequired: string[];
  nextSteps: string[];
}

export interface Automation {
  id: string;
  title: string;
  cadence: string;
  schedule: string | null;
  prompt: string;
  alloyCommandPrompt: string;
  plugins: string[];
  outputFormat: string;
}

export type ActiveTab = 'catalog' | 'router' | 'automations' | 'ecosystem' | 'mcp';
