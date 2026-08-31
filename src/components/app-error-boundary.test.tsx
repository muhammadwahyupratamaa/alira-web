import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { AppErrorBoundary } from './app-error-boundary';

function BrokenComponent(): never {
  throw new Error('Test error');
}

describe('AppErrorBoundary', () => {
  it('focuses an accessible fallback and can recover', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const view = render(
      <AppErrorBoundary>
        <BrokenComponent />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      /data anda tetap aman/i,
    );
    expect(
      screen.getByRole('heading', { name: /Alira belum dapat dibuka/i }),
    ).toHaveFocus();
    expect(
      screen.getByRole('link', { name: /kembali ke halaman masuk/i }),
    ).toHaveAttribute('href', '/login');

    view.rerender(
      <AppErrorBoundary>
        <p>Alira kembali siap.</p>
      </AppErrorBoundary>,
    );
    await userEvent.click(screen.getByRole('button', { name: /coba lagi/i }));
    expect(screen.getByText(/Alira kembali siap/i)).toBeVisible();
  });
});
