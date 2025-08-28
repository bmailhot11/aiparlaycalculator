export default function GradientBG({ children }) {
  return (
    <div 
      className="min-h-screen relative"
      style={{
        background: `
          radial-gradient(ellipse at top right, rgba(14, 230, 183, 0.08) 0%, transparent 50%),
          conic-gradient(from 230deg at 0% 100%, rgba(250, 204, 21, 0.04), transparent 50%),
          #080B0C
        `
      }}
    >
      {/* Subtle diagonal arcs */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `
            linear-gradient(45deg, transparent 48%, rgba(255,255,255,0.02) 49%, rgba(255,255,255,0.02) 51%, transparent 52%),
            linear-gradient(-45deg, transparent 48%, rgba(255,255,255,0.01) 49%, rgba(255,255,255,0.01) 51%, transparent 52%)
          `,
          backgroundSize: '100px 100px'
        }}
      />
      
      {/* Ultra-subtle noise texture */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px'
        }}
      />
      
      {children}
    </div>
  );
}