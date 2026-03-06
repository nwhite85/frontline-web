const items = [
  'COMMUNITY DRIVEN', 'PROGRESS FOCUSED',
  'COMMUNITY DRIVEN', 'PROGRESS FOCUSED',
  'COMMUNITY DRIVEN', 'PROGRESS FOCUSED',
  'COMMUNITY DRIVEN', 'PROGRESS FOCUSED',
]

export function LandingMarquee() {
  return (
    <div className="w-full overflow-hidden bg-blue-950/60 py-5 select-none">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="text-white font-black text-3xl sm:text-4xl tracking-[0.15em] uppercase px-6">
              {item}
            </span>
            <span className="text-white/50 text-xs">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
