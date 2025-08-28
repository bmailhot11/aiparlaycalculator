export default function GradientBG({ children, className = "" }) {
  return (
    <div 
      className={`min-h-screen ${className}`}
      style={{
        background: `
          radial-gradient(ellipse at top right, rgba(14, 230, 183, 0.08) 0%, transparent 50%),
          conic-gradient(from 230deg at 0% 100%, rgba(250, 204, 21, 0.04), transparent 50%),
          #080B0C
        `
      }}
    >
      {children}
    </div>
  );
}