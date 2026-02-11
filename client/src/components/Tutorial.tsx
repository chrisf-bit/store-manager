import { type RefObject } from 'react';

/* ========== Tutorial Step Definitions ========== */
export interface TutorialStep {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'guide',
    icon: '🧭',
    title: 'Guide Panel',
    description:
      'Your companion throughout the simulation. It walks you through Plan, Execute, and Reflect phases each round, with contextual tips and key formulas. On mobile, tap the menu button to open it.',
  },
  {
    id: 'header',
    icon: '🏪',
    title: 'Store Header & Progress',
    description:
      'Shows your store name, size, and region. The round dots track your progress through all 4 weeks \u2014 completed rounds show a tick mark.',
  },
  {
    id: 'tabs',
    icon: '📋',
    title: 'Navigation Tabs',
    description:
      'Switch between Scenarios (management situations), Decisions (3 operational choices), Allocations (budget & time), Metrics (15 KPIs), and Trends (graphs). Badges show completion progress.',
  },
  {
    id: 'content',
    icon: '🎯',
    title: 'Content Area',
    description:
      'This is where the action happens. Read scenarios and choose responses, make weekly decisions, allocate resources, check metrics, and review results after each submission.',
  },
  {
    id: 'footer',
    icon: '🚀',
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
            Skip, I'll Figure It Out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== Full-Card Tutorial Overlay ========== */
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
  onNext,
  onPrev,
  onSkip,
}: TutorialOverlayProps) {
  const currentStep = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div className="tutorial-card-overlay">
      {/* Step indicator */}
      <div className="tutorial-step-counter">
        {step + 1} of {TUTORIAL_STEPS.length}
      </div>

      {/* Icon */}
      <div className="tutorial-icon">{currentStep.icon}</div>

      {/* Title */}
      <h3 className="tutorial-title">{currentStep.title}</h3>

      {/* Description */}
      <p className="tutorial-description">{currentStep.description}</p>

      {/* Progress dots */}
      <div className="tutorial-dots">
        {TUTORIAL_STEPS.map((_, i) => (
          <div
            key={i}
            className={`tutorial-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="tutorial-nav">
        <button onClick={onSkip} className="tutorial-skip-btn">
          Skip tour
        </button>
        <div className="flex gap-3">
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
