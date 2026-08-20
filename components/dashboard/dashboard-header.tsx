import { Bell } from "lucide-react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

export function DashboardHeader({
  name, avatarSeed, hasNotifications,
}: { name: string; avatarSeed: string; hasNotifications?: boolean }) {
  return (
    <header className="shrink-0 pt-4 pb-4 px-1 bg-slate-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`}
              alt="Profil"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{getGreeting()}</p>
            <h1 className="text-slate-900 text-lg font-bold">{name}</h1>
          </div>
        </div>
        <div className="relative">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-600 border border-slate-100">
            <Bell size={20} />
            {hasNotifications && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
