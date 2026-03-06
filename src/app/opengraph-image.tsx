import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Frontline Fitness — Forces-Led Outdoor Training in Swindon'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#000000',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Background accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '600px',
            height: '630px',
            background: 'radial-gradient(ellipse at 80% 20%, rgba(73,130,232,0.18) 0%, transparent 70%)',
          }}
        />
        {/* Border rails */}
        <div style={{ position: 'absolute', top: 0, left: 80, bottom: 0, width: 1, background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', top: 0, right: 80, bottom: 0, width: 1, background: 'rgba(255,255,255,0.08)' }} />

        {/* Tag */}
        <div style={{ display: 'flex', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#4982e8' }}>
            Frontline Fitness · Swindon
          </span>
        </div>

        {/* Headline */}
        <div style={{ fontSize: 64, fontWeight: 900, color: '#ffffff', lineHeight: 1.05, letterSpacing: '-0.02em', textTransform: 'uppercase', marginBottom: 20 }}>
          Forces-Led<br />Outdoor Training
        </div>

        {/* Sub */}
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)', marginBottom: 40, maxWidth: 580 }}>
          Bootcamp sessions at Lydiard Park, Swindon. All fitness levels welcome.
        </div>

        {/* CTA pill */}
        <div style={{
          display: 'flex',
          background: '#4982e8',
          borderRadius: 999,
          padding: '12px 28px',
          fontSize: 15,
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          First session free
        </div>
      </div>
    ),
    { ...size }
  )
}
