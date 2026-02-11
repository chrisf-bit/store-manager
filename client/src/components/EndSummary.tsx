import { useState, useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { CheckCircle, AlertTriangle, Target, Download } from 'lucide-react';
import type { EndReport } from 'shared';
import { api } from '../api';

interface EndSummaryProps {
  runId: string;
  onRestart: () => void;
}

const GRADE_STYLES: Record<string, string> = {
  Developing: 'grade-developing',
  'Ready Soon': 'grade-ready-soon',
  Ready: 'grade-ready',
  'High Performing': 'grade-high-performing',
};

export default function EndSummary({ runId, onRestart }: EndSummaryProps) {
  const [report, setReport] = useState<EndReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getReport(runId)
      .then(setReport)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [runId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4" />
          <p className="text-text-secondary">Generating your performance report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-20">
        <p className="text-danger mb-4">{error || 'Failed to load report'}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  const radarData = report.scorecard.map((cat) => ({
    subject: cat.name,
    score: cat.score,
    fullMark: 100,
  }));

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `store-manager-sim-report-${runId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Performance Review</h1>
        <p className="text-text-secondary mb-4">{report.run.storeName}</p>

        {/* Grade */}
        <div className="mb-4">
          <span className={`grade-badge ${GRADE_STYLES[report.grade]}`}>
            {report.grade}
          </span>
        </div>
        <p className="text-text-muted text-sm">Overall Score: {report.overallScore}/100</p>
      </div>

      {/* Radar chart + scorecard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Radar */}
        <div className="bg-surface-light border border-border rounded-xl p-4 md:p-6 flex items-center justify-center">
          <div className="w-full h-56 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scorecard cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {report.scorecard.map((cat) => (
            <div
              key={cat.name}
              className="bg-surface-light border border-border rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{cat.name}</h3>
                <span
                  className={`text-lg font-bold ${
                    cat.score >= 75
                      ? 'text-emerald-400'
                      : cat.score >= 55
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {cat.score}
                </span>
              </div>
              <div className="space-y-2">
                {cat.metrics.map((m) => (
                  <div key={m.label} className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">{m.label}</span>
                    <span className="flex items-center gap-1">
                      <span className="text-text-secondary font-medium">{m.value}</span>
                      <span
                        className={
                          m.trend === 'up'
                            ? 'text-emerald-400'
                            : m.trend === 'down'
                            ? 'text-red-400'
                            : 'text-text-muted'
                        }
                      >
                        {m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths, Risks, Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-light border border-emerald-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle size={16} /> Strengths
          </h3>
          <ul className="space-y-2">
            {report.strengths.map((s, i) => (
              <li key={i} className="text-sm text-text-secondary leading-relaxed">
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-light border border-red-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> Risks
          </h3>
          <ul className="space-y-2">
            {report.risks.map((r, i) => (
              <li key={i} className="text-sm text-text-secondary leading-relaxed">
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface-light border border-blue-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Target size={16} /> Recommendations
          </h3>
          <ul className="space-y-2">
            {report.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-text-secondary leading-relaxed">
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pb-12">
        <button onClick={handleDownload} className="btn-secondary">
          <Download size={16} /> Download JSON Report
        </button>
        <button onClick={onRestart} className="btn-primary">
          Play Again
        </button>
      </div>
    </div>
  );
}
