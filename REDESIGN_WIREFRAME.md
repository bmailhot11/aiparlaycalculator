# BetChekr Line Shopping Redesign - Wireframes & UX Strategy

## Current Problems
- **Vertical scrolling hell**: Each game creates a large card
- **Value signals buried**: +EV and best odds not prominent enough
- **Too many clicks**: Need to expand/drill down to see what matters
- **Mobile unfriendly**: Cards stack poorly on mobile
- **Cognitive overload**: Too much visual noise

## New Design Philosophy: "Glanceable Value"

### Desktop Layout (Inspired by OddsJam/Outlier)
```
┌─ HEADER NAV ────────────────────────────────────────────────┐
│ 🦉 BetChekr    [Sports Tabs]    [Profile] [Premium] [🔍]   │
└─────────────────────────────────────────────────────────────┘

┌─ HERO BAR ──────────────────────────────────────────────────┐
│                Line Shopping 👑                             │
│         Find the best odds, instantly.                     │
└─────────────────────────────────────────────────────────────┘

┌─ QUICK FILTERS ────────────────────────────────────────────┐
│ 🏈 NFL  🏀 NBA  🏒 NHL  ⚾ MLB  🏫 NCAAF │ [Time: Today ▼]   │
│                                          │ [Market: All ▼]   │
│ [🔥 +EV Only] [⚡ Arbitrage] [💎 5%+ Edge]  │ [↻ Auto-refresh] │
└─────────────────────────────────────────────────────────────┘

┌─ MAIN ODDS TABLE ───────────────────────────────────────────┐
│                                                             │
│ 🎯 Event            Market    Best Odds     Books    Acts   │
│ ─────────────────────────────────────────────────────────── │
│ ⭐ LAL vs GSW        ML LAL    +125 📈+3.2%   DK     [Save] │
│ 🕒 4:30 PM         Spread     -2.5 (-110)   FD     [Track] │
│                                                             │
│ 🔥 Chiefs @ Bills   ML KC     +165 📈+8.5%   MGM    [Save] │ 
│ 🕒 8:15 PM         Over 51    51.5 (-105)   DK     [Track] │
│                                                             │
│ 💎 Lakers Total     Over      O215.5 +105   Bet365 [Save]  │
│ 🕒 Tonight         Under      U215.5 -125   FD     [Track] │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─ EXPANDABLE ROW (when clicked) ─────────────────────────────┐
│ 📊 LAL vs GSW - All Markets & Books                        │
│                                                             │
│ MONEYLINE           SPREAD (-2.5)        TOTAL (215.5)     │
│ 🥇 DK    +125      🥇 FD    -105         🥇 MGM   +105      │
│ 🥈 FD    +120      🥈 DK    -110         🥈 DK    +100      │
│ 🥉 MGM   +115      🥉 MGM   -115         🥉 FD    -105      │
│                                                             │
│ [📋 Compare All] [🎯 Set Alert] [📊 Line History]           │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (Stack-Friendly)
```
┌─ MOBILE HEADER ──────────────┐
│ 🦉 Line Shopping        [≡]  │
│ [🏈 NFL ▼] [+EV] [Arb]       │
└──────────────────────────────┘

┌─ VALUE-FIRST CARDS ──────────┐
│ ⭐ LAL vs GSW  🕒 4:30       │
│ ML: +125 (DK) 📈+3.2%       │
│ [Expand] ──────────── [Save] │
├──────────────────────────────┤
│ 🔥 KC @ BUF   🕒 8:15        │
│ ML: +165 (MGM) 📈+8.5%      │
│ [Expand] ──────────── [Save] │
└──────────────────────────────┘

┌─ BOTTOM NAV ─────────────────┐
│ [🏠 Lines] [⚡ +EV] [🎯 Arb] │ 
│ [💾 Saved] [👤 Profile]      │
└──────────────────────────────┘
```

## Visual Hierarchy & Color Coding

### 🎨 Color System
- **Gold (#F4C430)**: Best odds, +EV opportunities
- **Green (#10B981)**: Profitable/positive values  
- **Blue/Red Split**: Arbitrage indicators
- **Red (#EF4444)**: Alerts, time-sensitive
- **Gray (#6B7280)**: Secondary info, less important books

### 📊 Data Priority (What's BIG vs small)
**LARGE & BOLD:**
- Event names (LAL vs GSW)
- Best odds (+125)
- Value percentages (+3.2%)

**MEDIUM:**
- Market types (ML, Spread)
- Sportsbook names (DK, FD)
- Game times (4:30 PM)

**SMALL/SUBTLE:**
- Secondary odds
- Book rankings (🥇🥈🥉)
- Metadata (updated times)

## Key UX Improvements

### 1. **Instant Value Recognition**
- 🏆 **Golden highlight** for best available odds
- ⭐ **Star icon** for +EV opportunities  
- 🔥 **Fire icon** for high-edge plays
- 💎 **Diamond icon** for 5%+ edge opportunities

### 2. **Scannable Table Design**
- **One row per game** (not per market)
- **Best odds prominently displayed**
- **Click to expand** for full comparison
- **Generous whitespace** for clarity

### 3. **Smart Defaults & Filtering**
- **Default view**: Today's games, best odds only
- **Quick filters**: +EV, Arbitrage, Edge thresholds
- **Smart sorting**: Value-first, then time/sport
- **Auto-refresh**: Live odds without page refresh

### 4. **Action-Oriented Design**
- **Save Bet**: Quick bookmark for tracking
- **Track Bet**: Connect to dashboard analytics  
- **Set Alert**: Notify when odds move
- **Quick Compare**: Side-by-side modal

### 5. **Educational Elements**
- **Hover tooltips**: "What is +EV?" with simple explanations
- **Beginner mode**: Toggle for simpler language
- **Progress indicators**: Building bettor education
- **Value explanations**: Why these odds are good

## Competitive Advantages over OddsJam/Outlier

### 🎯 **BetChekr's Unique Value**
1. **Dashboard Integration**: Save bets → Auto-track performance
2. **AI Coaching**: Not just odds, but learning to bet better  
3. **Visual Clarity**: Less cluttered than OddsJam
4. **Value Education**: Teaching concepts, not just showing numbers
5. **Brand Personality**: Friendly owl guide vs. sterile data tables

### 🚀 **Speed Optimizations**
- **Lazy loading**: Only load visible rows
- **Cached data**: Smart caching for repeated queries
- **Predictive loading**: Load next pages before scrolling
- **Optimized API**: Batch requests, minimal data transfer

This redesign transforms line shopping from "information overload" to "instant decision-making tool" while maintaining BetChekr's educational and brand identity.