# Premium Skin Documentation

## Overview

The premium skin provides a glassmorphism design aesthetic for BetChekr while maintaining all existing functionality. It features refined typography, improved spacing, enhanced visual hierarchy, and subtle animations.

## How to Enable/Disable the Theme

### Development Preview

1. **Automatic on Premium Route**: The theme automatically applies when visiting `/premium-preview`
2. **Dev Toggle**: On the premium preview page, a toggle button appears in the top-right corner (development only) to turn the theme on/off without page reload
3. **Manual Application**: Add the `betchekr-premium` class to the body element or any container

### Programmatic Control

```javascript
// Enable premium theme
document.body.classList.add('betchekr-premium');

// Disable premium theme  
document.body.classList.remove('betchekr-premium');

// Check if premium theme is active
const isPremiumActive = document.body.classList.contains('betchekr-premium');
```

### Using the SiteTheme Wrapper

The `SiteTheme` component automatically manages theme application:

```javascript
import SiteTheme from '../components/theme/SiteTheme';

function App() {
  return (
    <SiteTheme>
      <YourAppContent />
    </SiteTheme>
  );
}
```

## Theme Components

### CSS Variables

All premium styles use CSS variables for easy customization:

```css
.betchekr-premium {
  --ink: #080B0C;           /* Near-black background */
  --panel: #0B0F12;         /* Card backgrounds */
  --panel-80: rgba(11,15,18,0.8); /* Glass panels */
  --border: rgba(255,255,255,0.08); /* Hairline borders */
  --text-primary: #E6EDF3;  /* Primary text */
  --text-muted: #92A2AD;    /* Muted text */
  --accent: #FACC15;        /* Brand yellow */
  --teal: #0EE6B7;          /* Support teal (micro-glows only) */
}
```

### Utility Classes

Available utility classes when premium theme is active:

- `.glass-panel` - Glass morphism card style
- `.btn-primary` - Premium yellow button
- `.btn-secondary` - Ghost button style
- `.text-primary` - Primary text color
- `.text-muted` - Muted text color
- `.premium-table` - Styled data tables
- `.premium-badge` - Small badges/chips

### Tailwind Extensions

Custom Tailwind classes for premium theme:

```javascript
// Colors
bg-premium-panel
text-premium-accent
border-premium-border

// Border radius
rounded-premium-sm
rounded-premium-md
rounded-premium-lg

// Shadows
shadow-premium-1
shadow-premium-2
```

## Component Structure

### GradientBG Component

Provides the premium background gradient:

```javascript
import GradientBG from '../components/theme/GradientBG';

<GradientBG>
  <YourContent />
</GradientBG>
```

### Premium Header

The header automatically applies premium styling when the theme is active:
- Transparent with backdrop blur
- Adds shadow and background on scroll
- Maintains existing logo and navigation

## Data Integration Points

### Where to Add Real Data

1. **Hero Rotating Cards**: Replace `mockArbitrageCards` in `/premium-preview.js`
2. **CLV Data**: Replace `clvData` array with real performance metrics
3. **Highlights**: Replace `highlights` array with actual bet results
4. **Pricing**: Update pricing cards with real subscription tiers

### API Integration Examples

```javascript
// Replace mock arbitrage data
const fetchRealArbitrageData = async () => {
  const response = await fetch('/api/arbitrage/live-opportunities');
  const data = await response.json();
  return data.opportunities;
};

// Replace mock CLV data
const fetchCLVPerformance = async (userId) => {
  const response = await fetch(`/api/users/${userId}/clv-performance`);
  const data = await response.json();
  return data.dailyClv;
};
```

## Promoting to Site-wide

To apply the premium skin site-wide without code churn:

### Option 1: Environment Variable

```javascript
// In _app.js
useEffect(() => {
  if (process.env.NEXT_PUBLIC_PREMIUM_SKIN === 'true') {
    document.body.classList.add('betchekr-premium');
  }
}, []);
```

### Option 2: User Preference

```javascript
// Store user preference
const usePremiumSkin = localStorage.getItem('usePremiumSkin') === 'true';
if (usePremiumSkin) {
  document.body.classList.add('betchekr-premium');
}
```

### Option 3: A/B Testing

```javascript
// Apply to percentage of users
const userGroup = Math.random();
if (userGroup < 0.5) { // 50% of users
  document.body.classList.add('betchekr-premium');
}
```

## Mobile Optimizations

The premium skin includes mobile-specific features:

- **Swipeable Carousel**: Hero cards become swipeable on mobile
- **Sticky Bottom CTA**: Appears after 2 scroll events on mobile
- **Responsive Typography**: Scales appropriately across devices
- **Touch Interactions**: Optimized button sizes and touch targets

## Performance Considerations

- **CSS Variables**: Minimal runtime impact
- **Transform/Opacity Animations**: Hardware accelerated
- **No Heavy Libraries**: Uses only existing dependencies
- **Conditional Loading**: Styles only apply when theme is active
- **Bundle Size**: Minimal increase (~5KB compressed)

## Browser Support

- **Modern Browsers**: Full support (Chrome 88+, Firefox 87+, Safari 14+)
- **Backdrop Filter**: Falls back gracefully where unsupported
- **CSS Variables**: Supported in all target browsers
- **Grid/Flexbox**: Full compatibility

## Accessibility

- **Focus Indicators**: Yellow ring on all interactive elements
- **Color Contrast**: Meets WCAG AA standards
- **Animation Respect**: Honors `prefers-reduced-motion`
- **Keyboard Navigation**: Full keyboard accessibility maintained
- **Screen Reader**: No impact on screen reader functionality

## Customization

To customize colors or spacing:

1. **Edit CSS Variables** in `styles/globals.css`
2. **Update Tailwind Config** in `tailwind.config.js`
3. **Modify Component Styles** in premium theme sections

Example customization:

```css
.betchekr-premium {
  --accent: #your-brand-color;
  --panel: #your-panel-color;
  /* ... other overrides */
}
```

## Troubleshooting

### Theme Not Applying

1. Check that `betchekr-premium` class is on the body element
2. Verify CSS variables are loaded
3. Clear browser cache and rebuild

### Mobile Issues

1. Ensure viewport meta tag is present
2. Test touch events on actual devices
3. Verify backdrop-filter support

### Performance Issues

1. Check for layout shifts in Lighthouse
2. Monitor bundle size impact
3. Test on slower devices

## Future Enhancements

Potential improvements for the premium skin:

- **Dark/Light Mode Toggle**: Add theme switching
- **Custom Color Schemes**: User-selectable palettes  
- **Advanced Animations**: More sophisticated transitions
- **Seasonal Themes**: Holiday or event-based variations
- **User Customization**: Personal theme preferences