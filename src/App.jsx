import React from "react"

import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import OfferDetail from "./pages/offerDetail"
import AuthComponent from "./pages/AuthComponent"
import ForgotPassword from "./pages/ForgotPassword"
import RestorePassword from "./pages/RestorePassword"
import Checkout from "./pages/Checkout"
import CuponesComprados from "./pages/CuponesComprados"


function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/offer/:id" element={<OfferDetail />} />
        <Route path="/auth" element={<AuthComponent/>}/>
        <Route path="/forgot-password" element={<ForgotPassword/>}/>
        <Route path="/restore-password" element={<RestorePassword/>}/>
        <Route path="/checkout" element={<Checkout/>}/>
        <Route path="/cupones-comprados" element={<CuponesComprados/>}/>
      </Routes>
    </>
  )
}

export default App
