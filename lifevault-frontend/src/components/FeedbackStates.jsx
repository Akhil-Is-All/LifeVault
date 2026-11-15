export function LoadingIndicator({ label = "Loading..." }) {
  return (
    <span className="feedback-loading-indicator" role="status">
      <span className="feedback-spinner feedback-spinner--blue" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
}) {
  return (
    <div className="feedback-empty-state">
      <span className="feedback-empty-icon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 9h8M8 13h5M8 17h3" />
        </svg>
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
