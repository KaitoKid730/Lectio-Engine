import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/routing/ProtectedRoute';
import { RoleGuard } from './components/routing/RoleGuard';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Edge Case Pages
import { LoginPage } from './pages/LoginPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ServerErrorPage } from './pages/ServerErrorPage';
import { SessionExpiredPage } from './pages/SessionExpiredPage';

// Feature Views
import { OverviewDashboard } from './components/OverviewDashboard';
import { StudentPortalView } from './components/StudentPortalView';
import { BookProcessingView } from './components/BookProcessingView';
import { LessonAIView } from './components/LessonAIView';
import { TeacherCopilotView } from './components/TeacherCopilotView';
import { QAAuditorView } from './components/QAAuditorView';
import { ImageAIView } from './components/ImageAIView';
import { PresentationStudioView } from './components/PresentationStudioView';
import { AdminUserManagementView } from './components/AdminUserManagementView';
import { DocsSpecViewer } from './components/DocsSpecViewer';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public / Auth / Edge Case Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="/session-expired" element={<SessionExpiredPage />} />

      {/* Protected Layout Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            user?.role === 'student' ? (
              <Navigate to="/student" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        <Route
          path="dashboard"
          element={
            <RoleGuard allowedRoles={['teacher', 'curriculum_lead', 'qa_auditor', 'admin']}>
              <OverviewDashboard />
            </RoleGuard>
          }
        />

        <Route
          path="student"
          element={
            <RoleGuard allowedRoles={['student', 'teacher', 'admin']}>
              <StudentPortalView />
            </RoleGuard>
          }
        />

        <Route
          path="books"
          element={
            <RoleGuard allowedRoles={['teacher', 'curriculum_lead', 'admin']}>
              <BookProcessingView />
            </RoleGuard>
          }
        />

        <Route
          path="lessons"
          element={
            <RoleGuard allowedRoles={['teacher', 'curriculum_lead', 'admin']}>
              <LessonAIView />
            </RoleGuard>
          }
        />

        <Route
          path="presentations"
          element={
            <RoleGuard allowedRoles={['teacher', 'curriculum_lead', 'admin']}>
              <PresentationStudioView />
            </RoleGuard>
          }
        />

        <Route
          path="copilot"
          element={
            <RoleGuard allowedRoles={['teacher', 'curriculum_lead', 'admin']}>
              <TeacherCopilotView />
            </RoleGuard>
          }
        />

        <Route
          path="qa"
          element={
            <RoleGuard allowedRoles={['qa_auditor', 'curriculum_lead', 'admin']}>
              <QAAuditorView />
            </RoleGuard>
          }
        />

        <Route
          path="images"
          element={
            <RoleGuard allowedRoles={['teacher', 'curriculum_lead', 'admin']}>
              <ImageAIView />
            </RoleGuard>
          }
        />

        <Route
          path="admin"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminUserManagementView />
            </RoleGuard>
          }
        />

        <Route path="specs" element={<DocsSpecViewer />} />
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
