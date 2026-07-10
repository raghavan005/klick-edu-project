import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import LeadDetailPage from './pages/LeadDetailPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import { queryClient } from './lib/queryClient.ts';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* BrowserRouter must wrap AuthProvider because AuthProvider uses useNavigate */}
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected — any authenticated user */}
              <Route path="/" element={
                <ProtectedRoute><App /></ProtectedRoute>
              } />
              <Route path="/leads/:id" element={
                <ProtectedRoute><LeadDetailPage /></ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
