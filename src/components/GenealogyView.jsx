import { useRef, useEffect } from 'react';

export default function GenealogyView({ genealogy, history, params }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    const gens = history.best.length;
    if (gens < 2) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 13px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Need at least 2 generations to show genealogy', W / 2, H / 2);
      return;
    }

    const displayGens = Math.min(gens, 12);
    const startGen = Math.max(0, gens - displayGens);
    const popSize = params.popSize;

    const pad = { t: 24, r: 20, b: 24, l: 48 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;
    const rowH = plotH / (displayGens - 1 || 1);
    const colW = plotW / popSize;

    // Draw generation rows
    for (let g = 0; g < displayGens; g++) {
      const y = pad.t + g * rowH;

      // Gen label
      ctx.fillStyle = '#64748b';
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Gen ${startGen + g}`, pad.l - 8, y);

      // Nodes
      for (let i = 0; i < popSize; i++) {
        const x = pad.l + i * colW + colW / 2;
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);

        if (g === displayGens - 1) {
          // Current generation
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 6);
          gradient.addColorStop(0, '#22c55e');
          gradient.addColorStop(1, '#16a34a88');
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = '#3b82f6';
        }
        ctx.fill();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // Draw connections
    const relevantLinks = genealogy.filter(
      (l) => l.gen >= startGen && l.gen < startGen + displayGens - 1
    );

    relevantLinks.forEach((link) => {
      const genRow = link.gen - startGen;
      if (genRow < 0 || genRow >= displayGens - 1) return;
      const y1 = pad.t + genRow * rowH;
      const y2 = pad.t + (genRow + 1) * rowH;

      link.parents.forEach((pi) => {
        if (pi >= popSize) return;
        const x1 = pad.l + pi * colW + colW / 2;
        const ci = Math.min(link.childIdx, popSize - 1);
        const x2 = pad.l + ci * colW + colW / 2;

        ctx.strokeStyle = 'rgba(236, 72, 153, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1 + 5);
        ctx.bezierCurveTo(x1, y1 + rowH * 0.4, x2, y2 - rowH * 0.4, x2, y2 - 5);
        ctx.stroke();
      });
    });
  }, [genealogy, history, params.popSize]);

  return (
    <div>
      <p className="text-xs text-text-muted mb-3">
        Traces parent→offspring relationships from crossover. Pink curves connect parents (above) to
        their children (below). Green nodes = current generation.
      </p>
      <canvas ref={canvasRef} style={{ width: '100%', height: 280 }} />
    </div>
  );
}
