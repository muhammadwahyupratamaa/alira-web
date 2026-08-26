import { useState, type PropsWithChildren } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { useAuth } from '../auth/use-auth';
import {
  ArrowsIcon,
  GridIcon,
  LogoutIcon,
  PlusIcon,
  WalletIcon,
} from './dashboard-icons';

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: GridIcon, available: true },
  {
    label: 'Transaksi',
    to: '/transactions',
    icon: ArrowsIcon,
    available: false,
  },
  { label: 'Account', to: '/accounts', icon: WalletIcon, available: true },
] as const;

export function AppLayout({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch {
      // Auth state is cleared by the provider even when backend logout fails.
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="product-shell">
      <aside className="sidebar">
        <Link className="wordmark sidebar-wordmark" to="/dashboard">
          Alira<span aria-hidden="true">.</span>
        </Link>
        <nav className="sidebar-nav" aria-label="Navigasi utama">
          {navigation.map(({ label, to, icon: Icon, available }) =>
            available ? (
              <NavLink key={to} to={to} className="nav-item">
                <Icon />
                {label}
              </NavLink>
            ) : (
              <span
                key={to}
                className="nav-item nav-item-disabled"
                aria-disabled="true"
              >
                <Icon />
                {label}
                <span className="soon-label">Segera</span>
              </span>
            ),
          )}
        </nav>
        <div className="sidebar-user">
          <span className="avatar" aria-hidden="true">
            {user?.email.charAt(0).toUpperCase()}
          </span>
          <span className="user-email">{user?.email}</span>
          <button
            type="button"
            className="icon-button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            aria-label="Keluar dari Alira"
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>

      <div className="product-main">
        <header className="mobile-header">
          <Link className="wordmark" to="/dashboard">
            Alira<span aria-hidden="true">.</span>
          </Link>
          <Link
            className="mobile-add"
            to="/transactions/new"
            aria-label="Tambah transaksi"
          >
            <PlusIcon />
          </Link>
        </header>
        {children}
      </div>

      <nav className="mobile-nav" aria-label="Navigasi mobile">
        {navigation.map(({ label, to, icon: Icon, available }) =>
          available ? (
            <NavLink key={to} to={to} className="mobile-nav-item">
              <Icon />
              <span>{label}</span>
            </NavLink>
          ) : (
            <span
              key={to}
              className="mobile-nav-item nav-item-disabled"
              aria-disabled="true"
            >
              <Icon />
              <span>{label}</span>
            </span>
          ),
        )}
      </nav>
    </div>
  );
}
