import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Compare() {
  const router = useRouter();

  return (
    <div className="betchekr-premium">
      <Head>
        <title>How We Compare - BetChekr vs Other Betting Tools</title>
        <meta name="description" content="See how BetChekr compares to other premium betting tools. Same mathematical rigor, better value at $9.99/month vs $80-300+ elsewhere." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/betchekr_owl_logo.ico" />
      </Head>
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>
        
        <main className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-6">
              How We <span className="text-blue-400">Compare</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-4xl mx-auto">
              Professional betting analysis shouldn't cost more than your bankroll. See why thousands choose BetChekr over expensive alternatives.
            </p>
          </div>

          {/* Main Comparison Table */}
          <div className="max-w-7xl mx-auto mb-16">
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-3xl p-8 border border-gray-700 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="pb-4 text-white font-bold text-lg">Features</th>
                    <th className="pb-4 text-center">
                      <div className="text-red-400 font-bold text-lg mb-2">Premium Tools</div>
                      <div className="text-red-400 text-2xl font-bold">$80-300</div>
                      <div className="text-sm text-gray-400">per month</div>
                    </th>
                    <th className="pb-4 text-center relative">
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold">BEST VALUE</span>
                      </div>
                      <div className="text-blue-400 font-bold text-lg mb-2">BetChekr</div>
                      <div className="text-blue-400 text-3xl font-bold">$9.99</div>
                      <div className="text-sm text-gray-300">per month</div>
                    </th>
                    <th className="pb-4 text-center">
                      <div className="text-gray-400 font-bold text-lg mb-2">Free Tools</div>
                      <div className="text-gray-400 text-2xl font-bold">$0</div>
                      <div className="text-sm text-gray-400">per month</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-gray-700">
                    <td className="py-4 text-white font-semibold">Expected Value Analysis</td>
                    <td className="py-4 text-center">
                      <span className="text-yellow-400">✓ Limited</span>
                      <div className="text-xs text-gray-400 mt-1">Basic or tier-locked</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-green-400 text-lg">✓</span>
                      <div className="text-xs text-green-400 mt-1">Full professional analysis</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-red-400">✗</span>
                      <div className="text-xs text-gray-400 mt-1">Not available</div>
                    </td>
                  </tr>

                  <tr className="border-b border-gray-700">
                    <td className="py-4 text-white font-semibold">Real-time Odds from 10+ Books</td>
                    <td className="py-4 text-center">
                      <span className="text-green-400">✓</span>
                      <div className="text-xs text-gray-400 mt-1">Usually extra cost</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-green-400 text-lg">✓</span>
                      <div className="text-xs text-green-400 mt-1">All included</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-yellow-400">~</span>
                      <div className="text-xs text-gray-400 mt-1">Delayed/limited</div>
                    </td>
                  </tr>

                  <tr className="border-b border-gray-700">
                    <td className="py-4 text-white font-semibold">AI-Powered Parlay Generation</td>
                    <td className="py-4 text-center">
                      <span className="text-yellow-400">✓ Premium</span>
                      <div className="text-xs text-gray-400 mt-1">Top-tier plans only</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-green-400 text-lg">✓</span>
                      <div className="text-xs text-green-400 mt-1">Unlimited usage</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-red-400">✗</span>
                      <div className="text-xs text-gray-400 mt-1">Not available</div>
                    </td>
                  </tr>

                  <tr className="border-b border-gray-700">
                    <td className="py-4 text-white font-semibold">Kelly Criterion Position Sizing</td>
                    <td className="py-4 text-center">
                      <span className="text-green-400">✓</span>
                      <div className="text-xs text-gray-400 mt-1">Often premium feature</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-green-400 text-lg">✓</span>
                      <div className="text-xs text-green-400 mt-1">All plans</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-red-400">✗</span>
                      <div className="text-xs text-gray-400 mt-1">Not available</div>
                    </td>
                  </tr>

                  <tr className="border-b border-gray-700">
                    <td className="py-4 text-white font-semibold">Bet Slip Analysis</td>
                    <td className="py-4 text-center">
                      <span className="text-yellow-400">✓ Limited</span>
                      <div className="text-xs text-gray-400 mt-1">Usage caps apply</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-green-400 text-lg">✓</span>
                      <div className="text-xs text-green-400 mt-1">Unlimited</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-yellow-400">~</span>
                      <div className="text-xs text-gray-400 mt-1">Basic only</div>
                    </td>
                  </tr>

                  <tr className="border-b border-gray-700">
                    <td className="py-4 text-white font-semibold">Market Inefficiency Detection</td>
                    <td className="py-4 text-center">
                      <span className="text-green-400">✓</span>
                      <div className="text-xs text-gray-400 mt-1">Enterprise tiers</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-green-400 text-lg">✓</span>
                      <div className="text-xs text-green-400 mt-1">Standard feature</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-red-400">✗</span>
                      <div className="text-xs text-gray-400 mt-1">Not available</div>
                    </td>
                  </tr>

                  <tr className="border-b border-gray-700">
                    <td className="py-4 text-white font-semibold">Usage Limits</td>
                    <td className="py-4 text-center">
                      <span className="text-red-400">Yes</span>
                      <div className="text-xs text-gray-400 mt-1">Tier-based restrictions</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-green-400 text-lg">None</span>
                      <div className="text-xs text-green-400 mt-1">Truly unlimited</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-red-400">Yes</span>
                      <div className="text-xs text-gray-400 mt-1">Heavy restrictions</div>
                    </td>
                  </tr>

                  <tr className="border-b border-gray-700">
                    <td className="py-4 text-white font-semibold">Setup Fees</td>
                    <td className="py-4 text-center">
                      <span className="text-red-400">Often</span>
                      <div className="text-xs text-gray-400 mt-1">$50-200+ common</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-green-400 text-lg">$0</span>
                      <div className="text-xs text-green-400 mt-1">No setup fees ever</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-green-400">$0</span>
                      <div className="text-xs text-green-400 mt-1">Free is free</div>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-4 text-white font-semibold">Contract Length</td>
                    <td className="py-4 text-center">
                      <span className="text-red-400">Annual+</span>
                      <div className="text-xs text-gray-400 mt-1">Long commitments</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-green-400 text-lg">Monthly</span>
                      <div className="text-xs text-green-400 mt-1">Cancel anytime</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-green-400">None</span>
                      <div className="text-xs text-green-400 mt-1">No commitment</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Why We're Different */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Why BetChekr is Different</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                <h3 className="text-xl font-bold text-blue-400 mb-6">🎯 No Artificial Restrictions</h3>
                <div className="space-y-4 text-gray-300">
                  <p>
                    Premium tools create artificial tiers to maximize revenue. Basic plans lack essential features. 
                    Pro plans cost $150+. Enterprise plans hit $300+.
                  </p>
                  <p>
                    We include everything in one fair price: advanced EV analysis, unlimited usage, all sportsbooks, 
                    and AI-powered insights for less than competitors' basic plans.
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                <h3 className="text-xl font-bold text-green-400 mb-6">💡 Built for Regular Bettors</h3>
                <div className="space-y-4 text-gray-300">
                  <p>
                    Most tools target professional syndicates and high-volume operations. 
                    They assume you're betting thousands per day and can afford enterprise pricing.
                  </p>
                  <p>
                    BetChekr is designed for smart recreational bettors who want professional-grade analysis 
                    without professional-grade costs. Mathematical accuracy at a fair price.
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                <h3 className="text-xl font-bold text-purple-400 mb-6">🚀 Transparent Pricing</h3>
                <div className="space-y-4 text-gray-300">
                  <p>
                    No hidden fees, setup costs, or surprise charges. No "contact sales" for pricing. 
                    No annual commitments or cancellation fees.
                  </p>
                  <p>
                    $9.99/month gets you everything. Period. What you see is what you pay, 
                    and you can cancel with one click anytime.
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700">
                <h3 className="text-xl font-bold text-yellow-400 mb-6">⚡ Focus on Value, Not Revenue</h3>
                <div className="space-y-4 text-gray-300">
                  <p>
                    We could charge more. Our analysis is as accurate as tools costing 10x more. 
                    But we'd rather have 1000 satisfied customers than 100 overpaying ones.
                  </p>
                  <p>
                    Our goal isn't to maximize per-customer revenue—it's to provide the best value 
                    in sports betting analysis. Better bettors, better outcomes, fair prices.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Testimonials */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">What Our Users Say</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30">
                <div className="mb-4">
                  <div className="flex text-yellow-400 mb-2">★★★★★</div>
                  <p className="text-gray-300 italic">
                    "Switched from [Premium Tool] after paying $180/month. BetChekr gives me the same EV analysis for $10. Absolute no-brainer."
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  — Mike D., Sports Bettor
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl p-6 border border-green-500/30">
                <div className="mb-4">
                  <div className="flex text-yellow-400 mb-2">★★★★★</div>
                  <p className="text-gray-300 italic">
                    "Finally, a betting tool that doesn't assume I'm running a sportsbook. Professional analysis at a price that makes sense."
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  — Sarah L., Data Analyst
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
                <div className="mb-4">
                  <div className="flex text-yellow-400 mb-2">★★★★★</div>
                  <p className="text-gray-300 italic">
                    "The AI parlay generation alone is worth more than $10. Everything else is just bonus. Best value in betting tools, hands down."
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  — Chris R., Weekend Bettor
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 border border-blue-500/30">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Make the Switch?</h2>
              <p className="text-gray-300 mb-8 text-lg">
                Join thousands of smart bettors who choose value over premium pricing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={() => router.push('/pricing')}
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
                >
                  Start at $9.99/month
                </button>
                <a 
                  href="/how-it-works"
                  className="bg-transparent text-white px-8 py-4 rounded-lg font-semibold border border-white hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Learn How It Works
                </a>
              </div>
              <p className="text-gray-400 text-sm mt-4">
                No setup fees • Cancel anytime • 30-day money-back guarantee
              </p>
            </div>
          </div>
        </main>

        <Footer />
      </GradientBG>
    </div>
  );
}