import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import AppLayout from './components/Layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ItemList from './pages/Inventory/ItemList'
import PurchaseOrderList from './pages/ImportOrders/PurchaseOrderList'
import SalesOrderList from './pages/Wholesale/SalesOrderList'
import WarehouseList from './pages/Warehouse/WarehouseList'
import Suppliers from './pages/Suppliers'
import Customers from './pages/Customers'
import Reports from './pages/Reports'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading BuildSupply Pro...</p>
        </div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/"               element={<Dashboard />} />
          <Route path="/inventory"      element={<ItemList />} />
          <Route path="/import-orders"  element={<PurchaseOrderList />} />
          <Route path="/wholesale"      element={<SalesOrderList />} />
          <Route path="/warehouse"      element={<WarehouseList />} />
          <Route path="/suppliers"      element={<Suppliers />} />
          <Route path="/customers"      element={<Customers />} />
          <Route path="/reports"        element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
