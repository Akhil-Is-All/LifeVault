import { Link } from "react-router-dom";

function AuthIcon({ name }) {
  const icons = {
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

function AuthVisual() {
  return (
    <aside className="auth-visual" aria-label="LifeVault introduction">
      <div className="auth-visual-inner">
        <Link className="auth-brand" to="/login" aria-label="LifeVault login">
          <img
            src="/images/lifevault-logo.svg"
            alt="LifeVault — Remember. Organize. Achieve."
          />
        </Link>

        <div className="auth-story">
          <p className="auth-kicker">MAKE SPACE FOR WHAT MATTERS</p>
          <h1>Life feels lighter when it&apos;s in order.</h1>
          <p>
            Bring your plans and reminders together in one calm, clear place.
            LifeVault helps you stay on top of today and ready for what&apos;s next.
          </p>
        </div>

        <div className="auth-artwork" aria-hidden="true">
          <div className="auth-art-orbit auth-art-orbit-one" />
          <div className="auth-art-orbit auth-art-orbit-two" />
          <div className="auth-art-glow" />
          <div className="auth-art-board">
            <div className="auth-art-board-top">
              <span className="auth-art-dot" />
              <span className="auth-art-dot" />
              <span className="auth-art-dot" />
              <span className="auth-art-board-label">YOUR LIFE, IN ORDER</span>
            </div>
            <div className="auth-art-board-content">
              <div className="auth-art-calendar">
                <div className="auth-art-calendar-head">
                  <span />
                  <span />
                </div>
                <div className="auth-art-calendar-grid">
                  {Array.from({ length: 15 }, (_, index) => (
                    <span
                      className={index === 6 || index === 11 ? "is-marked" : ""}
                      key={index}
                    />
                  ))}
                </div>
              </div>
              <div className="auth-art-checklist">
                <span className="auth-art-section-line" />
                <div className="auth-art-task">
                  <span className="auth-art-check" />
                  <span />
                </div>
                <div className="auth-art-task">
                  <span className="auth-art-check is-done">✓</span>
                  <span className="is-short" />
                </div>
                <div className="auth-art-task">
                  <span className="auth-art-check" />
                  <span className="is-medium" />
                </div>
                <div className="auth-art-progress">
                  <span />
                </div>
              </div>
            </div>
            <div className="auth-art-board-foot">
              <span />
              <span />
            </div>
          </div>
          <div className="auth-art-shield">
            <img src="/images/lifevault-mark.svg" alt="" />
          </div>
          <div className="auth-art-note auth-art-note-top">
            <span className="auth-art-note-icon">✓</span>
            <span>One less thing to remember</span>
          </div>
          <div className="auth-art-note auth-art-note-bottom">
            <span className="auth-art-note-bars"><i /><i /><i /></span>
            <span>Clarity for your everyday</span>
          </div>
        </div>

        <div className="auth-visual-footer">
          <span>Built for a more organized life.</span>
          <span>Private by design</span>
        </div>
      </div>
    </aside>
  );
}

export function AuthFieldIcon({ name }) {
  return <AuthIcon name={name} />;
}

export default function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <AuthVisual />
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <Link className="auth-mobile-brand" to="/login" aria-label="LifeVault login">
            <img src="/images/lifevault-mark.svg" alt="" />
            <span>LifeVault</span>
          </Link>
          {children}
          <p className="auth-panel-footer">
            <span>LifeVault</span> · Remember. Organize. Achieve.
          </p>
        </div>
      </section>
    </div>
  );
}
