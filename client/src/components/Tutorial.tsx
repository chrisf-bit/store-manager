import { useState, useEffect, type RefObject } from 'react';

/* ========== Tutorial Step Definitions ========== */
export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  position: 'right' | 'left' | 'top' | 'bottom';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'guide',
    title: 'Guide Panel',
    description:
      'Your companion throughout the simulation. It shows Plan, Execute, and Reflect phases for each round, with contextual tips and key formulas. Collapse it with the toggle on its right edge.',
    position: 'right',
  },
  {
    id: 'header',
    title: 'Store Header & Round Progress',
    description:
      'Shows your store name, size, and region. The round dots on the right track your progress through all 4 weeks \u2014 completed rounds show a tick mark.',
    position: 'bottom',
  },
  {
    id: 'tabs',
    title: 'Navigation Tabs',
    description:
      'Switch between Scenarios (management situations), Decisions (4 operational choices), Metrics (your 15 KPIs), and Charts (trend graphs). Badges show completion progress. Check Metrics often!',
    position: 'bottom',
  },
  {
    id: 'content',
    title: 'Content Area',
    description:
      'This is where the action happens. Read scenarios and choose responses, make weekly decisions, check metrics at any time, and review results after each submission.',
    position: 'right',
  },
  {
    id: 'footer',
    title: 'Submit Footer',
    description:
      "Shows how many scenarios and decisions you've completed. Once all are selected, the Submit button activates. Click it to process your week and see the results.",
    position: 'top',
  },
];

