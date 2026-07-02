import Link from "next/link";
import { HiOutlineQueueList } from "react-icons/hi2";

export default function CycleNotFound() {
  return (
    <div className="font-manrope flex flex-col items-center justify-center py-24 gap-5">
      <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
        <HiOutlineQueueList size={28} className="text-[#2347C5]" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-900">Cycle not found</h2>
        <p className="text-sm text-gray-400 mt-1">
          This cycle may have been deleted or doesn&apos;t exist.
        </p>
      </div>
      <Link
        href="/admin/cycles"
        className="flex items-center gap-2 bg-[#2347C5] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1a38a8] transition-colors"
      >
        ← Back to Cycles
      </Link>
    </div>
  );
}