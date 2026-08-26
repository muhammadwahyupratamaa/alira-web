import { Route, Routes } from 'react-router-dom';

import { HomePage } from './home-page';
import { NotFoundPage } from './not-found-page';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
