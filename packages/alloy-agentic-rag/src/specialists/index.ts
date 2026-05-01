/**
 * Specialist Agent registry for the Alloy Agentic RAG platform.
 *
 * Three reference specialists ship out of the box:
 *   knowledge-agent    — RAG over LocalDataMCP (Postgres + vector store)
 *   web-research-agent — web + index search via SearchEngineMCP
 *   cloud-ops-agent    — S3, cloud status, metrics via CloudEngineMCP
 *
 * Adding a fourth specialist is a single registry entry.
 */
export * from './knowledge-agent.js';
export * from './web-research-agent.js';
export * from './cloud-ops-agent.js';
export * from './registry.js';
