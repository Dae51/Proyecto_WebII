import React from "react"
import { Link } from "react-router-dom"
import { getCurrentSession } from "../resources/AuthService"

export default function OfferCard({ offer, onSelect }) {

  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const regular = Number(offer.regular_price) || 0
  const offerPrice = Number(offer.offer_price) || 0
  const imageSrc = offer.image_url || "https://via.placeholder.com/800x500?text=Oferta"
  const discount = regular > 0
    ? Math.max(0, Math.round(((regular - offerPrice) / regular) * 100))
    : 0
  const showSelectButton = isAuthenticated && typeof onSelect === "function"

  React.useEffect(() => {
    let mounted = true

    ;(async () => {
      const { session } = await getCurrentSession()
      if (!mounted) return
      setIsAuthenticated(!!session?.user)
    })()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="
      group
      bg-white
      rounded-3xl
      overflow-hidden
      transition-all
      duration-500
      shadow-md
      hover:-translate-y-3
      hover:bg-black
      hover:shadow-amber-300
    ">

      {/* Imagen */}
      <div className="relative h-48 sm:h-52 md:h-56 overflow-hidden">

        {/* descuento */}
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 bg-amber-300 text-black px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
          {discount}% OFF
        </div>

        <img
          src={imageSrc}
          alt={offer.title}
          onError={(e) => {
            e.currentTarget.src = "https://via.placeholder.com/800x500?text=Oferta"
          }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-500"></div>

      </div>

      {/* Contenido */}
      <div className="p-4 sm:p-6">

        <h2 className="text-lg sm:text-xl font-semibold mb-2 transition-colors duration-300 group-hover:text-amber-300">
          {offer.title}
        </h2>

        <p className="text-gray-600 text-sm sm:text-base mb-4">
          {offer.description}
        </p>

        <div className="flex items-center gap-3 mb-4">
          <span className="line-through text-gray-400 text-sm sm:text-base">
            ${regular}
          </span>

          <span className="text-green-600 text-xl sm:text-2xl font-bold">
            ${offerPrice}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {showSelectButton && (
            <button
              type="button"
              onClick={() => onSelect?.(offer)}
              className="
                w-full
                bg-emerald-600
                py-2
                sm:py-2.5
                rounded-xl
                transition
                duration-300
                hover:opacity-90
                hover:scale-105
                text-white
                text-sm sm:text-base
              "
            >
              Seleccionar
            </button>
          )}

          <Link to={`/offer/${offer.id}`} state={{ offer }} className="w-full">
            <button className="
              w-full
              bg-cyan-950
              py-2
              sm:py-2.5
              rounded-xl
              transition
              duration-300
              hover:opacity-90
              hover:scale-105
              text-lime-50
              text-sm sm:text-base
              hover:bg-amber-400
              hover:text-black
            ">
              Ver Oferta
            </button>
          </Link>
        </div>

      </div>

    </div>
  )
}
