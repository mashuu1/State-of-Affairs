import { useEffect, useRef, useState } from 'react';
import { useGame } from '../context/GameContext';
import { DP_DISPLAY_MAX, DP_WIN_THRESHOLD, TRUST_MAX } from '../constants/game';

// Animated number component — counts up/down with glow
function AnimatedNumber({ value, color = 'text-cyan-300', size = 'text-xl' }) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(true);
      const diff = value - prevRef.current;
      const steps = Math.min(Math.abs(diff), 10);
      const stepTime = 300 / steps;
      let current = prevRef.current;
      const interval = setInterval(() => {
        current += diff > 0 ? 1 : -1;
        setDisplay(current);
        if (current === value) {
          clearInterval(interval);
          setTimeout(() => setFlash(false), 400);
        }
      }, stepTime);
      prevRef.current = value;
      return () => clearInterval(interval);
    }
  }, [value]);

  return (
    <span
      className={`${size} font-black font-mono tabular-nums transition-all duration-200 ${color} ${
        flash ? 'hud-number-flash scale-110' : ''
      }`}
      style={{
        textShadow: flash
          ? `0 0 20px currentColor, 0 0 40px currentColor`
          : `0 0 8px currentColor, 0 0 2px rgba(0,0,0,0.8)`,
      }}
    >
      {display}
    </span>
  );
}

// DP Progress diamonds
function DPDiamonds({ current, max = DP_DISPLAY_MAX, winAt = DP_WIN_THRESHOLD }) {
  return (
    <div className="flex gap-1.5 items-center">
      {[...Array(max)].map((_, i) => (
        <div
          key={i}
          className={[
            'gov-dp-diamond',
            i < current ? 'gov-dp-diamond--lit' : 'gov-dp-diamond--dim',
            i < winAt ? 'gov-dp-diamond--goal' : 'gov-dp-diamond--bonus',
          ].join(' ')}
          style={{ transitionDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

function TrustSeals({ current, max = TRUST_MAX }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }).map((_, i) => {
        const ok = i < current;
        return (
          <div
            key={i}
            className={[
              'gov-seal',
              ok ? 'gov-seal--ok' : 'gov-seal--broken',
            ].join(' ')}
            title={`Trust ${current}/${max}`}
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="gov-seal-svg">
              <path
                d="M12 2.5l2.1 2.5 3.2-.5.6 3.2 2.9 1.5-1.5 2.9 1.5 2.9-2.9 1.5-.6 3.2-3.2-.5L12 21.5 9.9 19l-3.2.5-.6-3.2-2.9-1.5 1.5-2.9-1.5-2.9 2.9-1.5.6-3.2 3.2.5L12 2.5z"
                fill="currentColor"
                opacity="0.95"
              />
              <path
                d="M12 7l1.2 2.7 2.9.2-2.2 1.9.7 2.8-2.6-1.5-2.6 1.5.7-2.8-2.2-1.9 2.9-.2L12 7z"
                fill="#0b1224"
                opacity="0.9"
              />
            </svg>
            {!ok && <span className="gov-seal-crack" />}
          </div>
        );
      })}
    </div>
  );
}

export default function PlayerHUD() {
  const { state } = useGame();

  const trust = state.publicTrust;

  return (
    <div className="gov-hud" style={{ fontFamily: "var(--font-body)" }}>
      <div className="gov-hud-glass">
        <div className="gov-hud-scan" />

        <div className="gov-hud-row">
          <div className="gov-hud-block gov-hud-block--trust" style={{ justifySelf: 'start' }}>
            <div className="gov-hud-kicker gov-heading">TRUST</div>
            <div className="flex items-center gap-3">
              <TrustSeals current={trust} />
              <div className="gov-hud-mini">
                <AnimatedNumber value={trust} color="text-emerald-300" size="text-base" />
                <span className="gov-hud-mini-den">/{TRUST_MAX}</span>
              </div>
            </div>
          </div>

          <div className="gov-hud-divider" />

          <div className="gov-hud-block gov-hud-block--budget">
            <div className="gov-hud-kicker gov-heading">BUDGET</div>
            <div className="flex items-end gap-2">
              <span className="gov-coin" aria-hidden>◉</span>
              <AnimatedNumber value={state.budget} color="text-amber-300" size="text-4xl" />
            </div>
          </div>

          <div className="gov-hud-divider" />

          <div className="gov-hud-block gov-hud-block--dp" style={{ justifySelf: 'end' }}>
            <div className="gov-hud-kicker gov-heading">DEVELOPMENT</div>
            <DPDiamonds current={state.developmentPoints} />
            <div className="gov-hud-sub">
              <span className="gov-hud-sub-label">Victory at</span>
              <span className="gov-hud-sub-val">{DP_WIN_THRESHOLD} DP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
