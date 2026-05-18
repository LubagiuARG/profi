import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useAdmin } from './context/AdminContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Loader from './components/Loader'
import Home from './pages/Home'
import Presupuesto from './pages/Presupuesto'
import Profesionales from './pages/Profesionales'
import Registro from './pages/Registro'
import Login from './pages/Login'
import Panel from './pages/Panel'
import ComoFunciona from './pages/ComoFunciona'
import Terminos from './pages/Terminos'
import Privacidad from './pages/Privacidad'
import Resena from './pages/Resena'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCategorias from './pages/admin/AdminCategorias'
import AdminProfesionales from './pages/admin/AdminProfesionales'
import AdminAdmins from './pages/admin/AdminAdmins'
import './styles/global.css'

function RutaProtegida({ children }) {
  const { profesional, cargando } = useAuth()
  if (cargando) return <Loader />
  if (!profesional) return <Navigate to="/login" replace />
  return children
}

function RutaAdmin({ children, soloSuperAdmin = false }) {
  const { admin, cargando } = useAdmin()
  if (cargando) return <Loader />
  if (!admin) return <Navigate to="/admin" replace />
  if (soloSuperAdmin && admin.rol !== 'superadmin') return <Navigate to="/admin/dashboard" replace />
  return children
}

function AdminRoot() {
  const { admin, cargando } = useAdmin()
  if (cargando) return <Loader />
  if (admin) return <Navigate to="/admin/dashboard" replace />
  return <AdminLogin />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Admin routes (no Header/Footer) ── */}
        <Route path="/admin" element={<AdminRoot />} />
        <Route path="/admin/dashboard" element={
          <RutaAdmin><AdminDashboard /></RutaAdmin>
        } />
        <Route path="/admin/categorias" element={
          <RutaAdmin><AdminCategorias /></RutaAdmin>
        } />
        <Route path="/admin/profesionales" element={
          <RutaAdmin><AdminProfesionales /></RutaAdmin>
        } />
        <Route path="/admin/admins" element={
          <RutaAdmin soloSuperAdmin><AdminAdmins /></RutaAdmin>
        } />

        {/* ── Public routes (with Header/Footer) ── */}
        <Route path="/*" element={
          <>
            <Header />
            <Routes>
              <Route path="/"              element={<Home />} />
              <Route path="/profesionales" element={<Profesionales />} />
              <Route path="/presupuesto"   element={<Presupuesto />} />
              <Route path="/registro"      element={<Registro />} />
              <Route path="/login"         element={<Login />} />
              <Route path="/como-funciona" element={<ComoFunciona />} />
              <Route path="/terminos"      element={<Terminos />} />
              <Route path="/privacidad"    element={<Privacidad />} />
              <Route path="/resena/:token" element={<Resena />} />
              <Route path="/panel"         element={
                <RutaProtegida><Panel /></RutaProtegida>
              } />
            </Routes>
            <Footer />
          </>
        } />
      </Routes>
    </BrowserRouter>
  )
}
