export default function PrivacyPage() {
  const sections = [
    { title: '1. Who we are', body: 'Frontline Fitness is operated by Nick White, a sole trader based in Swindon, UK. We are committed to protecting your personal data and acting in compliance with the UK GDPR and the Data Protection Act 2018.' },
    { title: '2. What data we collect', body: 'We may collect your name, email address, phone number, date of birth, emergency contact details, fitness goals, and payment information when you register, book a class, or contact us.' },
    { title: '3. How we use your data', body: 'Your data is used to manage your membership, process bookings and payments, communicate important updates, and improve our services. We do not sell your data to third parties.' },
    { title: '4. Legal basis for processing', body: 'We process your data on the basis of contract performance (to deliver services you have purchased), legitimate interests (to manage our business), and with your consent where required.' },
    { title: '5. Data retention', body: 'We retain your personal data for as long as your account is active and for a further period as required by law or our legitimate business interests, typically six years for financial records.' },
    { title: '6. Your rights', body: 'You have the right to access, correct, or delete your personal data. You may also object to processing or request a copy of your data. To exercise these rights, contact us at the address below.' },
    { title: '7. Cookies', body: 'We use essential cookies to keep you signed in and to maintain your session. We do not use tracking or advertising cookies without your explicit consent.' },
    { title: '8. Third-party services', body: 'We use Supabase for authentication and data storage. These services are governed by their own privacy policies. We select providers who meet GDPR requirements.' },
    { title: '9. Contact', body: 'For any privacy enquiries, please contact: privacy@frontlinefitness.co.uk' },
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
          <a href="/"><img src="/logos/frontline-logo-blue.svg" alt="Frontline Fitness" style={{ height: '20px', width: 'auto' }} /></a>
        </div>
      </div>
      <div className="relative z-10 flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-white/50 mb-10">Last updated: March 2026</p>
          {sections.map(({ title, body }) => (
            <section key={title} className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
              <p className="text-white/50 leading-relaxed">{body}</p>
            </section>
          ))}
        </div>
      </div>
      <div className="relative z-10 h-14">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center gap-6">
          <span className="text-xs text-white/30">© Frontline Fitness</span>
          <a href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy &amp; Terms</a>
        </div>
      </div>
    </div>
  )
}
