import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQ_ITEMS = [
  {
    id: 'what-is-ev',
    question: 'What does +EV mean?',
    answer: 'Expected Value (EV) measures whether a bet is mathematically profitable over time. A +EV bet means the odds you\'re getting are better than the true probability, making it profitable in the long run even if individual bets lose.'
  },
  {
    id: 'what-is-vig',
    question: 'What does removing the vig do?',
    answer: 'The vig (vigorish) is the bookmaker\'s built-in profit margin. By removing it, we can estimate the fair odds and true probability of each outcome. This helps identify when a book is offering better value than the market average.'
  },
  {
    id: 'is-betting-advice',
    question: 'Is this betting advice?',
    answer: 'No. We provide mathematical analysis and tools to help you make informed decisions. We show odds, probabilities, and expected values so you can decide what\'s right for your situation. Always bet responsibly and within your means.'
  },
  {
    id: 'how-accurate',
    question: 'How accurate are your predictions?',
    answer: 'We don\'t make predictions. Instead, we analyze market prices to find mathematical edges. Our tools identify mispriced lines and arbitrage opportunities based on real sportsbook data, not predictions about game outcomes.'
  },
  {
    id: 'what-is-clv',
    question: 'What is Closing Line Value (CLV)?',
    answer: 'CLV compares the price you got to the final market price before an event starts. Positive CLV means you got better odds than the closing line, indicating you found value. It\'s the best measure of long-term betting skill.'
  }
];

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <motion.div
      className="glass-panel rounded-premium-lg overflow-hidden"
      style={{
        background: 'var(--panel-80)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-1)'
      }}
    >
      <button
        onClick={onToggle}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <h3 className="text-lg font-semibold text-premium-text-primary pr-4">
          {item.question}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-premium-text-muted" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6">
              <div className="h-px bg-premium-border mb-4" />
              <p className="body-text">
                {item.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState(new Set(['what-is-ev'])); // First item open by default

  const toggleItem = (id) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-6 h-6 text-premium-accent" />
            <h2 className="text-premium-text-primary font-semibold">
              Frequently asked questions
            </h2>
          </div>
          <p className="body-text max-w-2xl mx-auto">
            New to sports betting math? These answers cover the basics of +EV betting, 
            arbitrage, and our tools.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <FAQItem
                item={item}
                isOpen={openItems.has(item.id)}
                onToggle={() => toggleItem(item.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <div className="p-6 rounded-premium-lg bg-white/5 border border-premium-border">
            <p className="text-premium-text-muted mb-4">
              Still have questions?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@betchekr.com"
                className="btn-secondary px-6 py-2 text-sm font-medium"
              >
                Contact Support
              </a>
              <a
                href="/learn"
                className="btn-primary px-6 py-2 text-sm font-medium"
              >
                Read Our Guides
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}