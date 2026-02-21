import React from "react";

export default function CouponCard({ coupon, onGeneratePDF, onRedeem }) {
  const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null;
  const redeemed = !!coupon.redeemed_at;
  const expired = expiresAt && expiresAt < new Date();

  const status = redeemed ? "Canjeado" : expired ? "Vencido" : "Disponible";
  const statusColor = redeemed ? "bg-gray-400" : expired ? "bg-red-400" : "bg-green-400";
  const statusTextColor = "text-white";

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

      {/* Header con badge de estado */}
      <div className="relative p-5 sm:p-6 bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20">
          <span className={`${statusColor} ${statusTextColor} px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg`}>
            {status}
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-semibold mb-2 transition-colors duration-300 group-hover:text-amber-300 pr-24">
          {coupon.title ?? coupon.code}
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          {coupon.description ?? "Sin descripción"}
        </p>
      </div>

      {/* Contenido */}
      <div className="p-5 sm:p-6 bg-white group-hover:bg-slate-900 transition duration-300">

        {/* Código y vencimiento */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 group-hover:text-gray-300 text-xs sm:text-sm">Código:</span>
            <code className="bg-gray-100 group-hover:bg-gray-700 px-2 py-1 rounded text-sm sm:text-base font-mono font-semibold group-hover:text-amber-300 transition">
              {coupon.code}
            </code>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-400">
            Vence: {expiresAt ? expiresAt.toLocaleDateString("es-ES") : "Sin fecha"}
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => onGeneratePDF(coupon)}
            className="
              flex-1
              min-w-max
              bg-cyan-950
              text-lime-50
              py-2
              sm:py-2.5
              px-3
              sm:px-4
              rounded-xl
              text-xs
              sm:text-sm
              font-medium
              transition
              duration-300
              hover:opacity-90
              hover:scale-105
              hover:bg-amber-400
              hover:text-black
              active:scale-95
            "
          >
            📄 PDF
          </button>
          {!redeemed && !expired && (
            <button
              onClick={() => onRedeem(coupon.id)}
              className="
                flex-1
                min-w-max
                border-2
                border-cyan-950
                text-cyan-950
                bg-white
                py-2
                sm:py-2.5
                px-3
                sm:px-4
                rounded-xl
                text-xs
                sm:text-sm
                font-medium
                transition
                duration-300
                hover:bg-cyan-950
                hover:text-white
                hover:scale-105
                active:scale-95
              "
            >
              ✓ Canjear
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
