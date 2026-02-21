import React from "react"
import { useLocation } from "react-router-dom"

export default function OfferDetail() {

  const location = useLocation()
  const offer = location.state?.offer

  if (!offer) {
    return (
      <div className="p-6 md:p-10 text-center">
        Oferta no encontrada.
      </div>
    )
  }

  return (

    <div className="min-h-screen bg-blue-900 p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">

          {/* IMAGEN */}
          <div className="relative">
            <img
              src={offer.image_url}
              alt={offer.title}
              className="w-full h-64 sm:h-80 lg:h-full object-cover"
            />
          </div>

          {/* INFO */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between">

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                {offer.title}
              </h1>

              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {offer.description}
              </p>

              {/* PRECIOS*/}
              <div className="bg-gray-100 rounded-2xl p-4 sm:p-6 mb-6">

                <p className="text-sm text-gray-500 mb-2">
                  Precio Regular
                </p>

                <p className="line-through text-gray-400 text-base sm:text-lg">
                  ${offer.regular_price}
                </p>

                <p className="text-sm text-gray-500 mt-4 mb-2">
                  Precio Oferta
                </p>

                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  ${offer.offer_price}
                </p>

              </div>

            </div>

            {/* BOTÓN */}
            <button className="w-full bg-cyan-950 text-lime-50 py-2 sm:py-3 rounded-xl font-semibold hover:opacity-90 hover:scale-105 hover:bg-amber-400 hover:text-black transition text-sm sm:text-base active:scale-95">
              Comprar
            </button>

          </div>

        </div>

      </div>

    
      <div className="max-w-6xl mx-auto mt-6 sm:mt-8 md:mt-10 bg-white rounded-3xl shadow p-5 sm:p-6 md:p-8">

        <h2 className="text-lg sm:text-xl font-semibold mb-4">
          Condiciones de la oferta
        </h2>

        <ul className="list-disc pl-5 text-gray-600 space-y-2 text-sm sm:text-base">
          <li>Válido hasta agotar existencias.</li>
          <li>No acumulable con otras promociones.</li>
          <li>Presentar cupón al momento de pagar.</li>
        </ul>

      </div>

    </div>
  )
}
