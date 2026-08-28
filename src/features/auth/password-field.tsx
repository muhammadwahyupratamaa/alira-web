import { useState, type InputHTMLAttributes } from 'react';

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
}

export function PasswordField({
  label,
  error,
  id,
  ...inputProps
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <div className="password-control">
        <input
          {...inputProps}
          id={id}
          type={isVisible ? 'text' : 'password'}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
        />
        <button
          className="password-toggle"
          type="button"
          onClick={() => {
            setIsVisible((current) => !current);
          }}
          aria-label={
            isVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
          }
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            {isVisible ? (
              <>
                <path d="m3 3 18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c5.2 0 8.7 4.4 9.7 6.1a1.9 1.9 0 0 1 0 1.8 15 15 0 0 1-3 3.7" />
                <path d="M6.2 6.2A15 15 0 0 0 2.3 10a1.9 1.9 0 0 0 0 1.8C3.3 13.6 6.8 18 12 18c.9 0 1.8-.1 2.6-.4" />
              </>
            ) : (
              <>
                <path d="M2.3 10.1C3.3 8.4 6.8 4 12 4s8.7 4.4 9.7 6.1a1.9 1.9 0 0 1 0 1.8C20.7 13.6 17.2 18 12 18S3.3 13.6 2.3 11.9a1.9 1.9 0 0 1 0-1.8Z" />
                <circle cx="12" cy="11" r="3" />
              </>
            )}
          </svg>
        </button>
      </div>
      {error ? (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
