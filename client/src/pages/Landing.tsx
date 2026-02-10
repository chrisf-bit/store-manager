import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-brand-600/5 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Logo */}
        <div className="mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-600 mb-6">
            <span className="text-3xl font-bold text-white">FM</span>
          </div>
        </div>

        {/* Title */}
        <h1
          className="font-bold text-text-primary mb-4 animate-fadeIn"
          style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', lineHeight: 1.1 }}
        >
          Store Manager Sim
        </h1>
        <p className="text-lg md:text-xl text-brand-400 font-medium mb-2 animate-fadeIn">
          FreshWay Markets
        </p>
        <p className="text-text-secondary text-base md:text-lg mb-10 max-w-lg mx-auto animate-fadeIn">
          Step into the shoes of a retail store manager. Make 4 rounds of
          decisions across commercial strategy, staffing, operations, and
          investment — and see how your store performs.
        </p>

        {/* Feature list */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10 stagger-children">
          {[
            { icon: '📊', label: '15 Live Metrics' },
            { icon: '🎯', label: '4 Decisions/Round' },
            { icon: '⚡', label: 'Random Events' },
            { icon: '🏆', label: 'Final Scorecard' },
          ].map((f) => (
            <div
              key={f.label}
              className="bg-surface-light border border-border rounded-xl p-4 text-center"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm text-text-secondary font-medium">{f.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/create')}
          className="btn-primary text-lg px-10 py-4"
        >
          Start Demo Run
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="ml-1">
            <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <p className="text-text-muted text-sm mt-6">
          Demo mode — no login required. Takes about 10 minutes.
        </p>
      </div>
    </div>
  );
}
