import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Brain, TrendingUp, Calculator, DollarSign, Target, AlertTriangle, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function AIBettingGuide() {
  return (
    <>
      <Head>
        <title>How to Use AI for Sports Betting (Step-by-Step Guide) | BetChekr</title>
        <meta name="description" content="Complete guide to using AI for sports betting. Learn what AI can and can't do, step-by-step workflow, formulas, and responsible betting practices." />
        <meta name="keywords" content="AI sports betting, sports betting AI, expected value, kelly criterion, CLV, closing line value, bankroll management" />
      </Head>

      <div className="min-h-screen bg-[#0B0F14]">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <Link href="/learn" className="inline-flex items-center text-[#F4C430] hover:text-[#e6b829] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Learn Center
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-[#F4C430]" />
              <span className="text-[#F4C430] text-sm font-medium">Advanced Strategy</span>
            </div>
            
            <h1 className="text-4xl font-bold text-[#E5E7EB] mb-4">
              How to Use AI for Sports Betting (Step‑by‑Step)
            </h1>
            
            <p className="text-[#9CA3AF] text-lg leading-relaxed mb-6">
              <strong>Short answer:</strong> AI won't magically predict games. It speeds up research and math so you can find price edges faster and avoid bad bets. 
              The winning loop is simple: (1) pull live odds → (2) strip the vig → (3) compare to a trusted "true" price → (4) size your stake responsibly → (5) track CLV and iterate. 
              Use AI to automate, explain, and enforce rules—not to guess outcomes.
            </p>

            <div className="bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-[#F4C430] mt-0.5" />
                <div className="text-sm text-[#E5E7EB]">
                  <strong>Reading time:</strong> 15 minutes • <strong>Level:</strong> Advanced • <strong>Updated:</strong> January 2025
                </div>
              </div>
            </div>
          </motion.div>

          {/* What AI Can and Can't Do */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-[#E5E7EB] mb-6">What AI can (and can't) do</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Good Uses */}
              <div className="bg-[#141C28] rounded-lg border border-green-500/30 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-green-400">Good uses</h3>
                </div>
                
                <ul className="space-y-3 text-[#9CA3AF]">
                  <li>• Turn odds into implied probabilities and remove vig at scale.</li>
                  <li>• Scan books for +EV mismatches and arbitrage.</li>
                  <li>• Summarize injuries/news and flag markets likely to move.</li>
                  <li>• Explain risk (correlation in same‑game parlays, variance, bankroll drawdown).</li>
                  <li>• Enforce process: pre‑bet checklist, stake sanity checks, CLV tracking.</li>
                </ul>
              </div>

              {/* Bad Uses */}
              <div className="bg-[#141C28] rounded-lg border border-red-500/30 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <h3 className="text-lg font-semibold text-red-400">Bad uses</h3>
                </div>
                
                <ul className="space-y-3 text-[#9CA3AF]">
                  <li>• Treating an LLM like an oracle ("who wins tonight?").</li>
                  <li>• Ignoring market prices/closing line in favor of vibes or narratives.</li>
                  <li>• Overfitting to tiny samples or stale data.</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-lg">
              <p className="text-[#E5E7EB] font-medium">
                <strong>Bottom line:</strong> AI is a decision support system, not a crystal ball.
              </p>
            </div>
          </motion.section>

          {/* The 8-Step Workflow */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-[#E5E7EB] mb-6">The workflow (8 steps you can actually run)</h2>
            
            <div className="space-y-8">
              {/* Step 1 */}
              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#F4C430] text-[#0B0F14] rounded-full flex items-center justify-center font-bold">1</div>
                  <h3 className="text-xl font-semibold text-[#E5E7EB]">Set bankroll rules first</h3>
                </div>
                
                <p className="text-[#9CA3AF] mb-3">Pick one and stick to it:</p>
                <ul className="text-[#9CA3AF] space-y-2">
                  <li>• <strong>Fixed‑fraction</strong> (e.g., 0.5–1.5% per play)</li>
                  <li>• <strong>Kelly fraction</strong> (half‑Kelly recommended). Formula below.</li>
                </ul>
              </div>

              {/* Step 2 */}
              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#F4C430] text-[#0B0F14] rounded-full flex items-center justify-center font-bold">2</div>
                  <h3 className="text-xl font-semibold text-[#E5E7EB]">Pull current market prices</h3>
                </div>
                
                <p className="text-[#9CA3AF]">
                  You need decimal or American odds for each side/leg from multiple books. Keep timestamps—stale odds = fake edges.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#F4C430] text-[#0B0F14] rounded-full flex items-center justify-center font-bold">3</div>
                  <h3 className="text-xl font-semibold text-[#E5E7EB]">Convert odds ↔ implied probability</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-[#9CA3AF] mb-2"><strong>American → Decimal:</strong></p>
                    <div className="bg-[#0F172A] p-3 rounded font-mono text-sm text-[#E5E7EB]">
                      If +A: d = 1 + A/100<br/>
                      If −A: d = 1 + 100/|A|
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-[#9CA3AF] mb-2"><strong>Implied probability:</strong></p>
                    <div className="bg-[#0F172A] p-3 rounded font-mono text-sm text-[#E5E7EB]">
                      p = 1/d
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#F4C430] text-[#0B0F14] rounded-full flex items-center justify-center font-bold">4</div>
                  <h3 className="text-xl font-semibold text-[#E5E7EB]">Remove the vig (fair probabilities)</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-[#9CA3AF] mb-2">For a 2‑way market with implied p₁, p₂:</p>
                    <div className="bg-[#0F172A] p-3 rounded font-mono text-sm text-[#E5E7EB]">
                      p₁' = p₁/(p₁ + p₂)<br/>
                      p₂' = p₂/(p₁ + p₂)
                    </div>
                  </div>
                  
                  <p className="text-[#9CA3AF]">
                    For 3‑way markets, divide each pᵢ by the sum Σpᵢ.
                  </p>
                </div>
              </div>

              {/* Steps 5-8 */}
              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#F4C430] text-[#0B0F14] rounded-full flex items-center justify-center font-bold">5</div>
                  <h3 className="text-xl font-semibold text-[#E5E7EB]">Choose a "true price" reference</h3>
                </div>
                
                <p className="text-[#9CA3AF] mb-3">Two pragmatic options:</p>
                <ul className="text-[#9CA3AF] space-y-2">
                  <li>• <strong>Sharp reference book</strong> (many use a known sharp market as the anchor).</li>
                  <li>• <strong>No‑vig consensus</strong> from several books (median of fair probabilities).</li>
                </ul>
              </div>

              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#F4C430] text-[#0B0F14] rounded-full flex items-center justify-center font-bold">6</div>
                  <h3 className="text-xl font-semibold text-[#E5E7EB]">Compute edge and expected value</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[#9CA3AF]">Let p_true be your fair probability and d_your the best available price:</p>
                  
                  <div className="bg-[#0F172A] p-3 rounded font-mono text-sm text-[#E5E7EB]">
                    EV% = (d_your × p_true − 1) × 100%<br/>
                    Edge% = p_true − 1/d_your
                  </div>
                  
                  <p className="text-[#9CA3AF]">
                    <strong>Target thresholds (example):</strong> list opportunities at ≥ +1.5% EV, consider bets at ≥ +2.5–3% EV depending on stake policy.
                  </p>
                </div>
              </div>

              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#F4C430] text-[#0B0F14] rounded-full flex items-center justify-center font-bold">7</div>
                  <h3 className="text-xl font-semibold text-[#E5E7EB]">Size the stake</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-[#9CA3AF]">Kelly (recommended as half‑Kelly):</p>
                  
                  <div className="bg-[#0F172A] p-3 rounded font-mono text-sm text-[#E5E7EB]">
                    Let b = d_your − 1, p = p_true, q = 1 − p<br/>
                    f* = (bp − q)/b → stake = f* × bankroll<br/>
                    Use 0.5 × f* for lower volatility
                  </div>
                </div>
              </div>

              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#F4C430] text-[#0B0F14] rounded-full flex items-center justify-center font-bold">8</div>
                  <h3 className="text-xl font-semibold text-[#E5E7EB]">Track CLV and outcome separately</h3>
                </div>
                
                <div className="space-y-3">
                  <p className="text-[#9CA3AF]">
                    <strong>CLV (Closing Line Value):</strong> did your ticket beat the closing price?
                  </p>
                  <p className="text-[#9CA3AF]">
                    <strong>Outcome:</strong> win/loss is noisy; CLV trends confirm your edge faster.
                  </p>
                  <p className="text-[#9CA3AF]">
                    Log both per bet; review weekly.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* AI Prompts Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-[#E5E7EB] mb-6">Copy‑and‑paste AI prompts (works with any LLM)</h2>
            
            <div className="space-y-6">
              {/* Prompt 1 */}
              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-3">1) Research Assistant (edge scan)</h3>
                <div className="bg-[#0F172A] p-4 rounded text-sm text-[#E5E7EB] font-mono overflow-x-auto">
                  You are a sports-betting research assistant. I will paste JSON with markets from multiple books.<br/>
                  TASKS:<br/>
                  1) Normalize odds to decimal and compute implied probabilities for each outcome.<br/>
                  2) Remove the vig for each market (2- or 3-way) to get fair probabilities.<br/>
                  3) Using &lt;REFERENCE_BOOK&gt; or the no-vig consensus as p_true, compute EV% for each book's price.<br/>
                  4) Return a table of opportunities with EV% ≥ 1.5, sorted by EV. Include book, market, team, p_true, price, EV%, and timestamp.<br/>
                  5) Flag likely correlation if multiple legs share team/market.
                </div>
              </div>

              {/* Prompt 2 */}
              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-3">2) Stake Sizing (Kelly)</h3>
                <div className="bg-[#0F172A] p-4 rounded text-sm text-[#E5E7EB] font-mono">
                  Given bankroll = $&lt;X&gt;, price decimal = &lt;d&gt;, p_true = &lt;p&gt;, compute Kelly and Half-Kelly stakes.<br/>
                  Return: Kelly_f, HalfKelly_f, stake_$, and a warning if HalfKelly_f &gt; 2% bankroll.
                </div>
              </div>

              {/* Prompt 3 */}
              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-3">3) Parlay Sanity Check</h3>
                <div className="bg-[#0F172A] p-4 rounded text-sm text-[#E5E7EB] font-mono">
                  I will paste legs with decimal prices and p_true per leg. Estimate correlation qualitatively (same team/market? injury link?).<br/>
                  If correlation likely &gt; moderate, either apply a -20% EV penalty or advise against the parlay. Output net EV estimate and a one-line rationale.
                </div>
              </div>

              {/* Prompt 4 */}
              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-3">4) Bet Slip Audit</h3>
                <div className="bg-[#0F172A] p-4 rounded text-sm text-[#E5E7EB] font-mono">
                  Here is a bet slip (prices + teams + stake). For each leg: convert to decimal, compute implied probability, compare to reference p_true, compute EV%. If the net EV is negative, suggest the best available price across the pasted books. Keep it to a bulleted summary.
                </div>
              </div>

              {/* Prompt 5 */}
              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-3">5) Market Movement Watch</h3>
                <div className="bg-[#0F172A] p-4 rounded text-sm text-[#E5E7EB] font-mono">
                  Given injuries/news summaries and opening lines vs current, list 3 markets most likely to move in the next 6 hours. Explain in one sentence per market.
                </div>
              </div>
            </div>
          </motion.section>

          {/* FAQ Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-[#E5E7EB] mb-6">FAQs (for users and search/AI snippets)</h2>
            
            <div className="space-y-4">
              {[
                {
                  question: "What's the best AI for sports betting?",
                  answer: "There isn't a single \"best.\" Use LLMs for workflow, explanations, and rule‑enforcement; use code/stats models (logistic regression, gradient boosting) for probabilities; use data pipelines for prices and CLV tracking. Combine them."
                },
                {
                  question: "Is using AI for betting legal?",
                  answer: "Generally yes to research and math. Always follow your jurisdiction and book rules. Automated scraping or scripting may violate Terms—check before running bots."
                },
                {
                  question: "Does AI guarantee profit?",
                  answer: "No. Your edge comes from price (finding +EV or beating close), not from AI \"predictions.\" AI just helps you execute consistently."
                },
                {
                  question: "How do I start with $500 bankroll?",
                  answer: "Use fixed‑fraction stakes (0.5–1.0% per play), bet singles, target EV ≥ +2% until your logging shows positive CLV."
                },
                {
                  question: "What's CLV and why care?",
                  answer: "Closing Line Value measures if you beat the market's final price. Beating close over time correlates with long‑run profit far better than short‑term wins."
                },
                {
                  question: "How do I avoid correlated parlays?",
                  answer: "Don't stack legs that hinge on the same event (e.g., QB over yards + WR over receptions). If you do, apply a strict EV penalty or skip it."
                },
                {
                  question: "What bankroll model should I use?",
                  answer: "Half‑Kelly if you trust your p_true; otherwise fixed‑fraction."
                }
              ].map((faq, index) => (
                <div key={index} className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                  <h3 className="text-lg font-semibold text-[#F4C430] mb-3">{faq.question}</h3>
                  <p className="text-[#9CA3AF]">{faq.answer}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Math Appendix */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-[#E5E7EB] mb-6">Math appendix (formulas you can cite)</h2>
            
            <div className="space-y-6">
              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-3">American → Decimal</h3>
                <div className="bg-[#0F172A] p-3 rounded font-mono text-sm text-[#E5E7EB]">
                  d = 1 + A/100 if A &gt; 0<br/>
                  d = 1 + 100/|A| if A &lt; 0
                </div>
              </div>

              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-3">Implied probability</h3>
                <div className="bg-[#0F172A] p-3 rounded font-mono text-sm text-[#E5E7EB]">
                  p = 1/d
                </div>
              </div>

              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-3">No‑vig (2‑way)</h3>
                <div className="bg-[#0F172A] p-3 rounded font-mono text-sm text-[#E5E7EB]">
                  p₁' = p₁/(p₁ + p₂)<br/>
                  p₂' = p₂/(p₁ + p₂)
                </div>
              </div>

              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-3">Expected value</h3>
                <div className="bg-[#0F172A] p-3 rounded font-mono text-sm text-[#E5E7EB]">
                  EV = d × p_true − 1 → in % multiply by 100
                </div>
              </div>

              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-3">Kelly fraction</h3>
                <div className="bg-[#0F172A] p-3 rounded font-mono text-sm text-[#E5E7EB]">
                  f* = (bp − q)/b<br/>
                  where b = d − 1, p = p_true, q = 1 − p<br/>
                  Use half‑Kelly
                </div>
              </div>

              <div className="bg-[#141C28] rounded-lg border border-[#1F2937] p-6">
                <h3 className="text-lg font-semibold text-[#F4C430] mb-3">Arbitrage check (2‑way)</h3>
                <div className="bg-[#0F172A] p-3 rounded font-mono text-sm text-[#E5E7EB]">
                  Arb exists if 1/d₁ + 1/d₂ &lt; 1<br/>
                  ROI = 1 − (1/d₁ + 1/d₂)
                </div>
              </div>
            </div>
          </motion.section>

          {/* Responsible Betting */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12"
          >
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h2 className="text-xl font-bold text-red-400">Responsible betting</h2>
              </div>
              
              <p className="text-[#E5E7EB] text-lg">
                Set hard limits. Expect variance. Log everything. If betting stops being fun, stop.
              </p>
            </div>
          </motion.section>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center bg-[#141C28] rounded-lg p-8 border border-[#1F2937]"
          >
            <h2 className="text-2xl font-bold text-[#E5E7EB] mb-3">
              Ready to Apply AI to Your Betting?
            </h2>
            <p className="text-[#9CA3AF] mb-6 max-w-2xl mx-auto">
              Use BetChekr's AI-powered analysis to implement these strategies. Upload your bet slips 
              and get instant EV calculations, CLV tracking, and mathematical insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <button className="px-6 py-3 bg-[#F4C430] text-[#0B0F14] font-semibold rounded-lg hover:bg-[#e6b829] transition-colors">
                  Try BetChekr Free
                </button>
              </Link>
              <Link href="/learn">
                <button className="px-6 py-3 border border-[#F4C430] text-[#F4C430] font-semibold rounded-lg hover:bg-[#F4C430]/10 transition-colors">
                  More Learning Resources
                </button>
              </Link>
            </div>
          </motion.div>
        </main>

        <Footer />
      </div>
    </>
  );
}