/* ========== Tutorial Prompt (initial "Show Me Around" modal) ========== */
export function TutorialPrompt({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="tutorial-overlay" role="dialog" aria-label="Tutorial prompt">
      <div className="tutorial-card">
        <div className="text-5xl mb-4">🏪</div>
        <h2 className="text-xl font-bold mb-2">Welcome to Store Manager Sim</h2>
        <p className="text-text-secondary text-sm mb-6">
          Would you like a quick walkthrough of the interface before you start?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={onStart} className="btn-primary">
            Show Me Around
          </button>
          <button onClick={onSkip} className="btn-secondary">
            Skip — I'll Figure It Out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== Pinned-Tile Tutorial Overlay ========== */
export type TutorialRefMap = Record<string, RefObject<HTMLElement | null>>;

interface TutorialOverlayProps {
  step: number;
  refMap: TutorialRefMap;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export function TutorialOverlay({
  step,
  refMap,
  onNext,
  onPrev,
  onSkip,
}: TutorialOverlayProps) {
  const currentStep = TUTORIAL_STEPS[step];
  const targetRef = refMap[currentStep.id];
  const [positions, setPositions] = useState<{
    spotlight: { top: number; left: number; width: number; height: number };
    tooltip: { top: number; left: number; width: number };
    arrow: { top: number; left: number; borderColor: string };
  } | null>(null);

  const isLast = step === TUTORIAL_STEPS.length - 1;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Wait for the target ref to be available
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (targetRef?.current) {
      setReady(true);
      return;
    }
    setReady(false);
    const interval = setInterval(() => {
      if (targetRef?.current) {
        setReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [targetRef, step]);

  // Calculate positions
  useEffect(() => {
    if (!targetRef?.current || !ready) return;

    const updatePosition = () => {
      const el = targetRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const gap = 15;
      const tooltipWidth = 300;
      const tooltipHeight = 200;
      const padding = 6;
      const arrowSize = 10;

      // Spotlight
      const spotlight = {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      };

      // Tooltip position
      let top = 0;
      let left = 0;
      const pos = currentStep.position;

      if (pos === 'right') {
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + gap;
      } else if (pos === 'left') {
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - gap;
      } else if (pos === 'top') {
        top = rect.top - tooltipHeight - gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
      } else {
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
      }

      // Viewport clamping
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (left < gap) left = gap;
      if (left + tooltipWidth > vw - gap) left = vw - tooltipWidth - gap;
      if (top < gap) top = gap;
      if (top + tooltipHeight > vh - gap) top = vh - tooltipHeight - gap;

      const tooltip = { top, left, width: tooltipWidth };

      // Arrow
      let arrowTop = 0;
      let arrowLeft = 0;
      let borderColor = '';
      if (pos === 'right') {
        arrowTop = top + tooltipHeight / 2 - arrowSize;
        arrowLeft = left - arrowSize;
        borderColor = 'transparent #1e2028 transparent transparent';
      } else if (pos === 'left') {
        arrowTop = top + tooltipHeight / 2 - arrowSize;
        arrowLeft = left + tooltipWidth;
        borderColor = 'transparent transparent transparent #1e2028';
      } else if (pos === 'top') {
        arrowTop = top + tooltipHeight;
        arrowLeft = left + tooltipWidth / 2 - arrowSize;
        borderColor = '#1e2028 transparent transparent transparent';
      } else {
        arrowTop = top - arrowSize * 2;
        arrowLeft = left + tooltipWidth / 2 - arrowSize;
        borderColor = 'transparent transparent #1e2028 transparent';
      }

      setPositions({
        spotlight,
        tooltip,
        arrow: { top: arrowTop, left: arrowLeft, borderColor },
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [targetRef, currentStep, step, ready]);

  // Mobile: show a simple card overlay
  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.9)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          {step + 1} of {TUTORIAL_STEPS.length}
        </div>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#f5f5f5',
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          {currentStep.title}
        </h3>
        <p
          style={{
            fontSize: 14,
            color: 'rgba(245,245,245,0.8)',
            lineHeight: 1.6,
            textAlign: 'center',
            maxWidth: 340,
            marginBottom: 32,
          }}
        >
          {currentStep.description}
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
          {step > 0 && (
            <button onClick={onPrev} className="btn-secondary text-sm">
              Back
            </button>
          )}
          <button onClick={onNext} className="btn-primary text-sm px-6">
            {isLast ? 'Got it!' : 'Next'}
          </button>
        </div>
      </div>
    );
  }

  // Desktop: spotlight + positioned tooltip
  if (!positions || !ready) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Spotlight cutout — darkens everything except the target */}
      <div
        style={{
          position: 'absolute',
          top: positions.spotlight.top,
          left: positions.spotlight.left,
          width: positions.spotlight.width,
          height: positions.spotlight.height,
          borderRadius: 12,
          boxShadow:
            '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 15px 5px rgba(249, 115, 22, 0.3), inset 0 0 1px 1px rgba(255, 255, 255, 0.1)',
          transition: 'all 200ms ease-out',
          pointerEvents: 'none',
        }}
      />

      {/* Arrow pointer */}
      <div
        style={{
          position: 'absolute',
          top: positions.arrow.top,
          left: positions.arrow.left,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: 10,
          borderColor: positions.arrow.borderColor,
          transition: 'all 200ms ease-out',
          pointerEvents: 'none',
        }}
      />

      {/* Tooltip card */}
      <div
        style={{
          position: 'absolute',
          top: positions.tooltip.top,
          left: positions.tooltip.left,
          width: positions.tooltip.width,
          background: '#1e2028',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: 12,
          padding: '20px 24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          transition: 'all 200ms ease-out',
          pointerEvents: 'auto',
        }}
      >
        {/* Step indicator */}
        <div
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {step + 1} of {TUTORIAL_STEPS.length}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#f5f5f5',
            margin: '0 0 8px 0',
          }}
        >
          {currentStep.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: 13,
            color: 'rgba(245,245,245,0.8)',
            lineHeight: 1.5,
            margin: '0 0 20px 0',
          }}
        >
          {currentStep.description}
        </p>

        {/* Navigation buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 13,
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            Skip tour
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button onClick={onPrev} className="btn-secondary text-sm">
                Back
              </button>
            )}
            <button onClick={onNext} className="btn-primary text-sm px-6">
              {isLast ? 'Got it!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== Default export (backwards compat — not used in new flow) ========== */
export default function Tutorial({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  if (!isVisible) return null;
  // Fallback: this is now handled by TutorialOverlay in Game.tsx
  return null;
}
