import React from "react"

export default function Navbar() {
  return (
    <nav className="bg-cyan-600 text-fuchsia-200 px-4 sm:px-6 md:px-8 py-3 md:py-4 flex justify-between items-center font-sans shadow">

      <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-wide">
        LA CUPONERA
      </h1>

      <div className="flex items-center gap-3 sm:gap-4">

        <button className="hover:text-rose-300 transition font-bold text-sm sm:text-base">
          Login
        </button>

        <button className="bg-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-rose-300 hover:text-black transition font-bold text-sm sm:text-base">
          Registrarse
        </button>

      </div>

    </nav>
  )
}
