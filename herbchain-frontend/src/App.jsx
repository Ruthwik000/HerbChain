
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BlockchainProvider } from './context/BlockchainContext';
import { ToastContainer, useToast } from './components/ToastNotification';
import ErrorBoundary from './components/ErrorBoundary';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';

// Farmer Pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import CreateBatch from './pages/farmer/CreateBatch';
import MyBatches from './pages/farmer/MyBatches';
import FarmerBatchDetails from './pages/farmer/BatchDetails';

// Lab Pages
import LabDashboard from './pages/lab/LabDashboard';
import LabBatchDetails from './pages/lab/BatchDetails';

// Manufacturer Pages
import ManufacturerDashboard from './pages/manufacturer/ManufacturerDashboard';
import ManufacturerBatchDetails from './pages/manufacturer/BatchDetails';

// Consumer Pages
import TracePage from './pages/consumer/TracePage';
import ConsumerBatchDetails from './pages/consumer/BatchDetails';
import HistoryPage from './pages/consumer/HistoryPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
};

// App Routes Component
const AppRoutes = () => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth/login" element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        } />

        {/* Farmer Routes */}
        <Route path="/farmer/*" element={
          <ProtectedRoute allowedRoles={['Farmer']}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<FarmerDashboard />} />
                <Route path="create-batch" element={<CreateBatch />} />
                <Route path="my-batches" element={<MyBatches />} />
                <Route path="batch/:batchId" element={<FarmerBatchDetails />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Lab Routes */}
        <Route path="/lab/*" element={
          <ProtectedRoute allowedRoles={['Lab']}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<LabDashboard />} />
                <Route path="batch/:batchId" element={<LabBatchDetails />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Manufacturer Routes */}
        <Route path="/manufacturer/*" element={
          <ProtectedRoute allowedRoles={['Manufacturer']}>
            <DashboardLayout>
              <Routes>
                <Route path="dashboard" element={<ManufacturerDashboard />} />
                <Route path="batch/:batchId" element={<ManufacturerBatchDetails />} />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Consumer Routes (Public) */}
        <Route path="/consumer/*" element={
          <PublicLayout>
            <Routes>
              <Route path="trace" element={<TracePage />} />
              <Route path="batch" element={<ConsumerBatchDetails />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="" element={<Navigate to="trace" replace />} />
            </Routes>
          </PublicLayout>
        } />

        {/* Default Routes */}
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <BlockchainProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <AppRoutes />
            </div>
          </Router>
        </AuthProvider>
      </BlockchainProvider>
    </ErrorBoundary>
  );
}

export default App;