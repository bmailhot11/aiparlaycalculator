import Head from 'next/head'
import Link from 'next/link'
import { ArrowLeft, FileText, AlertTriangle, DollarSign, Shield, Gavel, Users } from 'lucide-react'

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service - BetGenius</title>
        <meta name="description" content="BetGenius Terms of Service - Terms and conditions for using our AI-powered sports betting analysis platform." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/betchekr_owl_logo.ico" />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
          <nav className="container mx-auto px-4 flex justify-between items-center py-4">
            <Link href="/" className="text-2xl font-bold text-green-500">
              BetGenius
            </Link>
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-300 hover:text-green-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </nav>
        </header>

        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
              <FileText className="w-8 h-8 text-green-500" />
              Terms of Service
            </h1>
            <p className="text-gray-300 text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Agreement to Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                Welcome to BetGenius! These Terms of Service ("Terms") govern your use of our website and AI-powered sports betting analysis services. By accessing or using BetGenius, you agree to be bound by these Terms. If you do not agree with any part of these Terms, you may not use our service.
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                Service Description
              </h2>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                <p className="text-gray-300 mb-4">BetGenius provides:</p>
                <ul className="text-gray-300 space-y-2 list-disc list-inside">
                  <li><strong className="text-white">AI Bet Slip Analysis:</strong> Mathematical analysis of uploaded betting screenshots</li>
                  <li><strong className="text-white">Parlay Generation:</strong> AI-powered parlay recommendations across multiple sports</li>
                  <li><strong className="text-white">Best Sportsbook Finder:</strong> Comparison tool to find optimal odds and payouts</li>
                  <li><strong className="text-white">Risk Assessment:</strong> Mathematical modeling for betting strategy optimization</li>
                  <li><strong className="text-white">Educational Content:</strong> Sports betting insights and analysis</li>
                </ul>
              </div>
            </section>

            {/* Important Disclaimers */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Important Disclaimers
              </h2>
              
              <div className="bg-red-500/10 p-6 rounded-lg border border-red-500/30">
                <h3 className="text-lg font-semibold mb-3 text-red-400">Educational Tool Only</h3>
                <ul className="text-red-300 space-y-2 list-disc list-inside">
                  <li><strong>No Guarantees:</strong> We make no promises, warranties, or guarantees about betting outcomes, profitability, or investment success</li>
                  <li><strong>No Financial Advice:</strong> Our service provides educational analysis only, not financial or investment advice</li>
                  <li><strong>Past Performance:</strong> Historical results do not indicate future performance</li>
                  <li><strong>User Responsibility:</strong> You are solely responsible for all betting decisions and financial outcomes</li>
                  <li><strong>Risk Warning:</strong> All sports betting involves risk of financial loss</li>
                </ul>
              </div>
            </section>

            {/* Eligibility and Account Terms */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400 flex items-center gap-2">
                <Users className="w-6 h-6" />
                Eligibility and Account Terms
              </h2>
              
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold mb-2 text-white">Age Requirements</h3>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li>You must be at least 18 years old to use BetGenius</li>
                    <li>You must comply with legal gambling age in your jurisdiction</li>
                    <li>We may require age verification at any time</li>
                  </ul>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold mb-2 text-white">Account Responsibilities</h3>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li>Provide accurate and complete information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Notify us immediately of any unauthorized use</li>
                    <li>Use the service only for lawful purposes</li>
                  </ul>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold mb-2 text-white">Geographic Restrictions</h3>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li>Service availability may vary by jurisdiction</li>
                    <li>You are responsible for compliance with local laws</li>
                    <li>We may restrict access in certain regions</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Usage Restrictions */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Prohibited Uses</h2>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                <p className="text-gray-300 mb-4">You agree NOT to:</p>
                <ul className="text-gray-300 space-y-2 list-disc list-inside">
                  <li>Use the service for any illegal or unauthorized purpose</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Upload malicious content or attempt to hack our systems</li>
                  <li>Share or resell your Premium access with others</li>
                  <li>Use automated tools to access or scrape our service</li>
                  <li>Reverse engineer or attempt to copy our AI models</li>
                  <li>Upload content that violates intellectual property rights</li>
                  <li>Use the service to facilitate problem gambling</li>
                </ul>
              </div>
            </section>

            {/* Premium Subscription Terms */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400 flex items-center gap-2">
                <DollarSign className="w-6 h-6" />
                Premium Subscription Terms
              </h2>
              
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold mb-2 text-white">Billing and Payment</h3>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li>Premium subscriptions: $6.99/month or $49.99/year</li>
                    <li>Annual plans save $34 compared to monthly billing</li>
                    <li>Payments are processed securely through Stripe</li>
                    <li>All sales are final - no refunds for partial periods</li>
                    <li>You can cancel anytime through your account settings</li>
                  </ul>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold mb-2 text-white">Premium Features</h3>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li>Unlimited bet slip uploads and analysis</li>
                    <li>Unlimited AI parlay generation</li>
                    <li>Advanced mathematical analysis and risk assessment</li>
                    <li>Priority processing and premium support</li>
                    <li>Access to best sportsbook finder (also available in free tier)</li>
                  </ul>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold mb-2 text-white">Cancellation Policy</h3>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li>Cancel anytime - no long-term contracts</li>
                    <li>Cancellation takes effect at the end of your billing period</li>
                    <li>Access continues until subscription expires</li>
                    <li>No pro-rated refunds for early cancellation</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Intellectual Property</h2>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Our Rights</h3>
                    <p className="text-gray-300 text-sm">
                      BetGenius, our AI models, algorithms, and all related intellectual property are owned by us and protected by copyright, trademark, and other laws.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">Your Content</h3>
                    <p className="text-gray-300 text-sm">
                      You retain ownership of bet slip images you upload. By uploading content, you grant us a limited license to process and analyze it for service provision.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-white">License to Use</h3>
                    <p className="text-gray-300 text-sm">
                      We grant you a limited, non-exclusive, non-transferable license to use BetGenius for personal, non-commercial purposes only.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400 flex items-center gap-2">
                <Gavel className="w-6 h-6" />
                Limitation of Liability
              </h2>
              
              <div className="bg-yellow-500/10 p-6 rounded-lg border border-yellow-500/30">
                <div className="space-y-3 text-yellow-300">
                  <p><strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong></p>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>BetGenius is provided "AS IS" without warranties of any kind</li>
                    <li>We are not liable for any betting losses or financial damages</li>
                    <li>Our total liability shall not exceed the amount you paid for Premium services</li>
                    <li>We are not responsible for third-party sportsbook actions or changes</li>
                    <li>You assume all risks associated with sports betting decisions</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data and Privacy */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Data and Privacy</h2>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                <ul className="text-gray-300 space-y-2 list-disc list-inside">
                  <li>Uploaded bet slip images are processed and deleted immediately</li>
                  <li>We use OpenAI for AI analysis - subject to their privacy policy</li>
                  <li>Payment data is handled securely by Stripe</li>
                  <li>See our <Link href="/privacy" className="text-green-400 hover:text-green-300">Privacy Policy</Link> for complete details</li>
                  <li>We may use aggregated, anonymized data for service improvement</li>
                </ul>
              </div>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Service Availability</h2>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                <ul className="text-gray-300 space-y-2 list-disc list-inside">
                  <li>We strive for 99.9% uptime but cannot guarantee uninterrupted service</li>
                  <li>Maintenance windows may temporarily affect availability</li>
                  <li>Third-party API limitations may impact functionality</li>
                  <li>We reserve the right to modify or discontinue features</li>
                  <li>Free tier usage limits may change with reasonable notice</li>
                </ul>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Termination</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold mb-2 text-white">By You</h3>
                  <p className="text-gray-300 text-sm">
                    You may terminate your account at any time by canceling your Premium subscription and ceasing to use our service.
                  </p>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold mb-2 text-white">By Us</h3>
                  <p className="text-gray-300 text-sm">
                    We may terminate or suspend your access immediately for violations of these Terms, illegal activity, or at our sole discretion.
                  </p>
                </div>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Governing Law</h2>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                <p className="text-gray-300">
                  These Terms are governed by the laws of Nevada, United States without regard to conflict of law principles. 
                  Any disputes shall be resolved through binding arbitration or in the courts of Nevada, United States.
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Changes to Terms</h2>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                <p className="text-gray-300">
                  We may update these Terms from time to time. When we do, we will post the updated Terms on this page and update the "Last updated" date. 
                  Continued use of BetGenius after changes constitutes acceptance of the new Terms.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Contact Us</h2>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                <p className="text-gray-300 mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2 text-gray-300">
                  <p><strong>Email:</strong> legal@betgenius.com</p>
                  <p><strong>Subject:</strong> Terms of Service Inquiry</p>
                  <p><strong>Response Time:</strong> We aim to respond within 48 hours</p>
                </div>
              </div>
            </section>

            {/* Acknowledgment */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Acknowledgment</h2>
              
              <div className="bg-green-500/10 p-6 rounded-lg border border-green-500/30">
                <p className="text-green-300">
                  By using BetGenius, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. 
                  You also acknowledge that sports betting involves financial risk and that you are using our educational tools at your own discretion.
                </p>
              </div>
            </section>
          </div>

          {/* Footer Navigation */}
          <div className="mt-12 text-center">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to BetGenius
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}