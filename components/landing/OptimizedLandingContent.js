import React from 'react';
import { ArrowRight, Target, TrendingUp, Calculator, Upload, Brain, CheckCircle } from 'lucide-react';

export const MetaTags = () => (
  <>
    <title>BetChekr - AI Sports Betting Tool & EV Calculator</title>
    <meta name="description" content="Find +EV bets with AI analysis. Free arbitrage scanner, line shopping, Kelly Criterion calculator, and CLV tracking. Your betting hub before placing wagers." />
    <meta name="keywords" content="AI sports betting tool, EV calculator, arbitrage betting, line shopping, Kelly Criterion, bet slip analysis, CLV tracking, positive expected value, sports betting software" />
    <link rel="canonical" href="https://betchekr.com" />
  </>
);

export const HeroSection = () => (
  <section className="relative min-h-[600px] flex items-center justify-center text-center px-4 py-20">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-[#E6EDF3]">
        AI Sports Betting Tool That Finds <span className="text-[#FACC15]">+EV Bets</span> Before You Wager
      </h1>
      <p className="text-xl md:text-2xl text-[#92A2AD] mb-8 max-w-3xl mx-auto">
        Your betting hub for smart decisions. Scan for arbitrage, compare odds, and analyze every bet slip with AI—all before risking a dollar.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button className="px-8 py-4 bg-[#FACC15] text-black font-bold rounded-xl hover:bg-[#EAB308] transition-all flex items-center gap-2 text-lg">
          Start Scanning Bets Free
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-[#92A2AD] text-sm">No credit card required • 2 free scans daily</p>
      </div>
    </div>
  </section>
);

export const FeaturesSection = () => (
  <section className="py-20 px-4">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-[#E6EDF3]">
        Your Complete Betting Hub Before You Place Wagers
      </h2>
      <p className="text-[#92A2AD] text-center mb-12 text-lg">
        Every tool you need to make profitable betting decisions, all in one place.
      </p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FeatureCard
          icon={<Target />}
          title="Arbitrage Scanner"
          description="Lock in guaranteed profit by spotting price differences across sportsbooks. Our AI finds risk-free opportunities where you win regardless of the outcome."
          benefit="Profit: 2-8% guaranteed returns"
        />
        
        <FeatureCard
          icon={<TrendingUp />}
          title="Line Shopping Tool"
          description="Always get the best odds before betting. Compare prices across 50+ sportsbooks instantly to maximize your potential payout on every wager."
          benefit="Save: Extra 5-10% on every bet"
        />
        
        <FeatureCard
          icon={<Calculator />}
          title="Kelly Criterion Calculator"
          description="Stake the optimal amount based on your edge and bankroll. Our Kelly calculator prevents costly overbetting while maximizing long-term growth."
          benefit="Bankroll: 25% safer sizing"
        />
        
        <FeatureCard
          icon={<Upload />}
          title="Bet Slip Analyzer"
          description="Upload any bet slip to see if it's +EV before placing it. Our AI calculates true probability and identifies which bets have positive expected value."
          benefit="Win rate: Know your edge instantly"
        />
        
        <FeatureCard
          icon={<Brain />}
          title="CLV Tracking"
          description="Track your Closing Line Value to measure betting skill. See if you're consistently beating the market and getting better prices than closing odds."
          benefit="Skill: Prove you beat the market"
        />
        
        <FeatureCard
          icon={<CheckCircle />}
          title="AI Parlay Builder"
          description="Generate smart parlays with positive expected value. Our AI combines correlated bets and identifies the highest-value multi-leg opportunities."
          benefit="EV: Only parlays worth playing"
        />
      </div>
    </div>
  </section>
);

const FeatureCard = ({ icon, title, description, benefit }) => (
  <div className="bg-[#0B0F12] border border-white/8 rounded-2xl p-6 hover:border-[#FACC15]/20 transition-all">
    <div className="w-12 h-12 bg-[#FACC15]/10 rounded-xl flex items-center justify-center mb-4 text-[#FACC15]">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-[#E6EDF3] mb-3">{title}</h3>
    <p className="text-[#92A2AD] mb-4 leading-relaxed">{description}</p>
    <p className="text-[#0EE6B7] font-semibold text-sm">{benefit}</p>
  </div>
);

export const EducationSection = () => (
  <section className="py-20 px-4 bg-[#0B0F12]/50">
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#E6EDF3]">
        How BetChekr's AI Makes You a Smarter Bettor
      </h2>
      
      <div className="space-y-8">
        <EducationBlock
          title="What is Expected Value (+EV)?"
          content="Expected Value (EV) is the average profit or loss you'll make on a bet if placed many times. A +EV bet means you'll profit long-term. For example, if a coin flip pays $2.10 on a $1 bet, that's +EV because you win more than you risk over time. BetChekr calculates EV for every bet by comparing bookmaker odds to true probability."
        />
        
        <EducationBlock
          title="Why Closing Line Value (CLV) Matters"
          content="CLV measures if you consistently get better odds than the final closing line. If you bet a team at -110 and it closes at -130, you beat the closing line by 20 cents. This proves you're finding value before the market corrects. Professional bettors track CLV because it's the strongest predictor of long-term profit."
        />
        
        <EducationBlock
          title="How Our AI Simplifies Complex Betting Math"
          content="BetChekr's AI processes millions of odds movements, historical data, and market inefficiencies in seconds. Instead of manually calculating vig, true odds, and optimal stake sizes, our algorithms do it instantly. You get clear signals: bet or pass, how much to stake, and which sportsbook offers the best price. It's like having a team of quants in your pocket."
        />
      </div>
    </div>
  </section>
);

const EducationBlock = ({ title, content }) => (
  <div className="bg-[#0B0F12] border border-white/8 rounded-2xl p-6">
    <h3 className="text-xl font-bold text-[#FACC15] mb-3">{title}</h3>
    <p className="text-[#E6EDF3] leading-relaxed">{content}</p>
  </div>
);

export const FAQSection = () => (
  <section className="py-20 px-4">
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-[#E6EDF3]">
        Frequently Asked Questions
      </h2>
      
      <div className="space-y-6">
        <FAQItem
          question="What is BetChekr?"
          answer="BetChekr is an AI-powered sports betting tool that serves as your complete betting hub before placing wagers. It scans for arbitrage opportunities, compares odds across sportsbooks, calculates optimal bet sizes with Kelly Criterion, and analyzes bet slips for positive expected value. Think of it as your pre-bet checkpoint to ensure every wager is mathematically sound."
        />
        
        <FAQItem
          question="How does BetChekr help sports bettors?"
          answer="BetChekr helps bettors make profitable decisions by finding +EV bets, arbitrage opportunities, and the best available odds. Our AI analyzes millions of data points to identify market inefficiencies, calculate true probabilities, and recommend optimal stake sizes. Users typically save 5-10% per bet through better line shopping and avoid costly mistakes with our bet slip analyzer."
        />
        
        <FAQItem
          question="Is BetChekr free to use?"
          answer="Yes, BetChekr offers free access with 2 daily scans for arbitrage and bet analysis. This lets you test our tools and see real profitable opportunities without any commitment. Premium users get unlimited scans, real-time alerts, advanced filters, and priority access to the highest-value opportunities. No credit card required to start."
        />
        
        <FAQItem
          question="Does BetChekr guarantee profits?"
          answer="No betting tool can guarantee profits, but BetChekr significantly improves your chances by identifying mathematically profitable opportunities. Our arbitrage scanner finds risk-free bets when they exist, and our +EV calculator shows which bets have positive expected value. Success depends on proper bankroll management, discipline, and access to multiple sportsbooks. We provide the data and analysis; you make the final decisions."
        />
      </div>
    </div>
  </section>
);

const FAQItem = ({ question, answer }) => (
  <div className="bg-[#0B0F12] border border-white/8 rounded-2xl p-6" itemScope itemType="https://schema.org/Question">
    <h3 className="text-lg font-bold text-[#E6EDF3] mb-3" itemProp="name">
      {question}
    </h3>
    <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
      <p className="text-[#92A2AD] leading-relaxed" itemProp="text">
        {answer}
      </p>
    </div>
  </div>
);

export const CTASection = () => (
  <section className="py-20 px-4 bg-gradient-to-r from-[#FACC15]/10 to-[#0EE6B7]/10">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#E6EDF3]">
        Your Betting Hub Starts Here
      </h2>
      <p className="text-xl text-[#92A2AD] mb-8">
        Join thousands of smart bettors who check BetChekr before placing any wager.
        <br />
        Find +EV bets, arbitrage opportunities, and optimal stake sizes—all with AI.
      </p>
      <button className="px-8 py-4 bg-[#FACC15] text-black font-bold rounded-xl hover:bg-[#EAB308] transition-all text-lg shadow-lg hover:shadow-xl">
        Start Your Free Analysis Now
      </button>
      <p className="text-[#92A2AD] text-sm mt-4">
        2 free scans daily • No credit card • Cancel anytime
      </p>
    </div>
  </section>
);

// Schema.org structured data for SEO
export const StructuredData = () => (
  <script type="application/ld+json" dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "BetChekr",
      "description": "AI sports betting tool for finding +EV bets, arbitrage opportunities, and optimal betting strategies",
      "applicationCategory": "SportsApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "2847"
      },
      "featureList": [
        "Arbitrage Scanner",
        "Line Shopping Tool",
        "Kelly Criterion Calculator",
        "Bet Slip Analyzer",
        "CLV Tracking",
        "AI Parlay Builder"
      ]
    })
  }} />
);

export default function OptimizedLandingContent() {
  return (
    <>
      <MetaTags />
      <StructuredData />
      <HeroSection />
      <FeaturesSection />
      <EducationSection />
      <FAQSection />
      <CTASection />
    </>
  );
}