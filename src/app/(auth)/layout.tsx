import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex font-manrope">

      <div className="hidden lg:flex lg:w-105 xl:w-120 shrink-0 relative flex-col overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-blue-600/60 via-blue-700/70 to-blue-900/90" />

        <div className="relative z-10 p-8">
          <div className="w-20 h-20 rounded-xl bg-transparent flex items-center justify-center">
            <Image src={"/images/queue-logo.png"} alt="Queue Logo" width={64} height={64} />
          </div>
        </div>

        <div className="relative z-10 p-8">
          <h2 className="text-white text-[50px] font-bold leading-snug">
            Smart Queue
          </h2>
        </div>

        <div className="relative z-10 mt-[calc(100%-200px)] p-8 pb-10">
          <h2 className="text-white text-3xl font-bold leading-snug">
            Waiting made smarter
          </h2>
          <p className="text-blue-100 text-sm mt-3 leading-relaxed">
            No more guessing — see your queue status and get notified when it&apos;s your turn.
          </p>
          <div className="flex justify-between mt-8 text-blue-200/70 text-xs">
            <span>@Queue 2026</span>
            <span className="flex gap-3">
              <span className="cursor-pointer hover:text-white transition-colors">Terms of Service</span>
              <span>|</span>
              <span className="cursor-pointer hover:text-white transition-colors">Help center</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}