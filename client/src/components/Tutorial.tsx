import { type RefObject, type ComponentType, useState, useEffect, useCallback } from 'react';
import { Compass, Store, LayoutList, Target, Send } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

/* ========== Tutorial Step Definitions ========== */
export interface TutorialStep {
  id: string;
  icon: ComponentType<LucideProps>;
  title: string;
  description: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'guide',
    icon: Compass,
    title: 'Guide Panel',
    description:
      'Your companion throughout the simulation. It walks you through Plan, Execute, and Reflect phases each round, with contextual tips and key formulas. On mobile, tap the menu button to open it.',
  },
  {
    id: 'header',
    icon: Store,
    title: 'Store Header & Progress',
    description:
      'Shows your store name, size, and region. The round dots track your progress through all 4 weeks \u2014 completed rounds show a tick mark.',
  },
  {
    id: 'tabs',
    icon: LayoutList,
    title: 'Navigation Tabs',
    description:
      'Switch between Scenarios (management situations), Decisions (3 operational choices), Allocations (budget & time), Metrics (15 KPIs), and Trends (graphs). Badges show completion progress.',
  },
  {
    id: 'content',
    icon: Target,
    title: 'Content Area',
    description:
      'This is where the action happens. Read scenarios and choose responses, make weekly decisions, allocate resources, check metrics, and review results after each submission.',
  },
  {
    id: 'footer',
    icon: Send,
    title: 'Submit Footer',
    description:
      "Shows how many scenarios, decisions, and allocations you've completed. Once all are set, the Submit button activates. Click it to process your week and see the results.",
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
        <div className="mb-4 text-text-secondary"><Store size={48} strokeWidth={1.5} /></div>
        <h2 className="text-xl font-bold mb-2">Welcome to Store Manager Sim</h2>
        <p className="text-text-secondary text-sm mb-6">
          Would you like a quick walkthrough of the interface before you start?
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={onStart} className="btn-primary">
            Show Me Around
          </button>
          <button onClick={onSkip} className="btn-secondary">
            Skip, I'll Figure It Out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== Tutorial Overlay ========== */
export type TutorialRefMap = Record<string, RefObject<HTMLElement | null>>;

interface TutorialOverlayProps {
  step: number;
  refMap: TutorialRefMap;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

interface PinnedPos {
  top: number;
  left: number;
  width: number;
  height: number;
}

const DESKTOP_BREAKPOINT = 768;

export function TutorialOverlay({
  step,
  refMap,
  onNext,
  onPrev,
  onSkip,
}: TutorialOverlayProps) {
  const currentStep = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= DESKTOP_BREAKPOINT);
  const [targetRect, setTargetRect] = useState<PinnedPos | null>(null);

  const measure = useCallback(() => {
    const wide = window.innerWidth >= DESKTOP_BREAKPOINT;
    setIsDesktop(wide);
    if (wide) {
      const ref = refMap[currentStep.id];
      const el = ref?.current;
      if (el) {
        const r = el.getBoundingClientRect();
        setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setTargetRect(null);
      }
    }
  }, [refMap, currentStep.id]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const Icon = currentStep.icon;

  /* ---- Shared card content ---- */
  const cardContent = (
    <>
      <div className="tutorial-step-counter">
        {step + 1} of {TUTORIAL_STEPS.length}
      </div>
      <div className="tutorial-icon"><Icon size={isDesktop ? 32 : 48} strokeWidth={1.5} /></div>
      <h3 className="tutorial-title">{currentStep.title}</h3>
      <p className="tutorial-description">{currentStep.description}</p>
      <div className="tutorial-dots">
        {TUTORIAL_STEPS.map((_, i) => (
          <div
            key={i}
            className={`tutorial-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
          />
        ))}
      </div>
      <div className="tutorial-nav">
        <button onClick={onSkip} className="tutorial-skip-btn">Skip tour</button>
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={onPrev} className="btn-secondary text-sm">Back</button>
          )}
          <button onClick={onNext} className="btn-primary text-sm px-6">
            {isLast ? 'Got it!' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );

  /* ---- Mobile: full-screen card ---- */
  if (!isDesktop) {
    return <div className="tutorial-card-overlay">{cardContent}</div>;
  }

  /* ---- Desktop: pinned tile next to highlighted element ---- */
  const CARD_W = 360;
  const CARD_GAP = 16;

  // Position card to the right of the target, or below if not enough space
  let cardStyle: React.CSSProperties = {};
  if (targetRect) {
    const spaceRight = window.innerWidth - (targetRect.left + targetRect.width + CARD_GAP + CARD_W);
    if (spaceRight >= 0) {
      // Place to the right, vertically centred
      cardStyle = {
        position: 'fixed',
        top: Math.max(16, targetRect.top + targetRect.height / 2 - 140),
        left: targetRect.left + targetRect.width + CARD_GAP,
        width: CARD_W,
      };
    } else {
      // Place below, horizontally centred on target
      cardStyle = {
        position: 'fixed',
        top: targetRect.top + targetRect.height + CARD_GAP,
        left: Math.max(16, Math.min(targetRect.left, window.innerWidth - CARD_W - 16)),
        width: CARD_W,
      };
    }
  }

  return (
    <div className="tutorial-pinned-backdrop">
      {/* Highlight ring on the target element */}
      {targetRect && (
        <div
          className="tutorial-highlight"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Pinned card */}
      <div className="tutorial-pinned-card" style={cardStyle}>
        {cardContent}
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
  return null;
}
