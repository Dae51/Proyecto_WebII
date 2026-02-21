import React from "react"
import { useState, useEffect } from "react"
import OfferCard from "../components/offerCard"
import { getCupones, filterCuponesByTipo, normalizeTipoEnum } from "../resources/CuponesService"

const CATEGORY_FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "restaurante", label: "Restaurante" },
  { value: "belleza", label: "Belleza" },
  { value: "talleres", label: "Talleres" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "entretenimiento", label: "Entretenimiento" },
  { value: "otros", label: "Otros" },
]

export default function Home() {

  const [offers, setOffers] = useState([])
  const [filteredOffers, setFilteredOffers] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("todas")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOffers()
  }, [])

  async function fetchOffers() {
    setLoading(true)
    setError(null)

    const { cupones, error: fetchError } = await getCupones()

    if (fetchError) {
      setError("Error al cargar ofertas")
      setOffers([])
      setFilteredOffers([])
      setLoading(false)
      return
    }

    setOffers(cupones)
    setFilteredOffers(cupones)
    setLoading(false)
  }

  function handleFilter(category) {
    const normalizedCategory = normalizeTipoEnum(category)
    const categoryValue = normalizedCategory === "taller" ? "talleres" : normalizedCategory

    setSelectedCategory(categoryValue)
    setFilteredOffers(filterCuponesByTipo(offers, categoryValue))
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
        {CATEGORY_FILTERS.map(cat => (
          <button
            key={cat.value}
            onClick={() => handleFilter(cat.value)}
            className={`px-4 py-2 rounded-lg transition capitalize text-sm md:text-base
              ${selectedCategory === cat.value
                ? "bg-amber-200 text-black"
                : "bg-white shadow"
              }`}
          >
            {cat.label}
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
