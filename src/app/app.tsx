import { AppErrorBoundary } from '../components/app-error-boundary';
import { AppRoutes } from '../routes/app-routes';

export function App() {
  return (
    <AppErrorBoundary>
      <AppRoutes />
    </AppErrorBoundary>
  );
}
