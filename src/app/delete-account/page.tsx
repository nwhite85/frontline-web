export default function DeleteAccountPage() {
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
          <a href="/"><img src="/logos/frontline-logo-blue.png" alt="Frontline Fitness" width="80" height="20" style={{ height: '20px', width: 'auto' }} /></a>
        </div>
      </div>
      <div className="relative z-10 flex-1 px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">Delete Account</h1>
          <p className="text-white/50 mb-10">Request deletion of your Frontline Fitness account and data</p>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-2">How to request account deletion</h2>
            <p className="text-white/50 leading-relaxed mb-4">
              To request deletion of your account and all associated personal data, send an email to the address below. Please include the email address registered to your account so we can identify and process your request.
            </p>
            <a
              href="mailto:privacy@frontlinefitness.co.uk?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20Frontline%20Fitness%20account%20and%20all%20associated%20data.%0A%0ARegistered%20email%3A%20"
              className="inline-block bg-white text-black font-semibold px-6 py-3 rounded-lg hover:bg-white/90 transition-colors"
            >
              Request account deletion
            </a>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-2">What data will be deleted</h2>
            <p className="text-white/50 leading-relaxed">
              Upon a verified request we will delete your account, profile information, booking history, fitness data, progress photos, and any other personal data associated with your account. Financial records may be retained for up to six years as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-2">Processing time</h2>
            <p className="text-white/50 leading-relaxed">
              We will process your request within 30 days and confirm deletion by email. If you have an active membership, please note that deleting your account will cancel it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-2">Contact</h2>
            <p className="text-white/50 leading-relaxed">
              For any questions about your data, email <a href="mailto:privacy@frontlinefitness.co.uk" className="text-white underline underline-offset-2">privacy@frontlinefitness.co.uk</a>
            </p>
          </section>
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
