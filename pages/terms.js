import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';
import Head from 'next/head';

export default function Terms() {
  return (
    <div className="betchekr-premium">
      <Head>
        <title>Terms of Service - betchekr</title>
        <meta name="description" content="Terms of Service for betchekr - responsible gambling tools and mathematical analysis." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/betchekr_owl_logo.ico" />
      </Head>
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>
        
        <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
              Terms of <span className="text-blue-400">Service</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-300 max-w-3xl mx-auto">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-gray-700">
              
              {/* Responsible Gambling Notice */}
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-yellow-400 mb-3 sm:mb-4">⚠️ Important: Responsible Gambling Notice</h2>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  betchekr is a mathematical analysis tool designed to promote responsible gambling through education and data-driven insights. 
                  Gambling involves risk, and no tool can guarantee profits. Please bet responsibly and within your means.
                </p>
              </div>

              <div className="prose prose-invert max-w-none">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">1. Acceptance of Terms</h2>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                  By accessing and using betchekr ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">2. Description of Service</h2>
                <p className="text-gray-300 mb-4">
                  betchekr provides:
                </p>
                <ul className="text-gray-300 mb-6 space-y-2">
                  <li>• Mathematical analysis of sports betting opportunities</li>
                  <li>• Expected value calculations and probability assessments</li>
                  <li>• Real-time odds comparison across multiple sportsbooks</li>
                  <li>• Bankroll management guidance and Kelly Criterion sizing</li>
                  <li>• Educational content about responsible gambling practices</li>
                </ul>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">3. User Responsibilities</h2>
                <div className="text-gray-300 mb-6 space-y-4">
                  <p><strong>Age Requirement:</strong> You must be at least 21 years old (or the legal gambling age in your jurisdiction) to use this service.</p>
                  <p><strong>Legal Compliance:</strong> You are responsible for ensuring that sports betting is legal in your jurisdiction before placing any bets.</p>
                  <p><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials.</p>
                  <p><strong>Accurate Information:</strong> You agree to provide accurate and complete information when using our services.</p>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">4. Disclaimers and Limitations</h2>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-bold text-red-400 mb-4">Important Disclaimers:</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• <strong>No Guarantee of Profits:</strong> Our analysis is educational and does not guarantee winning bets or profits.</li>
                    <li>• <strong>Mathematical Tool Only:</strong> We provide mathematical analysis, not betting advice or recommendations.</li>
                    <li>• <strong>Data Accuracy:</strong> While we strive for accuracy, odds and data may contain errors or be delayed.</li>
                    <li>• <strong>Risk of Loss:</strong> Sports betting involves significant risk of financial loss.</li>
                  </ul>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">5. Prohibited Uses</h2>
                <p className="text-gray-300 mb-4">You agree not to use the service:</p>
                <ul className="text-gray-300 mb-6 space-y-2">
                  <li>• For any unlawful purpose or to solicit others to perform unlawful acts</li>
                  <li>• To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                  <li>• To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                  <li>• To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                  <li>• To submit false or misleading information</li>
                </ul>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">6. Intellectual Property</h2>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                  The service and its original content, features, and functionality are and will remain the exclusive property of betchekr. 
                  The service is protected by copyright, trademark, and other laws.
                </p>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">7. Payment and Billing</h2>
                <div className="text-gray-300 mb-6 space-y-4">
                  <p><strong>Subscription:</strong> Our service is offered on a subscription basis at $9.99 per month.</p>
                  <p><strong>Billing:</strong> Your subscription will be automatically renewed and billed monthly until canceled.</p>
                  <p><strong>Cancellation:</strong> You may cancel your subscription at any time from your account settings.</p>
                  <p><strong>Refunds:</strong> We offer a 30-day money-back guarantee for new subscribers.</p>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">8. Privacy Policy</h2>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                  Your privacy is important to us. We collect minimal personal information necessary to provide our services. 
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
                  except as described in our Privacy Policy.
                </p>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">9. Responsible Gambling</h2>
                <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-bold text-blue-400 mb-4">Our Commitment to Responsible Gambling:</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• We promote mathematical understanding over emotional betting</li>
                    <li>• We provide bankroll management tools and Kelly Criterion sizing</li>
                    <li>• We encourage setting limits and sticking to them</li>
                    <li>• We do not target problem gamblers or encourage excessive betting</li>
                    <li>• We support gambling addiction resources and treatment programs</li>
                  </ul>
                  <p className="text-gray-300 mt-4">
                    <strong>Need Help?</strong> If you or someone you know has a gambling problem, contact the National Council on Problem Gambling at 1-800-522-4700.
                  </p>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">10. Limitation of Liability</h2>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                  In no event shall betchekr, nor its directors, employees, partners, agents, suppliers, or affiliates, 
                  be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, 
                  loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
                </p>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">11. Governing Law</h2>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                  These terms shall be interpreted and governed by the laws of the United States and the state in which our 
                  company is incorporated, without regard to its conflict of law provisions.
                </p>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">12. Changes to Terms</h2>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                  We reserve the right, at our sole discretion, to modify or replace these terms at any time. 
                  If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect.
                </p>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">13. Contact Information</h2>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                  If you have any questions about these Terms of Service, please contact us through our website support system.
                </p>

                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">14. Severability</h2>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                  If any provision of these terms is deemed invalid or unenforceable, the remaining provisions will remain in effect.
                </p>

                <div className="bg-gray-700/50 rounded-lg p-6 mt-12">
                  <h3 className="text-lg font-bold text-blue-400 mb-4">Remember: Bet Responsibly</h3>
                  <p className="text-gray-300 leading-relaxed">
                    betchekr is designed to help you make more informed betting decisions through mathematical analysis. 
                    However, sports betting should always be approached as entertainment, not as an investment strategy. 
                    Never bet more than you can afford to lose, and always prioritize your financial well-being over any potential winnings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </GradientBG>
    </div>
  );
}