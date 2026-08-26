import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

import { GuestRoute, ProtectedRoute } from '../features/auth/auth-route';
import { LoginPage } from '../features/auth/login-page';
import { RegisterPage } from '../features/auth/register-page';
import { NotFoundPage } from './not-found-page';

const DashboardPage = lazy(() =>
  import('../features/dashboard/dashboard-page').then((module) => ({
    default: module.DashboardPage,
  })),
);
const AccountsPage = lazy(() =>
  import('../features/accounts/accounts-page').then((module) => ({
    default: module.AccountsPage,
  })),
);
const CreateAccountPage = lazy(() =>
  import('../features/accounts/create-account-page').then((module) => ({
    default: module.CreateAccountPage,
  })),
);
const AccountDetailPage = lazy(() =>
  import('../features/accounts/account-detail-page').then((module) => ({
    default: module.AccountDetailPage,
  })),
);
const CategoriesPage = lazy(() =>
  import('../features/categories/categories-page').then((module) => ({
    default: module.CategoriesPage,
  })),
);
const FeaturePlaceholderPage = lazy(() =>
  import('../features/dashboard/feature-placeholder-page').then((module) => ({
    default: module.FeaturePlaceholderPage,
  })),
);

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<RouteLoading />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="/transactions/new"
          element={
            <Suspense fallback={<RouteLoading />}>
              <FeaturePlaceholderPage title="Tambah transaksi" />
            </Suspense>
          }
        />
        <Route
          path="/accounts"
          element={
            <Suspense fallback={<RouteLoading />}>
              <AccountsPage />
            </Suspense>
          }
        />
        <Route
          path="/accounts/new"
          element={
            <Suspense fallback={<RouteLoading />}>
              <CreateAccountPage />
            </Suspense>
          }
        />
        <Route
          path="/accounts/:id"
          element={
            <Suspense fallback={<RouteLoading />}>
              <AccountDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/categories"
          element={
            <Suspense fallback={<RouteLoading />}>
              <CategoriesPage />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function RouteLoading() {
  return (
    <main className="session-loader" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>Memuat halaman…</span>
    </main>
  );
}
