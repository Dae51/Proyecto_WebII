import React from "react"
import { useState, useEffect } from "react"
import OfferCard from "../components/offerCard"

export default function Home() {

  const [offers, setOffers] = useState([])
  const [filteredOffers, setFilteredOffers] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("todas")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOffers()
  }, [])

  function fetchOffers() {
    setTimeout(() => {
      try {
        const dummyData = [
          {
            id: 1,
            title: "2x1 en Camperitos",
            description: "Válido todos los días",
            regular_price: 18.9,
            offer_price: 9.45,
            rubro: "restaurantes",
            status: "approved",
            start_date: "2026-02-01",
            end_date: "2026-02-28",
            image_url: "https://inturfiles.s3.us-east-2.amazonaws.com/folder/products/500X500/camperitos_07f813d_fd8d538.jpg"
          },
          {
            id: 2,
            title: "Spa 50% descuento",
            description: "Incluye masaje relajante",
            regular_price: 40,
            offer_price: 10.50,
            rubro: "belleza",
            status: "approved",
            start_date: "2026-02-10",
            end_date: "2026-05-20",
            image_url: "https://bambucitycenter.com/wp-content/uploads/2024/04/Vidals.png"
          },
          {
            id: 3,
            title: "Cambio de aceite",
            description: "Incluye revisión general",
            regular_price: 50,
            offer_price: 30,
            rubro: "talleres",
            status: "approved",
            start_date: "2026-01-01",
            end_date: "2026-03-31",
            image_url: "https://www.impressarepuestos.com/nicaragua/files/2019/01/image1-1.jpeg"
          }
        ]

        const today = new Date()

        const activeOffers = dummyData.filter(offer => {
          const start = new Date(offer.start_date)
          const end = new Date(offer.end_date)

          return (
            offer.status === "approved" &&
            today >= start &&
            today <= end
          )
        })

        setOffers(activeOffers)
        setFilteredOffers(activeOffers)
        setLoading(false)

      } catch (err) {
        setError("Error al cargar ofertas")
        setLoading(false)
      }
    }, 1000)
  }

  function handleFilter(category) {
    setSelectedCategory(category)

    if (category === "todas") {
      setFilteredOffers(offers)
    } else {
      const filtered = offers.filter(
        offer => offer.rubro === category
      )
      setFilteredOffers(filtered)
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-10 text-center text-lg md:text-xl">
        Cargando ofertas...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-10 text-center text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-900 p-4 sm:p-6 md:p-8 lg:p-10">

      <div className="text-center mb-8 md:mb-12">

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-amber-400 bg-clip-text text-transparent">
          Descubre Ofertas Increíbles
        </h1>

        <p className="text-white mt-4 text-base sm:text-lg max-w-2xl mx-auto px-2">
          Aprovecha descuentos exclusivos en restaurantes, belleza y más.
        </p>

      </div>

      {/* Filtro */}
      <div className="flex gap-3 md:gap-4 mb-6 flex-wrap justify-center md:justify-start">
        {["todas", "restaurantes", "belleza", "talleres"].map(cat => (
          <button
            key={cat}
            onClick={() => handleFilter(cat)}
            className={`px-4 py-2 rounded-lg transition capitalize text-sm md:text-base
              ${selectedCategory === cat
                ? "bg-amber-200 text-black"
                : "bg-white shadow"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de ofertas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOffers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>

      {/* Sin resultados */}
      {filteredOffers.length === 0 && (
        <p className="text-center text-gray-500 mt-8 md:mt-10 text-sm md:text-base">
          No hay ofertas en esta categoría.
        </p>
      )}

    </div>
  )
}
