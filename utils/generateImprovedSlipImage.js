// Generate improved betting slip image using BetChekr template
export async function generateImprovedSlipImage({ originalSlip, improvedBets, explanation, analysis }) {
  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.log('⚠️ Canvas not available in server environment, skipping image generation');
    return null;
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Canvas dimensions to match template
  const width = 800;
  const height = 1200;
  canvas.width = width;
  canvas.height = height;
  
  // Background (light gray like template)
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, width, height);
  
  // Header section - BetChekr branding
  const headerHeight = 80;
  ctx.fillStyle = '#000000';
  roundRect(ctx, 20, 20, width - 40, headerHeight, 15);
  ctx.fill();
  
  // BetChekr logo and text
  ctx.fillStyle = '#F4C430';
  ctx.font = 'bold 32px Inter, Arial, sans-serif';
  ctx.fillText('🦉 BETCHEKR', 40, 65);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px Inter, Arial, sans-serif';
  ctx.fillText('Bet Slip', 40, 85);
  
  // Bet info section
  const infoY = 130;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 20, infoY, width - 40, 100, 10);
  ctx.fill();
  ctx.strokeStyle = '#e5e5e5';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Left side - Bet ID and Date
  ctx.fillStyle = '#666666';
  ctx.font = '14px Inter, Arial, sans-serif';
  ctx.fillText('Bet ID', 40, infoY + 25);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px Inter, Arial, sans-serif';
  ctx.fillText(generateBetId(), 40, infoY + 45);
  
  ctx.fillStyle = '#666666';
  ctx.font = '14px Inter, Arial, sans-serif';
  ctx.fillText('Placed', 40, infoY + 70);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px Inter, Arial, sans-serif';
  ctx.fillText(new Date().toLocaleDateString(), 40, infoY + 90);
  
  // Right side - Stake and Payout
  const rightX = width - 200;
  ctx.fillStyle = '#666666';
  ctx.font = '14px Inter, Arial, sans-serif';
  ctx.fillText('Stake', rightX, infoY + 25);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px Inter, Arial, sans-serif';
  ctx.fillText(originalSlip.total_stake || '$10', rightX, infoY + 45);
  
  ctx.fillStyle = '#666666';
  ctx.font = '14px Inter, Arial, sans-serif';
  ctx.fillText('Potential Payout', rightX, infoY + 70);
  ctx.fillStyle = '#22C55E';
  ctx.font = 'bold 16px Inter, Arial, sans-serif';
  
  // Calculate improved payout
  const improvedPayout = calculateImprovedPayout(improvedBets, originalSlip.total_stake || '$10');
  ctx.fillText(improvedPayout, rightX, infoY + 90);
  
  // Bet legs section
  let currentY = 260;
  improvedBets.forEach((bet, index) => {
    const legHeight = 120;
    
    // Leg background
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 20, currentY, width - 40, legHeight, 10);
    ctx.fill();
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Leg number (yellow circle)
    ctx.fillStyle = '#F4C430';
    ctx.beginPath();
    ctx.arc(60, currentY + 30, 20, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px Inter, Arial, sans-serif';
    ctx.fillText((index + 1).toString(), 55, currentY + 36);
    
    // League
    ctx.fillStyle = '#666666';
    ctx.font = '14px Inter, Arial, sans-serif';
    ctx.fillText(`{${bet.league || 'NFL'}}`, 100, currentY + 25);
    
    // Matchup
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Inter, Arial, sans-serif';
    ctx.fillText(bet.matchup || bet.game, 100, currentY + 50);
    
    // Market and Selection
    ctx.fillStyle = '#000000';
    ctx.font = '16px Inter, Arial, sans-serif';
    ctx.fillText(`${bet.market} • ${bet.selection}`, 100, currentY + 75);
    
    // Odds (right side)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Inter, Arial, sans-serif';
    const oddsText = `${bet.odds} (${bet.decimal_odds})`;
    const oddsWidth = ctx.measureText(oddsText).width;
    ctx.fillText(oddsText, width - oddsWidth - 40, currentY + 50);
    
    // Status badge
    const status = bet.improved ? 'IMPROVED' : 'ORIGINAL';
    const statusColor = bet.improved ? '#22C55E' : '#9CA3AF';
    
    ctx.fillStyle = statusColor;
    roundRect(ctx, width - 120, currentY + 75, 80, 25, 12);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, Arial, sans-serif';
    const statusWidth = ctx.measureText(status).width;
    ctx.fillText(status, width - 120 + (80 - statusWidth) / 2, currentY + 92);
    
    currentY += legHeight + 15;
  });
  
  // Notes section
  const notesY = currentY + 20;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 20, notesY, width - 40, 150, 10);
  ctx.fill();
  ctx.strokeStyle = '#e5e5e5';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  ctx.fillStyle = '#666666';
  ctx.font = '14px Inter, Arial, sans-serif';
  ctx.fillText('Notes', 40, notesY + 25);
  
  // Wrap explanation text
  ctx.fillStyle = '#000000';
  ctx.font = '14px Inter, Arial, sans-serif';
  const wrappedText = wrapText(ctx, explanation, width - 80, 16);
  wrappedText.forEach((line, index) => {
    ctx.fillText(line, 40, notesY + 50 + (index * 18));
  });
  
  return canvas.toDataURL('image/png', 0.96);
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
  return 'BC' + Date.now().toString().slice(-8);
}

function calculateImprovedPayout(bets, stake) {
  const stakeAmount = parseFloat(stake.replace('$', '')) || 10;
  const totalDecimalOdds = bets.reduce((acc, bet) => acc * parseFloat(bet.decimal_odds), 1);
  const payout = (stakeAmount * totalDecimalOdds).toFixed(2);
  return `$${payout}`;
}

function wrapText(ctx, text, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines.slice(0, 8); // Limit to 8 lines
}

// Export function to download the improved slip
export function downloadImprovedSlip(dataUrl, filename = 'betchekr-improved-slip.png') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.log('⚠️ Download not available in server environment');
    return;
  }
  
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}