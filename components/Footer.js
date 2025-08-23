import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = {
    About: [
      { label: 'How it Works', href: '/how-it-works' },
      { label: 'About Us', href: '/about' },
      { label: 'Pricing', href: '/pricing' }
    ],
    Product: [
      { label: 'Positive EV Lines', href: '/positive-ev' },
      { label: 'AI Parlays', href: '/ai-parlay' },
      { label: 'Arbitrage', href: '/arbitrage' },
      { label: 'Daily Picks', href: '/premium/today' },
      { label: 'Track Record', href: '/results' }
    ],
    Legal: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Responsible Gaming', href: '/responsible-gaming' }
    ]
  };

  return (
    <footer className="bg-[#0B0F14] border-t border-[#1F2937]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-[#E5E7EB] text-lg font-bold tracking-[-0.01em]" style={{ fontWeight: 700 }}>
                betchekr
              </span>
            </Link>
            <p className="text-[#6B7280] text-sm leading-relaxed">
              Smart betting analysis powered by AI. Check edges, find +EV opportunities, and optimize your plays.
            </p>
          </div>

          {/* Footer Sections */}
          {Object.entries(footerSections).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <h3 className="text-[#E5E7EB] font-semibold text-sm uppercase tracking-wider">
                {title}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href}
                      className="text-[#6B7280] hover:text-[#F4C430] text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#1F2937]">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-[#6B7280] text-xs">
              © {currentYear} betchekr. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <Link href="/terms" className="text-[#6B7280] hover:text-[#F4C430] text-xs transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-[#6B7280] hover:text-[#F4C430] text-xs transition-colors">
                Privacy
              </Link>
              <Link href="/about" className="text-[#6B7280] hover:text-[#F4C430] text-xs transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}