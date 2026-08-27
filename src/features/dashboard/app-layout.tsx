import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type PropsWithChildren,
} from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { useAuth } from '../auth/use-auth';
import {
  ArrowsIcon,
  GridIcon,
  LogoutIcon,
  MoreIcon,
  PlusIcon,
  UserIcon,
  WalletIcon,
} from './dashboard-icons';

const navigation: readonly {
  label: string;
  to: string;
  icon: ComponentType;
  available: boolean;
}[] = [
  { label: 'Dashboard', to: '/dashboard', icon: GridIcon, available: true },
  {
    label: 'Transaksi',
    to: '/transactions',
    icon: ArrowsIcon,
    available: true,
  },
  { label: 'Account', to: '/accounts', icon: WalletIcon, available: true },
  { label: 'Kategori', to: '/categories', icon: GridIcon, available: true },
  { label: 'Profile', to: '/profile', icon: UserIcon, available: true },
];

export function AppLayout({ children }: PropsWithChildren) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

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
          <Link
            className="sidebar-profile-link"
            to="/profile"
            aria-label="Buka Profile dan Settings"
          >
            <span className="avatar" aria-hidden="true">
              {user?.email.charAt(0).toUpperCase()}
            </span>
            <span className="user-email">{user?.email}</span>
          </Link>
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
        {navigation.slice(0, 3).map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} className="mobile-nav-item">
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`mobile-nav-item mobile-more-trigger${
            location.pathname.startsWith('/categories') ||
            location.pathname.startsWith('/profile') ||
            location.pathname.startsWith('/settings')
              ? 'active'
              : ''
          }`}
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
          aria-current={
            location.pathname.startsWith('/categories') ||
            location.pathname.startsWith('/profile') ||
            location.pathname.startsWith('/settings')
              ? 'page'
              : undefined
          }
          onClick={() => {
            setMoreOpen(true);
          }}
        >
          <MoreIcon />
          <span>Lainnya</span>
        </button>
      </nav>
      {moreOpen ? (
        <MobileMoreSheet
          isLoggingOut={isLoggingOut}
          onClose={() => {
            setMoreOpen(false);
          }}
          onLogout={() => void handleLogout()}
        />
      ) : null}
    </div>
  );
}

function MobileMoreSheet({
  isLoggingOut,
  onClose,
  onLogout,
}: {
  isLoggingOut: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
        'a, button:not(:disabled)',
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
  }, [onClose]);

  return (
    <div
      className="more-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={sheetRef}
        className="mobile-more-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="more-title"
      >
        <div className="more-sheet-heading">
          <div>
            <p className="section-kicker">Navigasi</p>
            <h2 id="more-title">Lainnya</h2>
          </div>
          <button
            ref={closeRef}
            className="sheet-close"
            type="button"
            onClick={onClose}
            aria-label="Tutup menu lainnya"
          >
            ×
          </button>
        </div>
        <nav aria-label="Navigasi lainnya" className="more-links">
          <Link to="/categories" onClick={onClose}>
            <GridIcon />
            <span>
              <strong>Kategori</strong>
              <small>Atur kelompok pemasukan dan pengeluaran</small>
            </span>
          </Link>
          <Link to="/profile" onClick={onClose}>
            <UserIcon />
            <span>
              <strong>Profile & Settings</strong>
              <small>Kelola preferensi dan keamanan akun</small>
            </span>
          </Link>
        </nav>
        <button
          className="more-logout"
          type="button"
          disabled={isLoggingOut}
          onClick={onLogout}
        >
          <LogoutIcon />
          {isLoggingOut ? 'Keluar…' : 'Keluar dari Alira'}
        </button>
      </section>
    </div>
  );
}
