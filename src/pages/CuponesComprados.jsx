import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { getCurrentSession } from "../resources/AuthService";
import { clearCheckout, getPurchasedCoupons } from "../resources/PurchaseService";

export default function CuponesComprados() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { session } = await getCurrentSession();
      const userId = session?.user?.id ?? null;
      const { items: purchasedItems, error } = await getPurchasedCoupons(userId);

      if (error && error.status !== 401) {
        toast.error(error.message || "No se pudo cargar el historial de compras.");
      }

      if (userId && searchParams.get("pago") === "exito") {
        clearCheckout(userId);
        toast.success("Pago realizado con éxito.");
        toast.success("Tus cupones fueron registrados correctamente.");
        navigate("/cupones-comprados", { replace: true });
      }

      setItems(purchasedItems ?? []);
      setLoading(false);
    })();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020b24] p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-300 mb-6">
            Cupones Comprados
          </h1>
          <div className="bg-white rounded-2xl p-6 text-center text-gray-700">
            Cargando compras...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020b24] p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-300 mb-6">
          Mis cupones
        </h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-700">
            Aun no tienes cupones comprados.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.purchaseId} className="bg-white rounded-2xl overflow-hidden shadow-md">
                <img
                  src={item.offer?.image_url || "https://via.placeholder.com/500x280?text=Cupon"}
                  alt={item.offer?.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">{item.offer?.title}</h2>
                  <p className="text-sm text-gray-600 mb-2">{item.offer?.description}</p>
                  <p className="text-sm text-gray-700">Cantidad: {item.quantity}</p>
                  <p className="text-sm text-gray-700">
                    Total: ${Number(item.subtotal || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Comprado: {new Date(item.purchasedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
