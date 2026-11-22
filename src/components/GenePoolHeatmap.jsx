import { useRef, useEffect } from 'react';
import { computeGeneFrequencies, PROBLEMS } from '../engine/ga';
import InfoTooltip from './InfoTooltip';

export default function GenePoolHeatmap({ population, params }) {
  const canvasRef = useRef(null);
  const def = PROBLEMS[params.problem];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || population.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    // Clean white canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const alleles = def.alleles;
    const chrLen = population[0].length;
    const freq = computeGeneFrequencies(population, alleles);

    const pad = { t: 28, r: 90, b: 36, l: 42 };
    const plotW = W - pad.l - pad.r;
    const plotH = H - pad.t - pad.b;

    const displayAlleles = alleles.length > 15 ? alleles.slice(0, 15) : alleles;
    const cellW = plotW / chrLen;
    const cellH = plotH / displayAlleles.length;

    // Draw cells with White-to-Orange gradient
    for (let pos = 0; pos < chrLen; pos++) {
      for (let ai = 0; ai < displayAlleles.length; ai++) {
        const a = displayAlleles[ai];
        const f = freq[pos]?.[a] || 0;
        const x = pad.l + pos * cellW;
        const y = pad.t + ai * cellH;

        // Gradient from #fff7ed (f=0) to #ea580c (f=1)
        const r = Math.round(255 - f * 21);
        const g = Math.round(247 - f * 159);
        const b = Math.round(237 - f * 225);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        // Border for clear cell definition
        ctx.strokeStyle = '#fed7aa';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);

        // Show percentage in cell if big enough
        if (cellW > 28 && cellH > 18) {
          ctx.fillStyle = f > 0.45 ? '#ffffff' : '#7c2d12';
          ctx.font = '600 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${(f * 100).toFixed(0)}%`, x + cellW / 2, y + cellH / 2);
        }
      }
    }

    // X labels
    ctx.fillStyle = '#7c2d12';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let pos = 0; pos < chrLen; pos++) {
      ctx.fillText(pos.toString(), pad.l + pos * cellW + cellW / 2, H - pad.b + 6);
    }
    ctx.font = '600 11px "Inter", sans-serif';
    ctx.fillText('Gene Position', (W - pad.r) / 2 + pad.l / 2, H - 8);

    // Y labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    for (let ai = 0; ai < displayAlleles.length; ai++) {
      ctx.fillText(displayAlleles[ai], pad.l - 6, pad.t + ai * cellH + cellH / 2);
    }

    // Legend
    const lgX = W - pad.r + 12;
    ctx.fillStyle = '#431407';
    ctx.font = '700 11px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Frequency', lgX, pad.t);
    for (let i = 0; i <= 4; i++) {
      const f = i / 4;
      const r = Math.round(255 - f * 21);
      const g = Math.round(247 - f * 159);
      const b = Math.round(237 - f * 225);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(lgX, pad.t + 18 + i * 20, 44, 14);
      ctx.strokeStyle = '#fed7aa';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(lgX, pad.t + 18 + i * 20, 44, 14);
      ctx.fillStyle = '#7c2d12';
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${(f * 100).toFixed(0)}%`, lgX + 50, pad.t + 25 + i * 20);
    }
  }, [population, params.problem, def.alleles]);

  if (population.length === 0) {
    return (
      <div className="flex items-center justify-center h-72 text-stone-500 text-sm">
        Initialize the population to see the heatmap
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-stone-600 mb-3">
        <span>Allele frequency distribution across chromosome positions. Deep orange = high frequency (convergence).</span>
        <InfoTooltip
          title="Gene Pool Column"
          text="Real-time heatmap showing allele frequency distribution across all chromosome positions (loci) to inspect genetic drift and locus convergence."
          align="left"
          position="bottom"
        />
      </div>
      <div className="border border-orange-200 rounded-lg overflow-hidden bg-white p-1">
        <canvas ref={canvasRef} style={{ width: '100%', height: 280 }} />
      </div>
    </div>
  );
}
