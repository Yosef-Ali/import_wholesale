import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ToastContainer from '../ui/ToastContainer';

export default function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--parchment)' }}>
      <Sidebar />
      <main style={{ marginLeft: '15rem', padding: '2.5rem 2.75rem' }}>
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
}
