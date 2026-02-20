import React from "react"

import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import OfferDetail from "./pages/offerDetail"
import AuthComponent from "./pages/AuthComponent"
import ForgotPassword from "./pages/ForgotPassword"


function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/offer/:id" element={<OfferDetail />} />
        <Route path="/auth" element={<AuthComponent/>}/>
        <Route path="/restore" element={<ForgotPassword/>}/>
      </Routes>
    </>
  )
}

export default App
