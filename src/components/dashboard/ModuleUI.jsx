import React from "react";
import { Link } from "react-router-dom";

export function SectionCard({ title, subtitle, children, actionLabel, actionHref = "/", actionVisible = true }) {
  return (
    <section className="rounded-[28px] bg-white p-6 shadow-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        </div>
        {actionLabel && actionVisible ? (
          <Link
            to={actionHref}
            className="inline-flex items-center justify-center rounded-full bg-cyan-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-amber-400 hover:text-black"
          >
            {actionLabel}
          </Link>
        ) : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function StatCard({ title, value, accent, helper }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-md">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className={`mt-3 text-3xl font-black ${accent}`}>{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

export function DataTable({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200">
      <div
        className="grid bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      <div className="divide-y divide-slate-200 bg-white">
        {rows.map((row, index) => (
          <div
            key={`${row[0]}-${index}`}
            className="grid px-4 py-4 text-sm text-slate-700"
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
        <span key={action} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-slate-800">
          {action}
        </span>
      ))}
    </div>
  );
}
