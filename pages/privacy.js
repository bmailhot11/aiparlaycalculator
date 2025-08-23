import Head from 'next/head'
import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Database, Lock, Mail } from 'lucide-react'

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - AiParlayCalculator</title>
        <meta name="description" content="AiParlayCalculator Privacy Policy - How we collect, use, and protect your personal information." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/betchekr_owl_logo.ico" />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
          <nav className="container mx-auto px-4 flex justify-between items-center py-4">
            <Link href="/" className="text-2xl font-bold text-green-500">
              AiParlayCalculator
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
              <Shield className="w-8 h-8 text-green-500" />
              Privacy Policy
            </h1>
            <p className="text-gray-300 text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Introduction</h2>
              <p className="text-gray-300 leading-relaxed">
                AiParlayCalculator ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our AI-powered sports betting analysis services.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400 flex items-center gap-2">
                <Database className="w-6 h-6" />
                Information We Collect
              </h2>
              
              <div className="space-y-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold mb-2 text-white">Personal Information</h3>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li>Email address (when you purchase Premium)</li>
                    <li>Payment information (processed securely through Stripe)</li>
                    <li>Premium access codes</li>
                  </ul>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold mb-2 text-white">Usage Information</h3>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li>Bet slip images you upload for analysis</li>
                    <li>Generated parlay preferences and settings</li>
                    <li>Usage statistics (number of uploads, generations)</li>
                    <li>Device information and browser type</li>
                  </ul>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold mb-2 text-white">Automatically Collected Information</h3>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li>IP address and location data</li>
                    <li>Website usage patterns and analytics</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400 flex items-center gap-2">
                <Eye className="w-6 h-6" />
                How We Use Your Information
              </h2>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                <ul className="text-gray-300 space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold">•</span>
                    <span><strong>Service Provision:</strong> To provide AI analysis of your bet slips and generate parlay recommendations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold">•</span>
                    <span><strong>Account Management:</strong> To manage your Premium subscription and access codes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold">•</span>
                    <span><strong>Service Improvement:</strong> To analyze usage patterns and improve our AI models</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold">•</span>
                    <span><strong>Communication:</strong> To send important service updates and Premium access information</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold">•</span>
                    <span><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Data Storage and Security */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400 flex items-center gap-2">
                <Lock className="w-6 h-6" />
                Data Storage and Security
              </h2>
              
              <div className="space-y-4">
                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                  <h3 className="text-lg font-semibold mb-2 text-green-400">Security Measures</h3>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li>Industry-standard encryption for data transmission</li>
                    <li>Secure cloud storage with access controls</li>
                    <li>Regular security audits and updates</li>
                    <li>Payment processing handled by PCI-compliant Stripe</li>
                  </ul>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold mb-2 text-white">Data Retention</h3>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    <li>Uploaded bet slip images are processed and deleted immediately</li>
                    <li>Usage statistics are retained for service improvement</li>
                    <li>Premium account information is retained as long as your subscription is active</li>
                    <li>You may request data deletion at any time</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Third-Party Services</h2>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                <p className="text-gray-300 mb-4">We use the following third-party services:</p>
                <ul className="text-gray-300 space-y-2">
                  <li><strong className="text-white">OpenAI:</strong> For AI-powered bet slip analysis and parlay generation</li>
                  <li><strong className="text-white">Stripe:</strong> For secure payment processing</li>
                  <li><strong className="text-white">Vercel:</strong> For website hosting and analytics</li>
                  <li><strong className="text-white">The Odds API:</strong> For real-time sports betting odds</li>
                </ul>
                <p className="text-gray-400 text-sm mt-4">
                  Each service has its own privacy policy, and we encourage you to review them.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Your Rights</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold mb-2 text-white">Access & Control</h3>
                  <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                    <li>Request access to your personal data</li>
                    <li>Update or correct your information</li>
                    <li>Delete your account and data</li>
                    <li>Opt-out of communications</li>
                  </ul>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-lg font-semibold mb-2 text-white">Data Portability</h3>
                  <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                    <li>Export your data in portable format</li>
                    <li>Transfer data to other services</li>
                    <li>Receive copies of your information</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Cookies and Tracking</h2>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                <p className="text-gray-300 mb-4">We use cookies and similar technologies for:</p>
                <ul className="text-gray-300 space-y-2 list-disc list-inside">
                  <li>Essential website functionality</li>
                  <li>Remembering your preferences and settings</li>
                  <li>Analytics and performance monitoring</li>
                  <li>Premium subscription management</li>
                </ul>
                <p className="text-gray-400 text-sm mt-4">
                  You can control cookies through your browser settings, but some features may not work properly if disabled.
                </p>
              </div>
            </section>

            {/* Important Disclaimers */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Important Disclaimers</h2>
              
              <div className="bg-yellow-500/10 p-6 rounded-lg border border-yellow-500/30">
                <ul className="text-yellow-300 space-y-2">
                  <li><strong>Educational Purpose:</strong> AiParlayCalculator is an educational and analysis tool only</li>
                  <li><strong>No Guarantees:</strong> We make no promises about betting outcomes or profitability</li>
                  <li><strong>Responsible Gambling:</strong> Please bet responsibly and within your means</li>
                  <li><strong>Age Restriction:</strong> You must be 18+ to use our services</li>
                </ul>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400 flex items-center gap-2">
                <Mail className="w-6 h-6" />
                Contact Us
              </h2>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                <p className="text-gray-300 mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2 text-gray-300">
                  <p><strong>Email:</strong> privacy@betchekr.com</p>
                  <p><strong>Subject:</strong> Privacy Policy Inquiry</p>
                  <p><strong>Response Time:</strong> We aim to respond within 48 hours</p>
                </div>
              </div>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Policy Updates</h2>
              
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-600">
                <p className="text-gray-300">
                  We may update this Privacy Policy from time to time. When we do, we will post the updated policy on this page and update the "Last updated" date at the top. We encourage you to review this policy periodically to stay informed about how we protect your information.
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
              Return to AiParlayCalculator
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}