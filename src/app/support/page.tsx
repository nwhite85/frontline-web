import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support | Frontline Fitness',
  description: 'Get help with the Frontline Fitness app — booking, membership, account, and technical support.',
  alternates: { canonical: 'https://frontlinefitness.co.uk/support' },
  robots: { index: false, follow: false },
}

export default function SupportPage() {
  const sections = [
    {
      title: 'Getting started',
      body: 'Download the Frontline Fitness app, create an account using your email address, and complete the short setup process. Once done you can view your schedule, book classes, and track your results.',
    },
    {
      title: 'Booking a class',
      body: 'Open the Classes tab, select a session, and tap Book. You\'ll receive a confirmation in the app. Cancel at least 2 hours before the session starts to avoid a late-cancellation mark.',
    },
    {
      title: 'Managing your membership',
      body: 'Your active membership and upcoming payment dates are shown in the Profile tab. To upgrade, downgrade, or cancel your membership please contact us directly.',
    },
    {
      title: 'Resetting your password',
      body: 'On the login screen tap "Forgot password" and enter your email address. You\'ll receive a reset link within a few minutes. Check your spam folder if it doesn\'t arrive.',
    },
    {
      title: 'Deleting your account',
      body: 'To request deletion of your account and all associated data, email support@frontlinefitness.co.uk with the subject line "Account deletion request". We will process your request within 30 days in accordance with UK GDPR.',
    },
    {
      title: 'Technical issues',
      body: 'If the app is not loading or behaving unexpectedly, try closing and reopening it. If the problem persists, uninstall and reinstall the app. Make sure you are running the latest version from the App Store.',
    },
    {
      title: 'Contact us',
      body: 'For anything not covered above, reach out at support@frontlinefitness.co.uk. We aim to respond within one business day.',
    },
  ]

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden" style={{ background: '#0d1f3c' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '60%', background: '#000000',
        clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0 100%)',
        pointerEvents: 'none',
      }} />
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="max-w-6xl mx-auto h-full border-x border-[rgba(255,255,255,0.06)]" />
      </div>
      <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center">
          <a href="/"><img src="/logos/frontline-logo-blue.svg" alt="Frontline Fitness" width="80" height="20" style={{ height: '20px', width: 'auto' }} /></a>
        </div>
      </div>
      <div className="relative z-10 flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Support</h1>
          <p className="text-white/50 mb-10">Frontline Fitness — help & frequently asked questions</p>
          {sections.map(({ title, body }) => (
            <section key={title} className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
              <p className="text-white/50 leading-relaxed">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
