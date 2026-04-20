import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { sceneTransitions } from '@/lib/video';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500), // Title
      setTimeout(() => setPhase(2), 2000), // Graph lines draw
      setTimeout(() => setPhase(3), 4000), // Nodes appear
      setTimeout(() => setPhase(4), 14000), // Exit
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  const nodes = [
    { name: 'Constellation', desc: 'ontology graph', x: '50%', y: '20%' },
    { name: 'Trace Graph', desc: 'replayable run history', x: '20%', y: '40%' },
    { name: 'Guardian', desc: 'policy + capability tiers', x: '80%', y: '40%' },
    { name: 'Eval OS', desc: 'continuous evaluation', x: '30%', y: '70%' },
    { name: 'Memory Fabric', desc: 'persistent context', x: '70%', y: '70%' },
    { name: 'Tool Mesh', desc: 'capability routing', x: '50%', y: '55%' },
  ];

  // Connections between nodes (index pairs)
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 4],
    [1, 5],
    [2, 5],
    [3, 5],
    [4, 5],
    [0, 5],
  ];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-20"
      {...sceneTransitions.morphExpand}
    >
      <div className="absolute top-[10vh] text-center w-full">
        <motion.div
          className="font-mono text-[1vw] text-[var(--color-lyte-cyan)] tracking-widest mb-[1vh]"
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          THE SUBSTRATE
        </motion.div>
        <motion.div
          className="font-display text-[4vw] text-[var(--color-text-primary)] tracking-tight leading-none"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          Decision Fabric
        </motion.div>
      </div>

      <div className="relative w-[80vw] h-[60vh] mt-[10vh]">
        {/* Edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {edges.map(([a, b], i) => (
            <motion.line
              key={i}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
              stroke="var(--color-lyte-cyan)"
              strokeWidth="2"
              strokeOpacity="0.3"
              initial={{ pathLength: 0 }}
              animate={phase >= 2 ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 2, ease: 'easeInOut', delay: i * 0.1 }}
            />
          ))}
        </svg>

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2"
            style={{ left: node.x, top: node.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              delay: phase >= 3 ? i * 0.2 : 0,
            }}
          >
            <div className="w-[1vw] h-[1vw] rounded-full bg-[var(--color-lyte-cyan)] mb-[1vh] shadow-[0_0_15px_var(--color-lyte-cyan)]" />
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] px-[1vw] py-[0.5vh] rounded-md backdrop-blur-md text-center shadow-xl">
              <div className="font-display text-[1.2vw] text-[var(--color-text-primary)] whitespace-nowrap">
                {node.name}
              </div>
              <div className="font-mono text-[0.6vw] text-[var(--color-text-muted)] mt-[0.2vh] whitespace-nowrap">
                {node.desc}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
