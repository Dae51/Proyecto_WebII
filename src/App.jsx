import React from "react"

import { Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./components/Navbar"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import Home from "./pages/Home"
import OfferDetail from "./pages/offerDetail"
import AuthComponent from "./pages/AuthComponent"
import ForgotPassword from "./pages/ForgotPassword"
import RestorePassword from "./pages/RestorePassword"
import Checkout from "./pages/Checkout"
import CuponesComprados from "./pages/CuponesComprados"
import Dashboard from "./pages/dashboard/Dashboard"
import { DASHBOARD_ROLES, USER_ROLES } from "./resources/roles"

function AppShell() {
  const location = useLocation()
  const hideNavbar = location.pathname.startsWith("/dashboard")

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/offer/:id" element={<OfferDetail />} />
        <Route path="/auth" element={<AuthComponent/>}/>
        <Route path="/forgot-password" element={<ForgotPassword/>}/>
        <Route path="/restore-password" element={<RestorePassword/>}/>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={DASHBOARD_ROLES}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.CLIENT]}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cupones-comprados"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.CLIENT]}>
              <CuponesComprados />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default function App() {
  return <AppShell />
}
