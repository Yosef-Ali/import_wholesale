import { useEffect, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
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
import Users from './pages/Users'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App error:', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#fee2e2', color: '#991b1b', minHeight: '100vh' }}>
          <h2 style={{ margin: '0 0 1rem' }}>App error — check browser console (F12)</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{(this.state.error as Error).message}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

function ProtectedRoute({ children }: { children: ReactNode }) {
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
    <ErrorBoundary>
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
            <Route path="/users"          element={<Users />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
