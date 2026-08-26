import { screen } from '@testing-library/react';

import { renderWithProviders } from '../test/render-app';
import { App } from './app';

describe('App', () => {
  it('renders the application home route', () => {
    renderWithProviders(<App />);

    expect(
      screen.getByRole('heading', {
        name: /your financial clarity starts here/i,
      }),
    ).toBeInTheDocument();
  });

  it('renders the not-found route', () => {
    renderWithProviders(<App />, { route: '/missing' });

    expect(
      screen.getByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
