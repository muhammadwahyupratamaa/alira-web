import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { AuthContext, type AuthContextValue } from '../auth/auth-context';
import { AppLayout } from './app-layout';

const authValue: AuthContextValue = {
  user: {
    id: '5b9a82bd-e08f-4c93-a947-6f29bb680cef',
    email: 'user@example.com',
    currency: 'IDR',
    timezone: 'Asia/Jakarta',
    createdAt: '2026-08-26T00:00:00.000Z',
    updatedAt: '2026-08-26T00:00:00.000Z',
  },
  isBootstrapping: false,
  login: vi.fn(),
  logout: vi.fn(),
  syncUser: vi.fn(),
};

describe('AppLayout mobile navigation', () => {
  it('keeps four primary destinations and exposes secondary routes in More', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthContext value={authValue}>
          <AppLayout>
            <p>Content</p>
          </AppLayout>
        </AuthContext>
      </MemoryRouter>,
    );

    const mobileNav = screen.getByRole('navigation', {
      name: /navigasi mobile/i,
    });
    expect(mobileNav.querySelectorAll('a, button')).toHaveLength(4);
    expect(mobileNav).toHaveTextContent(/dashboard/i);
    expect(mobileNav).toHaveTextContent(/transaksi/i);
    expect(mobileNav).toHaveTextContent(/account/i);

    const trigger = screen.getByRole('button', { name: /lainnya/i });
    await userEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: /lainnya/i });
    expect(dialog).toBeVisible();
    expect(
      within(dialog).getByRole('link', { name: /kategori/i }),
    ).toHaveAttribute('href', '/categories');
    expect(
      within(dialog).getByRole('link', { name: /profile & settings/i }),
    ).toHaveAttribute('href', '/profile');

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
