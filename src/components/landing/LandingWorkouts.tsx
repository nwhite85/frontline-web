'use client'

import { useState } from 'react'
import { Container } from '@/components/ui/container'
import { Clock } from 'lucide-react'

interface ClassTemplate {
  id: string
  name: string
  description: string
  duration_minutes: number
  image_url?: string
  is_active: boolean
  display_order?: number
}

function getImageForClass(name: string, imageUrl?: string): string {
  if (imageUrl) return imageUrl
  const lower = name.toLowerCase()
  if (lower.includes('circuit')) return '/photos/img_endurance.webp'
  if (lower.includes('strength')) return '/photos/img_strength.webp'
  if (lower.includes('interval')) return '/photos/img_intervals.webp'
  if (lower.includes('endurance')) return '/photos/img_circuits.webp'
  return '/photos/img_hero.webp'
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = minutes / 60
  return h === 1 ? '1 hour' : `${h} hours`
}

const fallbackClasses: ClassTemplate[] = [
  {
    id: '1',
    name: 'Endurance',
    description: 'High-energy workouts combining cardio, strength, and technique for total body conditioning.',
    duration_minutes: 60,
    is_active: true,
  },
  {
    id: '2',
    name: 'Circuits',
    description: 'Total body circuit training with explosive movements designed to build strength, power, and endurance.',
    duration_minutes: 45,
    is_active: true,
  },
  {
    id: '3',
    name: 'Intervals',
    description: 'High-intensity interval training that burns calories and builds strength through explosive movements.',
    duration_minutes: 30,
    is_active: true,
  },
  {
    id: '4',
    name: 'Strength',
    description: 'Build muscle, increase strength, and improve bone density with our resistance training program.',
    duration_minutes: 45,
    is_active: true,
  },
]

// WorkoutCard text is always white — it's over a dark photo overlay in both modes
function WorkoutCard({ cls }: { cls: ClassTemplate }) {
  const [hovered, setHovered] = useState(false)
  const imgSrc = getImageForClass(cls.name, cls.image_url)

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer"
      style={{ height: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={cls.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
        style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)', filter: hovered ? 'brightness(1)' : 'brightness(0.90)', transition: 'transform 700ms, filter 700ms' }}
      />

      {/* Duration badge */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
        <Clock size={13} className="text-brand-blue" />
        <span className="text-white text-sm font-semibold">{formatDuration(cls.duration_minutes)}</span>
      </div>

      {/* Base dark overlay */}
      <div className="absolute inset-0 bg-black/15" />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

      {/* Content at bottom — always white (text over dark photo) */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="text-white text-xl font-semibold mb-2 drop-shadow-md">{cls.name}</h3>
        <p className="text-white/70 text-sm leading-relaxed drop-shadow">
          {cls.description}
        </p>
      </div>
    </div>
  )
}

export function LandingWorkouts({ initialClasses }: { initialClasses?: ClassTemplate[] }) {
  const [classes] = useState<ClassTemplate[]>(
    initialClasses && initialClasses.length > 0 ? initialClasses : fallbackClasses
  )

  const displayClasses = classes

  const left = displayClasses.slice(0, Math.ceil(displayClasses.length / 2))
  const right = displayClasses.slice(Math.ceil(displayClasses.length / 2))

  return (
    <section id="workouts" className={`py-24 bg-[#090909]`}>
      <Container>
        {/* Header */}
        <div className="mb-16">
          <p className="text-brand-blue text-sm font-semibold uppercase tracking-widest mb-3">
            WORKOUTS
          </p>
          <h2 className={`text-4xl sm:text-5xl font-bold uppercase mb-4 text-white`}>
            Train at Your Best
          </h2>
          <p className={`text-lg max-w-xl text-white/60`}>
            Four distinct workout styles, each one designed to challenge you differently — keeping every session fresh, intense and always leaving you wanting more.
          </p>
        </div>

        {/* Staggered grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left column — offset down on desktop */}
          <div className="flex flex-col gap-6 md:mt-20">
            {left.map((cls) => (
              <div key={cls.id}>
                <WorkoutCard cls={cls} />
              </div>
            ))}
          </div>
          {/* Right column */}
          <div className="flex flex-col gap-6">
            {right.map((cls) => (
              <div key={cls.id}>
                <WorkoutCard cls={cls} />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
