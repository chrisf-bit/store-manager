import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import type { StoreSize, Region } from 'shared';

const STORE_SIZES: { value: StoreSize; label: string; desc: string }[] = [
  { value: 'small', label: 'Small', desc: '~4,500 weekly footfall, compact team' },
  { value: 'medium', label: 'Medium', desc: '~7,200 weekly footfall, mid-size team' },
  { value: 'large', label: 'Large', desc: '~11,000 weekly footfall, large team' },
];

const REGIONS: { value: Region; label: string }[] = [
  { value: 'North', label: 'North' },
  { value: 'Midlands', label: 'Midlands' },
  { value: 'South', label: 'South' },
  { value: 'Scotland', label: 'Scotland' },
  { value: 'Wales', label: 'Wales' },
];

export default function CreateRun() {
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState('FreshWay Markets – Riverside');
  const [storeSize, setStoreSize] = useState<StoreSize>('medium');
  const [region, setRegion] = useState<Region>('Midlands');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const run = await api.createRun({ storeName, storeSize, region });
      navigate(`/game/${run.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create run');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="btn-secondary mb-6 text-sm"
        >
          &larr; Back
        </button>

        <div className="bg-surface-light border border-border rounded-2xl p-6 md:p-8 animate-fadeIn">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">Set Up Your Store</h1>
            <p className="text-text-secondary text-sm">
              Customise your FreshWay Markets store before you begin.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store name */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary focus:border-brand-500 focus:outline-none transition-colors"
                maxLength={100}
              />
            </div>

            {/* Store size */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-3">
                Store Size
              </label>
              <div className="grid grid-cols-3 gap-3">
                {STORE_SIZES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStoreSize(s.value)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      storeSize === s.value
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-border hover:border-brand-400/50'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">{s.label}</div>
                    <div className="text-xs text-text-muted leading-tight">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Region
              </label>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRegion(r.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      region === r.value
                        ? 'bg-brand-600 text-white'
                        : 'bg-surface border border-border text-text-secondary hover:border-brand-400/50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-danger text-sm bg-danger/10 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !storeName.trim()}
              className="btn-primary w-full justify-center"
            >
              {loading ? 'Creating...' : 'Start Simulation'}
              {!loading && (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
