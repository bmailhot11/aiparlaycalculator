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
  
  try {
    // Load the BetChekr template as base
    const templateImg = new Image();
    templateImg.crossOrigin = 'anonymous';
    
    const templateLoaded = new Promise((resolve, reject) => {
      templateImg.onload = resolve;
      templateImg.onerror = reject;
      templateImg.src = '/betchekr_betslip_template_with_provided_logo.jpg';
    });
    
    await templateLoaded;
    
    // Draw the template as background
    ctx.drawImage(templateImg, 0, 0, width, height);
    
  } catch (error) {
    console.log('⚠️ Template not loaded, using plain background');
    // Fallback to plain background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);
  }
  
  // Template overlay content - position data on template
  // Since we're using a template, we need to position text appropriately
  // Based on typical template layout, bet info starts around y=150
  
  // Bet ID and Date (positioned over template fields)
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText(generateBetId(), 100, 170);
  ctx.fillText(new Date().toLocaleDateString(), 100, 195);
  
  // Stake and Potential Payout (right side)
  const rightX = width - 180;
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText(originalSlip.total_stake || '$100', rightX, 170);
  
  // Calculate and display improved payout
  const improvedPayout = calculateImprovedPayout(improvedBets, originalSlip.total_stake || '$100');
  ctx.fillStyle = '#22C55E';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText(improvedPayout, rightX, 195);
  
  // Bet legs section - positioned to align with template
  let currentY = 260;
  const maxLegs = Math.min(improvedBets.length, 4); // Limit legs to fit template
  
  improvedBets.slice(0, maxLegs).forEach((bet, index) => {
    const legHeight = 100; // Reduced height to fit template better
    
    // Game/Matchup (main text)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial, sans-serif';
    const gameText = bet.matchup || bet.game || `Game ${index + 1}`;
    ctx.fillText(gameText, 50, currentY + 25);
    
    // Market and Selection
    ctx.fillStyle = '#333333';
    ctx.font = '14px Arial, sans-serif';
    const betText = `${bet.market || 'Bet'}: ${bet.selection || 'TBD'}`;
    ctx.fillText(betText, 50, currentY + 45);
    
    // Sportsbook
    ctx.fillStyle = '#666666';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(bet.sportsbook || 'Best Line', 50, currentY + 65);
    
    // Odds (right aligned)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Arial, sans-serif';
    const oddsText = bet.odds || '+100';
    const oddsWidth = ctx.measureText(oddsText).width;
    ctx.fillText(oddsText, width - oddsWidth - 50, currentY + 35);
    
    currentY += legHeight;
  });
  
  // Notes section - minimal explanation positioned in template notes area
  const notesY = Math.max(currentY + 30, 750); // Position in lower area of template
  
  // Add minimal bet explanation
  ctx.fillStyle = '#333333';
  ctx.font = '12px Arial, sans-serif';
  
  const shortExplanation = createMinimalExplanation(improvedBets, explanation);
  const wrappedText = wrapText(ctx, shortExplanation, width - 100, 14);
  wrappedText.slice(0, 4).forEach((line, index) => { // Limit to 4 lines max
    ctx.fillText(line, 50, notesY + (index * 16));
  });
  
  return canvas.toDataURL('image/png', 0.96);
}

// Helper functions
function createMinimalExplanation(bets, fullExplanation) {
  const legCount = bets.length;
  const avgEV = bets.reduce((sum, bet) => sum + (bet.expected_value || 0), 0) / legCount;
  const hasEV = avgEV > 0;
  
  if (hasEV) {
    return `${legCount}-leg parlay with ${(avgEV * 100).toFixed(1)}% avg edge. Mathematical analysis shows positive expected value.`;
  } else {
    return `${legCount}-leg parlay with diversified market selection. Recommended bet sizing: 2-3% of bankroll.`;
  }
}

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