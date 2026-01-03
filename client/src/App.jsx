import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pos from './pages/Pos';
import Tables from './pages/Tables';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import Branches from './pages/Branches';
import Users from './pages/Users';
import PosTerminal from './pages/PosTerminal';
import Reports from './pages/Reports';
import SuperAdmin from './pages/SuperAdmin';

import PublicLayout from './layouts/PublicLayout';
import MobileMenu from './pages/public/MobileMenu';

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
              {(() => { console.log("Rendering Onboarding Route"); return <Onboarding />; })()}
            </ProtectedRoute>
          } 
        />
        
        <Route path="/pos-terminal/:branchId" element={<PosTerminal />} />
        
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
    </BrowserRouter>
  );
}

export default App;
