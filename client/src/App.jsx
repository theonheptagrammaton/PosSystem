import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Loading from './components/Loading';

// Lazy Load Components for Performance
const Login = lazy(() => import('./pages/Login'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Layout = lazy(() => import('./components/Layout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Pos = lazy(() => import('./pages/Pos'));
const Tables = lazy(() => import('./pages/Tables'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Settings = lazy(() => import('./pages/Settings'));
const Branches = lazy(() => import('./pages/Branches'));
const Users = lazy(() => import('./pages/Users'));
const PosTerminal = lazy(() => import('./pages/PosTerminal'));
const WaiterPanel = lazy(() => import('./pages/WaiterPanel'));
const Reports = lazy(() => import('./pages/Reports'));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'));
const PublicLayout = lazy(() => import('./layouts/PublicLayout'));
const MobileMenu = lazy(() => import('./pages/public/MobileMenu'));
const KitchenPanel = lazy(() => import('./pages/KitchenPanel'));

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Super Admin Route Wrapper
const SuperAdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.role !== 'SUPER_ADMIN') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Public Menu Routes */}
          <Route path="/menu/:tenantId/:branchId/:tableId" element={<PublicLayout />}>
             <Route index element={<MobileMenu />} />
          </Route>
  
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/pos-terminal/:branchId" element={<PosTerminal />} />
          <Route path="/waiter-panel/:branchId" element={<WaiterPanel />} />
          <Route path="/kitchen-panel" element={<KitchenPanel />} />
          
          {/* Super Admin Route */}
          <Route 
            path="/super-admin" 
            element={
              <SuperAdminRoute>
                <SuperAdmin />
              </SuperAdminRoute>
            } 
          />
  
          {/* Dashboard Layout Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} /> {/* Specific path for dashboard */}
            <Route path="pos" element={<Pos />} />
            <Route path="tables" element={<Tables />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="branches" element={<Branches />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
            <Route path="reports" element={<Reports />} />
          </Route>
  
          {/* Default redirect for root path */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
