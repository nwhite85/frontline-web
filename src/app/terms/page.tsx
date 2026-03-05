export default function TermsPage() {
  const sections = [
    { title: '1. Introduction', body: 'These terms govern your use of Frontline Fitness services. By signing up or attending any session, you agree to these terms. Please read them carefully.' },
    { title: '2. Membership', body: 'Membership is personal and non-transferable. You must be 16 or over to join. Monthly memberships roll over automatically and can be cancelled with 30 days written notice.' },
    { title: '3. Bookings and cancellations', body: 'Classes must be booked in advance. Cancellations made with less than 24 hours notice may forfeit the session. Drop-in sessions are non-refundable.' },
    { title: '4. Health and safety', body: 'You are responsible for ensuring you are fit enough to participate. Inform your trainer of any medical conditions, injuries, or concerns before each session. Participate at your own risk.' },
    { title: '5. Liability', body: 'Frontline Fitness and its instructors are not liable for injury, illness, loss, or damage arising from participation in any session, except where caused by our negligence.' },
    { title: '6. Code of conduct', body: 'All members are expected to behave respectfully toward trainers and other members. We reserve the right to remove or suspend memberships for misconduct.' },
    { title: '7. Payments', body: 'All prices are listed inclusive of VAT where applicable. Payments are due on the date stated. Late or failed payments may result in suspension of access.' },
    { title: '8. Changes to terms', body: 'We reserve the right to update these terms at any time. Significant changes will be communicated to members with reasonable notice.' },
    { title: '9. Contact', body: 'For any questions about these terms, contact: hello@frontlinefitness.co.uk' },
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
          <h1 className="text-3xl font-bold text-white mb-2">Terms &amp; Conditions</h1>
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
