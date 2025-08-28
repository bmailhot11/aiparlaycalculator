import Header from '../components/Header';
import Footer from '../components/Footer';
import GradientBG from '../components/theme/GradientBG';
import Head from 'next/head';

export default function About() {
  return (
    <div className="betchekr-premium">
      <Head>
        <title>About - betchekr</title>
        <meta name="description" content="Learn about our mission to make sports betting mathematically responsible through AI-powered analysis, without the high costs of traditional betting tools." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/betchekr_owl_logo.ico" />
      </Head>
      <GradientBG>
        <div className="premium-header sticky top-0 z-50">
          <Header />
        </div>
        
        <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              About <span className="text-blue-400">betchekr</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              We believe that mathematical analysis and responsible gambling tools shouldn't cost hundreds of dollars. 
              Our mission is to democratize smart betting through AI-powered mathematical insights.
            </p>
          </div>

          {/* Mission Section */}
          <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-gray-700">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">Our Mission</h2>
              
              <div className="text-center mb-8">
                <h3 className="text-xl sm:text-2xl font-bold text-blue-400 mb-3 sm:mb-4">Mathematical Responsibility</h3>
                <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                  We use advanced AI and mathematical models to help you make informed, responsible betting decisions. 
                  Every recommendation is backed by expected value calculations, probability analysis, and risk assessment.
                </p>
              </div>

              <div className="space-y-6 sm:space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-8 lg:gap-12 mt-8 sm:mt-12">
                <div className="text-center">
                  <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">AI-Powered Analysis</h4>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    Our sophisticated AI system processes millions of data points to identify market inefficiencies, 
                    calculate true probabilities, and provide actionable insights that help you bet smarter, not bigger.
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Education First</h4>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    We don't just give you picks - we teach you the mathematics behind smart betting. 
                    Understanding expected value, variance, and bankroll management helps you make better long-term decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="max-w-6xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 sm:mb-12 text-center">Why We Built This</h2>
            
            <div className="space-y-6 sm:space-y-8 md:space-y-0 md:grid md:grid-cols-3 md:gap-6 lg:gap-8">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-6 sm:p-8 border border-blue-500/30">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Affordable Access</h3>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  Professional betting tools cost $200-500+ per month. We believe mathematical analysis should be accessible to everyone, 
                  not just high-roller bettors. Quality insights shouldn't break the bank.
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl p-6 sm:p-8 border border-purple-500/30">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Transparent Mathematics</h3>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  No black box algorithms or hidden methodologies. We show you exactly how we calculate expected value, 
                  implied probabilities, and risk metrics. Understanding the math makes you a better bettor.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-2xl p-6 sm:p-8 border border-green-500/30">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Responsible Gambling</h3>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  We actively promote responsible gambling through bankroll management advice, Kelly Criterion sizing, 
                  and variance analysis. Our goal is to help you bet smarter and stay in control.
                </p>
              </div>
            </div>
          </div>

          {/* Technology Section */}
          <div className="max-w-5xl mx-auto mb-12 sm:mb-16">
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-gray-700">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">The Technology Behind the Magic</h2>
              
              <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-2 md:gap-8 lg:gap-12 items-center">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-blue-400 mb-4 sm:mb-6">Advanced AI & Machine Learning</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                      <div>
                        <h4 className="text-white font-semibold text-sm sm:text-base">Computer Vision</h4>
                        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">Extract bet details from any sportsbook slip with 95%+ accuracy</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex-shrink-0 mt-1"></div>
                      <div>
                        <h4 className="text-white font-semibold text-sm sm:text-base">Probability Modeling</h4>
                        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">Multi-model approach combining sharp consensus and market efficiency</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex-shrink-0 mt-1"></div>
                      <div>
                        <h4 className="text-white font-semibold text-sm sm:text-base">Real-Time Data</h4>
                        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">Live odds from 10+ sportsbooks updated every minute</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl p-8">
                  <h4 className="text-lg font-bold text-white mb-4">Mathematical Foundations</h4>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• Expected Value Calculations</li>
                    <li>• Kelly Criterion Optimal Sizing</li>
                    <li>• Bayesian Probability Updates</li>
                    <li>• Monte Carlo Simulations</li>
                    <li>• Correlation Risk Analysis</li>
                    <li>• Market Efficiency Scoring</li>
                    <li>• Sharp Money Detection</li>
                    <li>• Variance & Volatility Metrics</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Philosophy Section */}
          <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Our Philosophy</h2>
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-6 sm:p-8 border border-blue-500/30">
                <blockquote className="text-base sm:text-lg lg:text-xl text-gray-300 italic leading-relaxed mb-4 sm:mb-6">
                  "The house edge in sports betting isn't insurmountable - it's just mathematical. 
                  With the right tools, analysis, and discipline, informed bettors can find genuine edges in inefficient markets. 
                  Our job is to give you those tools without charging a fortune for them."
                </blockquote>
                <div className="text-blue-400 font-semibold text-sm sm:text-base">- betchekr Team</div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="max-w-5xl mx-auto mb-12 sm:mb-16">
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-gray-700">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center">By the Numbers</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center">
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-400 mb-1 sm:mb-2">10+</div>
                  <div className="text-gray-300 text-xs sm:text-sm lg:text-base">Sportsbooks Analyzed</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-400 mb-1 sm:mb-2">95%</div>
                  <div className="text-gray-300 text-xs sm:text-sm lg:text-base">OCR Accuracy</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-400 mb-1 sm:mb-2">1min</div>
                  <div className="text-gray-300 text-xs sm:text-sm lg:text-base">Data Update Frequency</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-yellow-400 mb-1 sm:mb-2">24/7</div>
                  <div className="text-gray-300 text-xs sm:text-sm lg:text-base">Market Monitoring</div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Section */}
          <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Built by Bettors, for Bettors</h2>
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-gray-700">
                <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-4 sm:mb-6">
                  We're a team of mathematicians, software engineers, and experienced sports bettors who got tired of 
                  paying hundreds of dollars per month for basic expected value calculations. So we built our own tool 
                  and decided to share it with the world.
                </p>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                  We believe that everyone deserves access to the same mathematical tools that sharp bettors use, 
                  without the premium price tag. Sports betting is challenging enough - your tools shouldn't make it harder.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 sm:p-8 border border-blue-500/30">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Ready to Bet Smarter?</h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">Join thousands of mathematically-minded bettors using our AI-powered analysis.</p>
              <a 
                href="/"
                className="inline-block bg-white text-blue-600 px-6 sm:px-8 py-3 min-h-[44px] rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-100 transition-colors mr-2 sm:mr-4 mb-3 sm:mb-0"
              >
                Start Free Analysis
              </a>
              <a 
                href="/how-it-works"
                className="inline-block bg-transparent text-white px-6 sm:px-8 py-3 min-h-[44px] rounded-lg font-semibold text-sm sm:text-base border border-white hover:bg-white hover:text-blue-600 transition-colors"
              >
                Learn How It Works
              </a>
            </div>
          </div>
        </main>

        <Footer />
      </GradientBG>
    </div>
  );
}