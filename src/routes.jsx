import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Evaluations from './pages/Evaluations.tsx';
import Login from './pages/Login.tsx';
import MyEvaluations from './pages/MyEvaluations.tsx';
import WriteEvaluation from './pages/WriteEvaluation.tsx';
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
      <Route
        path="/evaluation-schreiben"
        element={
          <ProtectedRoute>
            <WriteEvaluation />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
