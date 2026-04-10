import React from "react";
import { Link } from "react-router-dom";

export function SectionCard({
  title,
  subtitle,
  children,
  actionLabel,
  actionHref = "/",
  actionVisible = true,
  action = null,
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[#07142f] p-6 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">{title}</h2>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        </div>
        {actionVisible
          ? action ?? (
              actionLabel ? (
                <Link
                  to={actionHref}
                  className="btn-primary"
                >
                  {actionLabel}
                </Link>
              ) : null
            )
          : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function StatCard({ title, value, accent, helper }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-[#08173d] p-5 shadow-md">
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <p className={`mt-3 text-3xl font-black ${accent}`}>{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

export function DataTable({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div
        className="grid bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      <div className="divide-y divide-white/8">
        {rows.map((row, index) => (
          <div
            key={`${row[0]}-${index}`}
            className="grid px-4 py-4 text-sm text-slate-300"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {row.map((cell, cellIndex) => (
              <span key={`${String(cell)}-${cellIndex}`}>{cell}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActionPills({ actions }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <span key={action} className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
          {action}
        </span>
      ))}
    </div>
  );
}
