import { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Head from 'next/head';

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <>
      <Head>
        <title>How It Works - AI Parlay Calculator</title>
        <meta name="description" content="Learn how our AI-powered parlay calculator helps you make mathematically responsible betting decisions with advanced expected value analysis." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <Header />
        
        <main className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-6">
              How It <span className="text-blue-400">Works</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our AI-powered system combines advanced mathematics with real-time sportsbook data to help you make informed, responsible betting decisions.
            </p>
          </div>

          {/* Process Steps */}
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                {
                  id: 1,
                  title: "Upload Your Bet Slip",
                  icon: "📸",
                  description: "Simply take a photo of your betting slip from any sportsbook. Our AI vision technology extracts all the relevant information automatically."
                },
                {
                  id: 2,
                  title: "AI Analysis & Math",
                  icon: "🧮",
                  description: "Our system calculates expected value, implied probabilities, Kelly Criterion sizing, and identifies the best odds across major sportsbooks."
                },
                {
                  id: 3,
                  title: "Get Smart Insights",
                  icon: "💡",
                  description: "Receive detailed analysis including market inefficiencies, correlation risks, bankroll management advice, and optimization recommendations."
                }
              ].map((step) => (
                <div 
                  key={step.id}
                  className={`bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border transition-all duration-300 cursor-pointer ${
                    activeStep === step.id 
                      ? 'border-blue-400 shadow-lg shadow-blue-400/20' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setActiveStep(step.id)}
                >
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>

            {/* Detailed Features */}
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-3xl p-12 border border-gray-700">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                Advanced Features & Analysis
              </h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    title: "Expected Value (EV) Calculation",
                    icon: "📊",
                    description: "Mathematical analysis of your bet's true expected value compared to bookmaker odds."
                  },
                  {
                    title: "Real-Time Odds Comparison",
                    icon: "🔄",
                    description: "Live odds from 10+ major sportsbooks to find the best value for your selections."
                  },
                  {
                    title: "Kelly Criterion Sizing",
                    icon: "⚖️",
                    description: "Optimal bet sizing recommendations based on your calculated edge and bankroll."
                  },
                  {
                    title: "Market Inefficiency Detection",
                    icon: "🎯",
                    description: "Identify mispriced lines and market opportunities across different sportsbooks."
                  },
                  {
                    title: "Correlation Risk Analysis",
                    icon: "🔗",
                    description: "Assess how correlated bets in your parlay affect overall expected value and variance."
                  },
                  {
                    title: "Sharp Money Indicators",
                    icon: "📈",
                    description: "Track where professional bettors are placing their money based on line movement."
                  }
                ].map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl mb-4">{feature.icon}</div>
                    <h4 className="text-lg font-semibold text-white mb-2">{feature.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Technology Section */}
            <div className="mt-16 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">
                  Powered by Advanced AI & Mathematics
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-blue-400 rounded-full flex-shrink-0 mt-1"></div>
                    <div>
                      <h4 className="text-white font-semibold">Computer Vision</h4>
                      <p className="text-gray-300">Advanced OCR technology extracts bet details from any sportsbook slip image.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-purple-400 rounded-full flex-shrink-0 mt-1"></div>
                    <div>
                      <h4 className="text-white font-semibold">Mathematical Analysis</h4>
                      <p className="text-gray-300">Sophisticated probability models and statistical calculations performed in real-time.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-6 h-6 bg-green-400 rounded-full flex-shrink-0 mt-1"></div>
                    <div>
                      <h4 className="text-white font-semibold">Live Data Integration</h4>
                      <p className="text-gray-300">Real-time odds from major sportsbooks updated every few minutes.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-8 border border-blue-500/30">
                <h3 className="text-xl font-bold text-white mb-4">What Makes Us Different?</h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    Mathematical rigor over marketing hype
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    Transparent calculations and methodology  
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    Focus on responsible gambling practices
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    No hidden fees or premium tiers
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-400">✓</span>
                    Educational approach to sports betting
                  </li>
                </ul>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center mt-16">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 border border-blue-500/30">
                <h2 className="text-2xl font-bold text-white mb-4">Ready to Make Smarter Bets?</h2>
                <p className="text-gray-300 mb-6">Start analyzing your bets with mathematical precision today.</p>
                <a 
                  href="/"
                  className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Try It Now - Free
                </a>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}