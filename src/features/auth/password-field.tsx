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
          {isVisible ? 'Sembunyikan' : 'Lihat'}
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
