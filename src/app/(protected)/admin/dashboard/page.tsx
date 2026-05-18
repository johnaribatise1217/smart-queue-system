import Link from 'next/link'
import React from 'react'
import Image from 'next/image'

const page = () => {
  return (
    <div className='flex flex-col gap-8 font-manrope'>
      {/* ── Hero Banner ── */}
      <div className="relative w-full rounded-2xl bg-[#EAF6FE] overflow-hidden min-h-55 flex flex-row-reverse items-center">
        <div className="relative z-10 px-8 py-12 max-w-lg">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Monitor Your{" "}
            <span className="text-[#2347C5]">Cycles</span>{" "}
            Anywhere, Anytime
          </h2>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            Create Cycles and manage queues with ease, ensuring a seamless experience for your users.
          </p>
          <Link
            href="/user/create-cycle"
            className="mt-6 inline-flex items-center gap-2 bg-[#2347C5] text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-[#1a38a8] transition-colors"
          >
            Get Started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Illustration placeholder — swap with your image */}
        <div className="absolute left-0 bottom-0 top-0 w-[45%] hidden sm:flex items-end justify-end">
          <Image
            src="/images/queue-hero.png"
            alt="Queue illustration"
            className="h-full object-contain object-bottom-right"
            fill
          />
        </div>
      </div>
    </div>
  )
}

export default page