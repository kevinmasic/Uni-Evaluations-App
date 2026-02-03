import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { loading, user } = useAuth();
  if (loading) return <p>Lade…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
