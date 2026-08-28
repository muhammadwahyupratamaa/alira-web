import { useEffect, useRef } from 'react';

import type { PasswordValues } from './profile.schemas';
import { PasswordForm } from './password-form';

export function ChangePasswordDialog({
  pending,
  error,
  onCancel,
  onSubmit,
  onSuccess,
}: {
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: PasswordValues) => Promise<boolean>;
  onSuccess: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current
      ?.querySelector<HTMLInputElement>('#current-password')
      ?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pending) onCancel();
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input, button:not(:disabled)',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onCancel, pending]);

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        className="confirm-dialog password-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        aria-describedby="change-password-description"
      >
        <button
          className="dialog-close"
          type="button"
          disabled={pending}
          onClick={onCancel}
          aria-label="Tutup ubah password"
        >
          ×
        </button>
        <p className="section-kicker">Keamanan akun</p>
        <h2 id="change-password-title">Ubah password</h2>
        <p id="change-password-description">
          Gunakan password yang kuat dan berbeda dari password sebelumnya.
        </p>
        <PasswordForm
          pending={pending}
          error={error}
          onCancel={onCancel}
          onSubmit={onSubmit}
          onSuccess={onSuccess}
        />
      </section>
    </div>
  );
}
