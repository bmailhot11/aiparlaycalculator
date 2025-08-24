// Generate improved betting slip image with BetChekr branding
export async function generateImprovedSlipImage({ originalSlip, improvedBets, explanation, analysis }) {
  console.log('🎨 Starting slip image generation...');
  
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.log('⚠️ Canvas not available in server environment, skipping image generation');
    return null;
  }
  
  console.log('📊 Data received:', { originalSlip, improvedBets: improvedBets?.length, explanation, analysis });
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Canvas dimensions
  const width = 800;
  const height = 1000;
  canvas.width = width;
  canvas.height = height;
  
  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Header background
  ctx.fillStyle = '#0B0F14';
  ctx.fillRect(0, 0, width, 120);
  
  // BetChekr Logo/Title
  ctx.fillStyle = '#F4C430';
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
  ctx.fillText('BETCHEKR', 50, 65);
  
  // Bet Slip subtitle
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px system-ui, -apple-system, sans-serif';
  ctx.fillText('BET SLIP', 50, 95);
  
  // Date in header
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  const dateText = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  ctx.fillText(dateText, width - 150, 95);
  
  // Main content area with border
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  roundRect(ctx, 30, 140, width - 60, height - 170, 12);
  ctx.stroke();
  
  // Bet ID Section
  const betId = generateBetId();
  ctx.fillStyle = '#0B0F14';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText('BET ID:', 50, 180);
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText(betId, 120, 180);
  
  // Stake Section
  const stakeAmount = originalSlip?.total_stake || '$100';
  ctx.fillStyle = '#0B0F14';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText('STAKE:', width - 250, 180);
  ctx.fillStyle = '#F4C430';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(stakeAmount, width - 150, 180);
  
  // Separator line
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 200);
  ctx.lineTo(width - 50, 200);
  ctx.stroke();
  
  // Bet Legs Section
  let currentY = 230;
  const legSpacing = 110;
  
  improvedBets.forEach((bet, index) => {
    // Leg number badge
    ctx.fillStyle = '#F4C430';
    ctx.beginPath();
    ctx.arc(60, currentY + 25, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0B0F14';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText((index + 1).toString(), 56, currentY + 30);
    
    // Teams/Game
    ctx.fillStyle = '#0B0F14';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    const gameText = bet.matchup || bet.game || `Game ${index + 1}`;
    ctx.fillText(gameText, 90, currentY + 20);
    
    // Market type and selection
    ctx.fillStyle = '#6B7280';
    ctx.font = '15px system-ui, -apple-system, sans-serif';
    const marketText = `${bet.market || 'Bet'}: ${bet.selection || 'Selection'}`;
    ctx.fillText(marketText, 90, currentY + 45);
    
    // Sportsbook
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillText(bet.sportsbook || 'Best Available', 90, currentY + 68);
    
    // Odds (right aligned)
    const oddsText = formatOdds(bet.odds);
    ctx.fillStyle = '#0B0F14';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    const oddsWidth = ctx.measureText(oddsText).width;
    ctx.fillText(oddsText, width - oddsWidth - 60, currentY + 35);
    
    // Separator between legs
    if (index < improvedBets.length - 1) {
      ctx.strokeStyle = '#F0F0F0';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(60, currentY + 85);
      ctx.lineTo(width - 60, currentY + 85);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    currentY += legSpacing;
  });
  
  // Total Section Background
  const totalSectionY = Math.max(currentY + 20, height - 200);
  ctx.fillStyle = '#F9FAFB';
  roundRect(ctx, 40, totalSectionY, width - 80, 120, 8);
  ctx.fill();
  
  // Total Odds
  const totalOdds = calculateTotalOdds(improvedBets);
  ctx.fillStyle = '#0B0F14';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillText('TOTAL ODDS:', 60, totalSectionY + 35);
  ctx.fillStyle = '#F4C430';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.fillText(totalOdds, width - 200, totalSectionY + 35);
  
  // Potential Payout
  const payout = calculateImprovedPayout(improvedBets, stakeAmount);
  ctx.fillStyle = '#0B0F14';
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillText('POTENTIAL PAYOUT:', 60, totalSectionY + 75);
  ctx.fillStyle = '#10B981';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.fillText(payout, width - 200, totalSectionY + 75);
  
  // Footer with branding
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Generated by BetChekr.com', width/2 - 70, height - 20);
  
  console.log('✅ Image generation completed, returning data URL');
  const dataUrl = canvas.toDataURL('image/png', 0.95);
  console.log('📊 Data URL length:', dataUrl.length, 'characters');
  return dataUrl;
}

// Helper functions
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function generateBetId() {
  // Generate unique bet ID with timestamp
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `BC${timestamp}${random}`;
}

function formatOdds(odds) {
  if (typeof odds === 'string') {
    return odds;
  }
  return odds > 0 ? `+${odds}` : odds.toString();
}

function calculateTotalOdds(bets) {
  // Calculate parlay odds
  let totalDecimalOdds = 1;
  
  bets.forEach(bet => {
    let decimalOdds;
    if (bet.decimal_odds) {
      decimalOdds = parseFloat(bet.decimal_odds);
    } else if (bet.odds) {
      // Convert American to decimal
      const american = typeof bet.odds === 'string' ? 
        parseInt(bet.odds.replace('+', '')) : bet.odds;
      
      if (american > 0) {
        decimalOdds = (american / 100) + 1;
      } else {
        decimalOdds = (100 / Math.abs(american)) + 1;
      }
    } else {
      decimalOdds = 2.0; // Default
    }
    totalDecimalOdds *= decimalOdds;
  });
  
  // Convert back to American odds
  if (totalDecimalOdds >= 2) {
    const americanOdds = Math.round((totalDecimalOdds - 1) * 100);
    return `+${americanOdds}`;
  } else {
    const americanOdds = Math.round(-100 / (totalDecimalOdds - 1));
    return americanOdds.toString();
  }
}

function calculateImprovedPayout(bets, stake) {
  const stakeAmount = parseFloat(stake.replace('$', '')) || 100;
  
  // Calculate total decimal odds
  let totalDecimalOdds = 1;
  bets.forEach(bet => {
    if (bet.decimal_odds) {
      totalDecimalOdds *= parseFloat(bet.decimal_odds);
    } else if (bet.odds) {
      // Convert American to decimal
      const american = typeof bet.odds === 'string' ? 
        parseInt(bet.odds.replace('+', '')) : bet.odds;
      
      if (american > 0) {
        totalDecimalOdds *= (american / 100) + 1;
      } else {
        totalDecimalOdds *= (100 / Math.abs(american)) + 1;
      }
    }
  });
  
  const payout = (stakeAmount * totalDecimalOdds).toFixed(2);
  return `$${payout}`;
}

// Export function to download the improved slip
export function downloadImprovedSlip(dataUrl, filename = 'betchekr-bet-slip.png') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.log('⚠️ Download not available in server environment');
    return;
  }
  
  console.log('💾 Initiating download:', filename);
  console.log('📂 Data URL provided:', dataUrl ? 'Yes' : 'No');
  
  if (!dataUrl) {
    console.error('❌ No data URL provided for download');
    return;
  }
  
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  console.log('✅ Download initiated');
}