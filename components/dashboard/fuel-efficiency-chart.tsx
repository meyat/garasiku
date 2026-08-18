"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { EfficiencyPoint } from "@/lib/calculations/fuel-efficiency";

export function FuelEfficiencyChart({ points }: { points: EfficiencyPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center text-sm text-neutral-400">
        Butuh minimal 3 isi full-tank berturutan untuk menampilkan grafik efisiensi.
      </div>
    );
  }

  const data = points.map((p) => ({
    date: new Date(p.periodEnd).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
    kmPerLiter: Number(p.kmPerLiter.toFixed(1)),
  }));

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4">
      <p className="text-sm font-medium mb-2">Efisiensi BBM (km/L)</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="kmPerLiter" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
