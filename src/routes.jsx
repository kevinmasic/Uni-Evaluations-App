import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Evaluations from './pages/Evaluations.tsx';
import Login from './pages/Login.tsx';
import MyEvaluations from './pages/MyEvaluations.tsx';
import NotFound from './pages/NotFound.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function RoutesConfig() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/evaluations/:modulId" element={<Evaluations />} />
      <Route
        path="/me"
        element={
          <ProtectedRoute>
            <MyEvaluations />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
