import React from "react";

export default function DataCard({ title, value, unit, color, children }) {
  return (
    <div className={`rounded-2xl shadow-md p-4 bg-[#131e28] flex flex-col gap-2 items-start border-l-8`} style={{ borderColor: color || "#32FF8F" }}>
      <div className="font-semibold text-base opacity-75">{title}</div>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold" style={{ color }}>{value}</span>
        <span className="text-lg opacity-60">{unit}</span>
      </div>
      {children}
    </div>
  );
}
