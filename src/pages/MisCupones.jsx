import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CouponCard from "../components/CouponCard";
import { jsPDF } from "jspdf";
import { getUserCoupons, classifyCoupon, redeemCoupon } from "../resources/CouponsService";
import { getCurrentSession } from "../resources/AuthService";

export default function MisCupones() {
  const [coupons, setCoupons] = useState([]);
  const [filter, setFilter] = useState("available");
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { session, error } = await getCurrentSession();
      // If no session, show demo data instead of redirecting to /auth
      if (error || !session?.user) {
        const demoNow = new Date();
        const demoCoupons = [
          {
            id: "demo-1",
            code: "DEMO10",
            title: "10% de descuento",
            description: "Descuento de 10% en productos seleccionados",
            terms: "Válido una vez por cliente.",
            created_at: demoNow.toISOString(),
            expires_at: new Date(demoNow.getTime() + 7 * 24 * 3600 * 1000).toISOString(),
            redeemed_at: null,
          },
          {
            id: "demo-2",
            code: "WELCOME",
            title: "Cupón Bienvenida",
            description: "Cupón para nuevos usuarios",
            terms: "Aplicable solo en primera compra.",
            created_at: demoNow.toISOString(),
            expires_at: new Date(demoNow.getTime() - 2 * 24 * 3600 * 1000).toISOString(),
            redeemed_at: null,
          },
          {
            id: "demo-3",
            code: "REDEEMED50",
            title: "50% OFF",
            description: "Cupón ya canjeado de ejemplo",
            terms: "Usado en compra de ejemplo.",
            created_at: demoNow.toISOString(),
            expires_at: new Date(demoNow.getTime() + 30 * 24 * 3600 * 1000).toISOString(),
            redeemed_at: demoNow.toISOString(),
          },
        ];

        setCoupons(demoCoupons);
        setIsDemo(true);
        setLoading(false);
        return;
      }

      const userId = session.user.id;
      const { coupons: data, error: fetchError } = await getUserCoupons(userId);
      setCoupons(data ?? []);
      setLoading(false);
    })();
  }, [navigate]);

  function groupedCoupons() {
    const map = { available: [], redeemed: [], expired: [] };
    for (const c of coupons) {
      const cls = classifyCoupon(c);
      if (cls === "available") map.available.push(c);
      else if (cls === "redeemed") map.redeemed.push(c);
      else if (cls === "expired") map.expired.push(c);
    }
    return map;
  }

  const groups = groupedCoupons();

  async function handleRedeem(id) {
    if (isDemo) {
      setCoupons((prev) => prev.map(c => c.id === id ? { ...c, redeemed_at: new Date().toISOString() } : c));
      return;
    }

    await redeemCoupon(id);
    // refresh list from server
    const { session } = await getCurrentSession();
    const { coupons: data } = await getUserCoupons(session.user.id);
    setCoupons(data ?? []);
  }

  function handleGeneratePDF(coupon) {
    // Genera un PDF simple usando jsPDF
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 40;
      let y = 60;

      doc.setFontSize(18);
      doc.text(coupon.title ?? coupon.code ?? "Cupón", margin, y);
      y += 24;

      doc.setFontSize(12);
      doc.text(`Código: ${coupon.code ?? "-"}`, margin, y);
      y += 18;

      doc.text(`Vence: ${coupon.expires_at ?? "Sin fecha"}`, margin, y);
      y += 18;

      doc.text("Descripción:", margin, y);
      y += 16;
      const desc = coupon.description ?? "-";
      doc.setFontSize(11);
      const split = doc.splitTextToSize(desc, 520);
      doc.text(split, margin, y);
      y += split.length * 14 + 8;

      doc.setFontSize(10);
      doc.text(`Condiciones: ${coupon.terms ?? "-"}`, margin, y);
      y += 18;

      // Estado
      const state = coupon.redeemed_at ? "Canjeado" : (coupon.expires_at && new Date(coupon.expires_at) < new Date() ? "Vencido" : "Disponible");
      doc.setFontSize(12);
      doc.text(`Estado: ${state}`, margin, y);

      doc.save(`${coupon.code ?? "cupon"}.pdf`);
    } catch (err) {
      // Fallback: abrir impresión si falla
      const w = window.open("", "_blank", "noopener,noreferrer");
      if (!w) return;
      w.document.write(`<pre>${JSON.stringify(coupon, null, 2)}</pre>`);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  }

  return (
    <div className="min-h-screen bg-blue-900 p-4 sm:p-6 md:p-8 lg:p-10">

      {/* Encabezado */}
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-amber-400 bg-clip-text text-transparent">
          Mis Cupones
        </h1>
        <p className="text-white mt-4 text-base sm:text-lg max-w-2xl mx-auto px-2">
          Accede a tus cupones disponibles, canjeados y vencidos.
        </p>
      </div>

      {/* Filtro */}
      <div className="flex gap-3 md:gap-4 mb-8 flex-wrap justify-center">
        <button
          onClick={() => setFilter("available")}
          disabled={filter === "available"}
          className={`px-4 py-2 rounded-lg transition capitalize text-sm md:text-base font-semibold
            ${filter === "available"
              ? "bg-amber-200 text-black shadow-lg"
              : "bg-white/10 text-white hover:bg-white/20"
            }`}
        >
          Disponibles ({groups.available.length})
        </button>
        <button
          onClick={() => setFilter("redeemed")}
          disabled={filter === "redeemed"}
          className={`px-4 py-2 rounded-lg transition capitalize text-sm md:text-base font-semibold
            ${filter === "redeemed"
              ? "bg-amber-200 text-black shadow-lg"
              : "bg-white/10 text-white hover:bg-white/20"
            }`}
        >
          Canjeados ({groups.redeemed.length})
        </button>
        <button
          onClick={() => setFilter("expired")}
          disabled={filter === "expired"}
          className={`px-4 py-2 rounded-lg transition capitalize text-sm md:text-base font-semibold
            ${filter === "expired"
              ? "bg-amber-200 text-black shadow-lg"
              : "bg-white/10 text-white hover:bg-white/20"
            }`}
        >
          Vencidos ({groups.expired.length})
        </button>
      </div>

      {/* Grid de cupones */}
      {loading ? (
        <div className="text-center text-white text-lg">Cargando cupones...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(groups[filter] || []).length === 0 ? (
            <p className="text-center text-gray-300 col-span-full text-base md:text-lg">
              No hay cupones en esta categoría.
            </p>
          ) : (
            (groups[filter] || []).map(c => (
              <CouponCard key={c.id} coupon={c} onGeneratePDF={handleGeneratePDF} onRedeem={handleRedeem} />
            ))
          )}
        </div>
      )}

    </div>
  );
}
