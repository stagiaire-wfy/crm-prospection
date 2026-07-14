import type { PageSpeedCategoryScores } from '../types/database';

const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const CATEGORIES = ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO', 'AGENTIC_BROWSING'];

export function normalizeUrl(siteWeb: string): string {
  const trimmed = siteWeb.trim();
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
}

function toScore(category: { score?: number | null } | undefined): number | null {
  if (!category || category.score == null) return null;
  return Math.round(category.score * 100);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function agenticRatio(lighthouse: any): { passed: number | null; total: number | null } {
  const cat = lighthouse?.categories?.['agentic-browsing'];
  if (!cat) return { passed: null, total: null };
  let passed = 0;
  let total = 0;
  for (const ref of cat.auditRefs || []) {
    const audit = lighthouse.audits?.[ref.id];
    if (!audit) continue;
    if ((audit.scoreDisplayMode === 'binary' || audit.scoreDisplayMode === 'numeric') && audit.score != null) {
      total++;
      if (audit.score >= 0.9) passed++;
    }
  }
  return total > 0 ? { passed, total } : { passed: null, total: null };
}

export async function runPageSpeed(siteWeb: string, strategy: 'mobile' | 'desktop'): Promise<PageSpeedCategoryScores> {
  const apiKey = import.meta.env.VITE_PSI_KEY;
  if (!apiKey) throw new Error('Clé API PageSpeed manquante (VITE_PSI_KEY)');

  const params = new URLSearchParams({ url: normalizeUrl(siteWeb), strategy, key: apiKey });
  for (const c of CATEGORIES) params.append('category', c);

  const res = await fetch(`${PSI_ENDPOINT}?${params.toString()}`);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Erreur PageSpeed (${res.status})`);
  }

  const lighthouse = data.lighthouseResult;
  const cats = lighthouse?.categories || {};
  const agentic = agenticRatio(lighthouse);

  return {
    performance: toScore(cats.performance),
    accessibility: toScore(cats.accessibility),
    best_practices: toScore(cats['best-practices']),
    seo: toScore(cats.seo),
    agentic_passed: agentic.passed,
    agentic_total: agentic.total,
  };
}
