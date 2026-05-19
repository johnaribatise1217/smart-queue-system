interface AdminStatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: string; // tailwind bg class
  sub?: string;
}

export function AdminStatCard({ label, value, icon, accent, sub }: AdminStatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-start justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl ${accent} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
    </div>
  );
}