import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FeedbackContext } from "./FeedbackContext";
import { getUserFacingError } from "./feedbackUtils";

function ToastIcon({ kind }) {
  return (
    <span className={`feedback-toast-icon feedback-toast-icon--${kind}`} aria-hidden="true">
      {kind === "success" ? "✓" : kind === "error" ? "!" : "i"}
    </span>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      aria-atomic="false"
      aria-label="Notifications"
      aria-live="polite"
      className="feedback-toast-viewport"
    >
      {toasts.map((toast) => (
        <div
          className={`feedback-toast feedback-toast--${toast.kind}`}
          key={toast.id}
          role={toast.kind === "error" ? "alert" : "status"}
        >
          <ToastIcon kind={toast.kind} />
          <p>{toast.message}</p>
          <button
            aria-label="Dismiss notification"
            className="feedback-toast-dismiss"
            onClick={() => onDismiss(toast.id)}
            type="button"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function ConfirmationDialog({
  dialog,
  onCancel,
  onConfirm,
  onDialogError,
  onDialogBusy,
}) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const dialogBusyRef = useRef(Boolean(dialog?.busy));
  const confirmInFlightRef = useRef(false);
  const dialogId = dialog?.id;

  useEffect(() => {
    dialogBusyRef.current = Boolean(dialog?.busy);
  }, [dialog?.busy]);

  useEffect(() => {
    if (!dialogId) return undefined;

    const previouslyFocused = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!dialogBusyRef.current) onCancel();
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = dialogRef.current.querySelectorAll(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) return;
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [dialogId, onCancel]);

  if (!dialog) return null;

  async function handleConfirm() {
    if (confirmInFlightRef.current) return;
    confirmInFlightRef.current = true;
    onDialogBusy(true);
    onDialogError("");

    try {
      const result = await dialog.onConfirm();
      if (result !== false) {
        onConfirm();
      } else {
        onDialogBusy(false);
      }
    } catch (error) {
      onDialogError(
        getUserFacingError(error, "Something went wrong. Please try again.")
      );
      onDialogBusy(false);
    } finally {
      confirmInFlightRef.current = false;
    }
  }

  return (
    <div
      className="feedback-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !dialog.busy) onCancel();
      }}
    >
      <section
        aria-describedby="feedback-dialog-description"
        aria-labelledby="feedback-dialog-title"
        aria-modal="true"
        className="feedback-dialog"
        ref={dialogRef}
        role="alertdialog"
      >
        <span className="feedback-dialog-icon" aria-hidden="true">!</span>
        <h2 id="feedback-dialog-title">{dialog.title}</h2>
        <p id="feedback-dialog-description">{dialog.description}</p>
        {dialog.error && (
          <p className="feedback-dialog-error" role="alert">
            {dialog.error}
          </p>
        )}
        <div className="feedback-dialog-actions">
          <button
            className="feedback-dialog-cancel"
            disabled={dialog.busy}
            onClick={onCancel}
            ref={cancelRef}
            type="button"
          >
            {dialog.cancelLabel || "Cancel"}
          </button>
          <button
            className="feedback-dialog-confirm"
            disabled={dialog.busy}
            onClick={handleConfirm}
            type="button"
          >
            {dialog.busy ? (
              <>
                <span className="feedback-spinner" aria-hidden="true" />
                {dialog.loadingLabel || "Working..."}
              </>
            ) : (
              dialog.confirmLabel || "Confirm"
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const toastSequence = useRef(0);
  const dialogSequence = useRef(0);
  const toastTimers = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = toastTimers.current.get(id);
    if (timer) window.clearTimeout(timer);
    toastTimers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, kind = "success") => {
    const normalizedMessage = String(message || "").trim();
    if (!normalizedMessage) return;
    const id = ++toastSequence.current;

    setToasts((current) => {
      if (current.some((toast) => toast.message === normalizedMessage)) {
        return current;
      }

      const nextToasts = [
        ...current,
        { id, message: normalizedMessage, kind },
      ].slice(-3);
      return nextToasts;
    });
  }, []);

  useEffect(() => {
    const visibleToastIds = new Set(toasts.map((toast) => toast.id));
    toastTimers.current.forEach((timer, id) => {
      if (!visibleToastIds.has(id)) {
        window.clearTimeout(timer);
        toastTimers.current.delete(id);
      }
    });

    toasts.forEach((toast) => {
      if (!toastTimers.current.has(toast.id)) {
        toastTimers.current.set(
          toast.id,
          window.setTimeout(() => dismissToast(toast.id), 4500)
        );
      }
    });
  }, [toasts, dismissToast]);

  useEffect(
    () => () => {
      toastTimers.current.forEach((timer) => window.clearTimeout(timer));
      toastTimers.current.clear();
    },
    []
  );

  const askConfirmation = useCallback((options) => {
    if (dialogSequence.current) return;
    const id = ++dialogSequence.current;
    setDialog({ ...options, id, busy: false, error: "" });
    dialogSequence.current = id;
  }, []);

  const closeConfirmation = useCallback((confirmed) => {
    setDialog(null);
    dialogSequence.current = 0;
    return confirmed;
  }, []);

  const setDialogBusy = useCallback((busy) => {
    setDialog((current) => current ? { ...current, busy } : current);
  }, []);

  const setDialogError = useCallback((error) => {
    setDialog((current) => current ? { ...current, error } : current);
  }, []);
  const cancelConfirmation = useCallback(
    () => closeConfirmation(false),
    [closeConfirmation]
  );
  const finishConfirmation = useCallback(
    () => closeConfirmation(true),
    [closeConfirmation]
  );

  return (
    <FeedbackContext.Provider
      value={{
        showToast,
        askConfirmation,
        closeConfirmation,
      }}
    >
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      <ConfirmationDialog
        dialog={dialog}
        onCancel={cancelConfirmation}
        onConfirm={finishConfirmation}
        onDialogBusy={setDialogBusy}
        onDialogError={setDialogError}
      />
    </FeedbackContext.Provider>
  );
}
