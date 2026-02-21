import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { getCurrentSession } from "../resources/AuthService"
import { addToCheckout } from "../resources/PurchaseService"

export default function OfferDetail() {

  const location = useLocation()
  const navigate = useNavigate()
  const offer = location.state?.offer
  const [quantity, setQuantity] = React.useState(1)
  const [canBuy, setCanBuy] = React.useState(false)

  React.useEffect(() => {
    (async () => {
      const { session } = await getCurrentSession()
      setCanBuy(!!session?.user)
    })()
  }, [])

  if (!offer) {
    return (
      <div className="p-6 md:p-10 text-center">
        Oferta no encontrada.
      </div>
    )
  }

  const regular = Number(offer.regular_price) || 0
  const offerPrice = Number(offer.offer_price) || 0
  const imageSrc = offer.image_url || "https://via.placeholder.com/900x600?text=Oferta"

  function handleQuantityChange(event) {
    const next = Number(event.target.value)
    if (!Number.isInteger(next) || next < 1) {
      setQuantity(1)
      return
    }

    setQuantity(next)
  }

  async function handleAddToCheckout() {
    const { session } = await getCurrentSession()
    const userId = session?.user?.id ?? null

    if (!userId) {
      toast.info("Inicia sesión para comprar cupones.")
      navigate("/auth")
      return
    }

    addToCheckout({
      userId,
      offer,
      quantity,
    })

    toast.success("Oferta agregada al checkout.")
    navigate("/checkout")
  }

  return (

    <div className="min-h-screen bg-blue-900 p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">

          {/* IMAGEN */}
          <div className="relative">
            <img
              src={imageSrc}
              alt={offer.title}
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/900x600?text=Oferta"
              }}
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
                  ${regular}
                </p>

                <p className="text-sm text-gray-500 mt-4 mb-2">
                  Precio Oferta
                </p>

                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  ${offerPrice}
                </p>

              </div>

            </div>

            {canBuy && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label htmlFor={`qty-detail-${offer.id}`} className="text-sm text-gray-700 font-medium">
                    Cantidad
                  </label>
                  <input
                    id={`qty-detail-${offer.id}`}
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-24 rounded-lg border border-gray-300 px-2 py-1.5"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddToCheckout}
                  className="w-full bg-emerald-600 text-white py-2 sm:py-3 rounded-xl font-semibold hover:opacity-90 hover:scale-105 transition text-sm sm:text-base active:scale-95"
                >
                  Comprar
                </button>
              </div>
            )}

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
