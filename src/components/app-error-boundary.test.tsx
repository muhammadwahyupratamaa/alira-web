import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { AppErrorBoundary } from './app-error-boundary';

function BrokenComponent(): never {
  throw new Error('Test error');
}

describe('AppErrorBoundary', () => {
  it('renders a recovery message when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <BrokenComponent />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      /we could not load alira/i,
    );
  });
});
