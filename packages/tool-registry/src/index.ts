/**
 * @workspace/tool-registry
 *
 * Tool Registry — typed catalog of all tools available to Continuum specialists.
 *
 * Usage:
 *   import { getTool, listTools, registerTool } from "@workspace/tool-registry";
 */

export * from './registry.js';

export const TOOL_REGISTRY_VERSION = '1.0.0' as const;
