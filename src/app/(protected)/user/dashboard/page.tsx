/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

const queueServices = [
  { label: "Admin Office", description: "Join the admin office to lodge any form of admin issue" },
  { label: "Student Services", description: "Join the admin office to lodge any form of admin issue" },
  { label: "Medical Services", description: "Join the admin office to lodge any form of admin issue" },
  { label: "Payment Services", description: "Join the admin office to lodge any form of admin issue" },
  { label: "Sports Services", description: "Join the admin office to lodge any form of admin issue" },
];

const recentQueues = [
  { name: "Oladele Asake", phone: "08125456789", reason: "Option 1", point: "Admin", status: "Pending" },
  { name: "Oladele Asake", phone: "08125456789", reason: "Option 1", point: "Admin", status: "Pending" },
  { name: "Oladele Asake", phone: "08125456789", reason: "Option 1", point: "Admin", status: "Completed" },
  { name: "Oladele Asake", phone: "08125456789", reason: "Option 1", point: "Admin", status: "Pending" },
];

export default function UserDashboardPage() {
  return (
    <div className="flex flex-col gap-8 font-manrope">

      {/* ── Hero Banner ── */}
      <div className="relative w-full rounded-2xl bg-[#EAF6FE] overflow-hidden min-h-55 flex items-center">
        <div className="relative z-10 px-8 py-12 max-w-lg">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Monitor Your{" "}
            <span className="text-[#2347C5]">Queue Time</span>{" "}
            Anywhere, Anytime
          </h2>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            Don&apos;t just stand aimlessly, know when it&apos;s time to submit the document
          </p>
          <Link
            href="/user/join-queue"
            className="mt-6 inline-flex items-center gap-2 bg-[#2347C5] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#1a38a8] transition-colors"
          >
            Get Started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Illustration placeholder — swap with your image */}
        <div className="absolute right-0 bottom-0 top-0 w-[45%] hidden sm:flex items-end justify-end">
          <img
            src="/images/queue-hero.png"
            alt="Queue illustration"
            className="h-full object-contain object-bottom-right"
            
          />
        </div>
      </div>

      {/* ── My Queue Status ── */}
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-4">My Queue Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QueueStatusCard
            title="My Ticket (s)"
            description="Your digital description in the queue."
            value={0}
            valueColor="bg-[#3DBFA0]"
          />
          <QueueStatusCard
            title="My Position"
            description="Your digital place in the queue."
            value={0}
            valueColor="bg-[#2347C5]"
          />
          <QueueStatusCard
            title="ETA to Turn"
            description="Your Estimated Time to be attended to"
            value={0}
            valueColor="bg-[#F5A623]"
          />
        </div>
      </section>

      {/* ── Join a Queue ── */}
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-4">Join a Queue</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {queueServices.map((service) => (
            <button
              key={service.label}
              className="bg-white rounded-2xl p-5 text-left border border-gray-100 hover:border-[#3DBFA0] hover:shadow-sm transition-all group"
            >
              {/* Icon placeholder */}
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center mb-3 group-hover:bg-[#3DBFA0]/10 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2347C5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-900">{service.label}</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{service.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Recent Queue ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Recent Queue</h3>
          <Link href="/user/history" className="text-sm text-[#2347C5] font-medium hover:underline">
            See all
          </Link>
        </div>
        <RecentQueueTable data={recentQueues} />
      </section>

    </div>
  );
}

// ── Queue Status Card ─────────────────────────────────────────────────────────

interface QueueStatusCardProps {
  title: string;
  description: string;
  value: number;
  valueColor: string;
}

function QueueStatusCard({ title, description, value, valueColor }: QueueStatusCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
      <div>
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-[60%]">{description}</p>
      </div>
      <div className={`${valueColor} text-white text-sm font-bold w-10 h-10 rounded-xl flex items-center justify-center mt-4`}>
        {value}
      </div>
    </div>
  );
}

// ── Recent Queue Table ────────────────────────────────────────────────────────

interface QueueRow {
  name: string;
  phone: string;
  reason: string;
  point: string;
  status: string;
}

function RecentQueueTable({ data }: { data: QueueRow[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#3DBFA0]">
              {["Full Name", "Phone", "Reason for visit", "Queue Point", "Status", ""].map((col) => (
                <th key={col} className="text-left text-white text-xs font-semibold px-5 py-3.5 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors group">
                <td className="px-5 py-4 text-gray-800 font-medium whitespace-nowrap">{row.name}</td>
                <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{row.phone}</td>
                <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{row.reason}</td>
                <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{row.point}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-5 py-4">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#2347C5] transition-colors">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending:   "bg-orange-50 text-orange-500 border border-orange-200",
    Completed: "bg-green-50 text-green-600 border border-green-200",
    Cancelled: "bg-red-50 text-red-500 border border-red-200",
  };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${styles[status] ?? styles.Pending}`}>
      {status}
    </span>
  );
}