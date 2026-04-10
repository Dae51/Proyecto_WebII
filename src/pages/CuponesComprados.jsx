import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentSession } from "../resources/AuthService";
import {
  clearCheckout,
  getPurchasedCoupons,
  isPurchaseRedeemed,
  PURCHASE_STATES,
} from "../resources/PurchaseService";
import { generarCuponPDF, generarListaCuponesPDF } from "../resources/PDFService";

export default function CuponesComprados() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("disponibles"); // "disponibles", "canjeados", "vencidos"

  useEffect(() => {
    let focus = true;
    (async () => {
      setLoading(true);
      const { session } = await getCurrentSession();
      const userId = session?.user?.id ?? null;

      if (userId && searchParams.get("pago") === "exito") {
        clearCheckout(userId);
        toast.success("Pago realizado con éxito.");
        toast.success("Tus cupones fueron registrados correctamente.");
        navigate("/cupones-comprados", { replace: true });
      }

      let fetchedItems = [];

      if (activeTab === "canjeados") {
        const { items: purchasedItems, error } = await getPurchasedCoupons(userId, PURCHASE_STATES.REDEEMED);
        if (error && error.status !== 401) {
          toast.error(error.message || "No se pudo cargar el historial de compras.");
        }
        fetchedItems = purchasedItems ?? [];
      } else {
        const { items: purchasedItems, error } = await getPurchasedCoupons(userId);
        if (error && error.status !== 401) {
          toast.error(error.message || "No se pudo cargar el historial de compras.");
        }

        const today = new Date();

        fetchedItems = (purchasedItems ?? []).filter((item) => {
          if (isPurchaseRedeemed(item.estado)) return false;

          const expDate = item.offer?.expiration_date ? new Date(item.offer.expiration_date) : null;
          const isExpired = expDate ? expDate < today : false;

          if (activeTab === "vencidos") return isExpired;
          if (activeTab === "disponibles") return !isExpired;
          return true;
        });
      }

      if (focus) {
        setItems(fetchedItems);
        setLoading(false);
      }
    })();

    return () => { focus = false; };
  }, [navigate, searchParams, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020b24] p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-300 mb-6">
            Cupones Comprados
          </h1>
          <div className="bg-white rounded-2xl p-6 text-center text-gray-700 shadow-md">
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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("disponibles")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition text-sm sm:text-base text-center ${
                activeTab === "disponibles" ? "bg-amber-300 text-black font-bold shadow" : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
              }`}
            >
              Disponibles
            </button>
            <button
              onClick={() => setActiveTab("canjeados")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition text-sm sm:text-base text-center ${
                activeTab === "canjeados" ? "bg-amber-300 text-black font-bold shadow" : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
              }`}
            >
              Canjeados
            </button>
            <button
              onClick={() => setActiveTab("vencidos")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition text-sm sm:text-base text-center ${
                activeTab === "vencidos" ? "bg-amber-300 text-black font-bold shadow" : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
              }`}
            >
              Vencidos
            </button>
          </div>
          
          {activeTab === "disponibles" && items.length > 0 && (
            <button
              onClick={() => generarListaCuponesPDF(items)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition text-sm sm:text-base whitespace-nowrap"
            >
              Descargar Lista PDF
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-700 shadow-md">
            Aún no tienes cupones en esta categoría.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.purchaseId} className="bg-white rounded-2xl overflow-hidden shadow-md flex flex-col h-full hover:shadow-lg transition-shadow">
                <img
                  src={item.offer?.image_url || "https://via.placeholder.com/500x280?text=Cupon"}
                  alt={item.offer?.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 flex flex-col flex-grow">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">{item.offer?.title}</h2>
                  <p className="text-sm text-gray-600 mb-3">{item.offer?.description}</p>
                  
                  <div className="space-y-1 mb-4 flex-grow">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Cantidad:</span> {item.quantity}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Total:</span> ${Number(item.subtotal || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      <span className="font-semibold">Comprado:</span> {new Date(item.purchasedAt).toLocaleString()}
                    </p>
                    {item.offer?.expiration_date && (
                      <p className={`text-xs mt-1 font-semibold ${activeTab === 'vencidos' ? 'text-red-500' : 'text-blue-500'}`}>
                        Vence: {new Date(item.offer.expiration_date).toLocaleDateString()}
                      </p>
                    )}
                    {isPurchaseRedeemed(item.estado) && (
                      <div className="mt-2">
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">
                          Canjeado
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto border-t pt-3">
                    <button
                      onClick={() => generarCuponPDF(item)}
                      className="w-full text-center bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-semibold py-2 rounded-lg transition text-sm"
                    >
                      Descargar PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
