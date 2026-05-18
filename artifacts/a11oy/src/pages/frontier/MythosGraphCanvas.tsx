// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

type NodeKind = 'concept' | 'repo' | 'paper' | 'vendor' | 'benchmark' | 'technique' | 'person';

export interface MythosGraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  relevanceScore: number;
}

export interface MythosGraphEdge {
  source: string;
  target: string;
  relation: string;
}

interface SimNode extends d3.SimulationNodeDatum, MythosGraphNode {}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  relation: string;
}

interface Props {
  nodes: MythosGraphNode[];
  edges: MythosGraphEdge[];
  kindColor: Record<NodeKind, string>;
  selectedId?: string | null;
  onSelect: (node: MythosGraphNode) => void;
  height?: number;
}

export function MythosGraphCanvas({ nodes, edges, kindColor, selectedId, onSelect, height = 560 }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [width, setWidth] = useState(900);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWidth(Math.max(320, e.contentRect.width));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const nodeIds = new Set(nodes.map(n => n.id));
    const simNodes: SimNode[] = nodes.map(n => ({ ...n }));
    const simLinks: SimLink[] = edges
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(e => ({ source: e.source, target: e.target, relation: e.relation }));

    const root = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', event => root.attr('transform', event.transform.toString()));
    svg.call(zoom);

    const linkGroup = root.append('g').attr('class', 'links');
    const linkLabelGroup = root.append('g').attr('class', 'link-labels');
    const nodeGroup = root.append('g').attr('class', 'nodes');

    const linkSel = linkGroup
      .selectAll<SVGLineElement, SimLink>('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', 'rgba(255,255,255,0.18)')
      .attr('stroke-width', 1);

    const linkLabelSel = linkLabelGroup
      .selectAll<SVGTextElement, SimLink>('text')
      .data(simLinks)
      .join('text')
      .text(d => d.relation)
      .attr('font-family', 'var(--font-mono, monospace)')
      .attr('font-size', 8)
      .attr('fill', 'rgba(200,200,200,0.6)')
      .attr('text-anchor', 'middle')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    const nodeRadius = (n: SimNode) => 6 + n.relevanceScore * 8;

    const nodeG = nodeGroup
      .selectAll<SVGGElement, SimNode>('g')
      .data(simNodes)
      .join('g')
      .style('cursor', 'pointer')
      .on('click', (_evt, d) => onSelectRef.current(d))
      .on('mouseenter', (_evt, d) => applyHover(d.id))
      .on('mouseleave', () => applyHover(null));

    nodeG.append('circle')
      .attr('r', d => nodeRadius(d))
      .attr('fill', d => kindColor[d.kind])
      .attr('fill-opacity', 0.85)
      .attr('stroke', d => (d.id === selectedId ? '#fff' : 'rgba(0,0,0,0.4)'))
      .attr('stroke-width', d => (d.id === selectedId ? 2 : 1));

    nodeG.append('text')
      .text(d => d.label)
      .attr('font-family', 'var(--font-mono, monospace)')
      .attr('font-size', 10)
      .attr('fill', '#e5e5e5')
      .attr('dx', d => nodeRadius(d) + 4)
      .attr('dy', 3)
      .style('pointer-events', 'none')
      .style('paint-order', 'stroke')
      .attr('stroke', 'rgba(10,10,10,0.85)')
      .attr('stroke-width', 2.5);

    function applyHover(id: string | null) {
      linkSel
        .attr('stroke', d => {
          const s = (d.source as SimNode).id;
          const t = (d.target as SimNode).id;
          return id && (s === id || t === id) ? 'rgba(255,215,140,0.9)' : 'rgba(255,255,255,0.18)';
        })
        .attr('stroke-width', d => {
          const s = (d.source as SimNode).id;
          const t = (d.target as SimNode).id;
          return id && (s === id || t === id) ? 1.6 : 1;
        });
      linkLabelSel.style('opacity', d => {
        const s = (d.source as SimNode).id;
        const t = (d.target as SimNode).id;
        return id && (s === id || t === id) ? 1 : 0;
      });
    }

    const drag = d3.drag<SVGGElement, SimNode>()
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    nodeG.call(drag);

    const sim = d3.forceSimulation<SimNode>(simNodes)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(80).strength(0.35))
      .force('charge', d3.forceManyBody<SimNode>().strength(-220))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide<SimNode>().radius(d => nodeRadius(d) + 6))
      .on('tick', () => {
        linkSel
          .attr('x1', d => (d.source as SimNode).x ?? 0)
          .attr('y1', d => (d.source as SimNode).y ?? 0)
          .attr('x2', d => (d.target as SimNode).x ?? 0)
          .attr('y2', d => (d.target as SimNode).y ?? 0);
        linkLabelSel
          .attr('x', d => (((d.source as SimNode).x ?? 0) + ((d.target as SimNode).x ?? 0)) / 2)
          .attr('y', d => (((d.source as SimNode).y ?? 0) + ((d.target as SimNode).y ?? 0)) / 2);
        nodeG.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

    return () => {
      sim.stop();
    };
  }, [nodes, edges, kindColor, selectedId, width, height]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          display: 'block',
        }}
      />
      <div style={{
        position: 'absolute', bottom: 8, left: 12,
        fontFamily: 'var(--font-mono, monospace)', fontSize: 10,
        color: 'rgba(200,200,200,0.6)', pointerEvents: 'none',
      }}>
        scroll to zoom · drag nodes to reposition · hover to reveal relations
      </div>
    </div>
  );
}
