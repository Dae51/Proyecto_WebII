import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getCurrentSession } from "../resources/AuthService";
import {
  finalizeCheckout,
  getCheckoutItems,
  removeCheckoutItem,
  updateCheckoutQuantity,
} from "../resources/PurchaseService";

export default function Checkout() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const { session } = await getCurrentSession();
      const nextUserId = session?.user?.id ?? null;
      setUserId(nextUserId);
      setItems(getCheckoutItems(nextUserId));
    })();
  }, []);

  const total = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);
  }, [items]);

  function handleQtyChange(itemId, nextQuantity) {
    const updated = updateCheckoutQuantity({
      userId,
      itemId,
      quantity: Math.max(1, Number(nextQuantity) || 1),
    });
    setItems(updated);
  }

  function handleRemove(itemId) {
    const updated = removeCheckoutItem({ userId, itemId });
    setItems(updated);
  }

  function handleFinalize() {
    if (items.length === 0) {
      toast.info("No hay elementos en el checkout.");
      return;
    }

    finalizeCheckout(userId);
    toast.success("Compra finalizada correctamente.");
    navigate("/cupones-comprados");
  }

  return (
    <div className="min-h-screen bg-blue-900 p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-300 mb-6">
          Finaliza tu compra
        </h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-gray-700">
            No hay cupones en tu checkout.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.offer?.image_url || "https://via.placeholder.com/240x140?text=Oferta"}
                      alt={item.offer?.title}
                      className="w-24 h-16 rounded-lg object-cover"
                    />
                    <div>
                      <h2 className="font-bold text-gray-900">{item.offer?.title}</h2>
                      <p className="text-sm text-gray-600">${item.offer?.offer_price} c/u</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQtyChange(item.id, e.target.value)}
                      className="w-20 rounded-lg border border-gray-300 px-2 py-1"
                    />
                    <span className="font-semibold text-gray-900 min-w-20 text-right">
                      ${Number(item.subtotal || 0).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="text-sm px-3 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xl font-bold text-gray-900">
                Total: ${total.toFixed(2)}
              </p>
              <button
                type="button"
                onClick={handleFinalize}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
              >
                Finalizar Compra
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
