import React from "react"

import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import OfferDetail from "./pages/offerDetail"
import AuthComponent from "./pages/AuthComponent"
import ForgotPassword from "./pages/ForgotPassword"
import RestorePassword from "./pages/RestorePassword"
import MisCupones from "./pages/MisCupones"


function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/offer/:id" element={<OfferDetail />} />
        <Route path="/mis-cupones" element={<MisCupones/>} />
        <Route path="/auth" element={<AuthComponent/>}/>
        <Route path="/forgot-password" element={<ForgotPassword/>}/>
        <Route path="/restore-password" element={<RestorePassword/>}/>
      </Routes>
    </>
  )
}

export default App
