// pages/api/generate-parlay-image.js
import { createCanvas, registerFont } from 'canvas';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { parlay } = req.body;
    
    if (!parlay) {
      return res.status(400).json({ error: 'Parlay data required' });
    }

    // Create canvas with appropriate dimensions
    const width = 800;
    const height = Math.max(600, 200 + (parlay.parlay_legs?.length || 0) * 120);
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1f2937'); // gray-800
    gradient.addColorStop(1, '#111827'); // gray-900
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#374151'; // gray-700
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Header section
    ctx.fillStyle = '#10b981'; // green-500
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('AiParlayCalculator', 40, 60);
    
    ctx.fillStyle = '#34d399'; // green-400
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('PROFESSIONAL ANALYSIS', 40, 85);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial, sans-serif';
    const title = `${parlay.parlay_legs?.length || 0}-Leg ${parlay.sport || 'Multi-Sport'} Parlay`;
    ctx.fillText(title, 40, 130);

    // Total odds (right side)
    const totalOdds = parlay.total_american_odds || parlay.total_odds || 'TBD';
    ctx.fillStyle = '#10b981'; // green-500
    ctx.font = 'bold 36px Arial, sans-serif';
    const oddsWidth = ctx.measureText(totalOdds).width;
    ctx.fillText(totalOdds, width - oddsWidth - 40, 80);

    ctx.fillStyle = '#9ca3af'; // gray-400
    ctx.font = '14px Arial, sans-serif';
    const oddsLabel = 'Total Odds';
    const oddsLabelWidth = ctx.measureText(oddsLabel).width;
    ctx.fillText(oddsLabel, width - oddsLabelWidth - 40, 100);

    // Risk assessment
    if (parlay.risk_assessment) {
      ctx.fillStyle = '#9ca3af'; // gray-400
      ctx.font = '16px Arial, sans-serif';
      ctx.fillText(parlay.risk_assessment, 40, 155);
    }

    // Separator line
    ctx.strokeStyle = '#374151'; // gray-700
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 180);
    ctx.lineTo(width - 40, 180);
    ctx.stroke();

    // Parlay legs
    let yPosition = 220;
    if (parlay.parlay_legs && parlay.parlay_legs.length > 0) {
      parlay.parlay_legs.forEach((leg, index) => {
        // Leg number
        ctx.fillStyle = '#3b82f6'; // blue-500
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.fillText(`${index + 1}.`, 40, yPosition);

        // Game info
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial, sans-serif';
        const gameText = leg.game || leg.matchup || 'Game TBD';
        ctx.fillText(gameText, 70, yPosition);

        // Selection
        ctx.fillStyle = '#10b981'; // green-500
        ctx.font = '16px Arial, sans-serif';
        const selectionText = leg.selection || leg.bet || 'Selection TBD';
        ctx.fillText(selectionText, 70, yPosition + 25);

        // Odds
        ctx.fillStyle = '#fbbf24'; // amber-400
        ctx.font = 'bold 16px Arial, sans-serif';
        const oddsText = leg.odds || leg.american_odds || 'TBD';
        const legOddsWidth = ctx.measureText(oddsText).width;
        ctx.fillText(oddsText, width - legOddsWidth - 40, yPosition);

        // Confidence/EV info if available
        if (leg.confidence || leg.expected_value) {
          ctx.fillStyle = '#9ca3af'; // gray-400
          ctx.font = '14px Arial, sans-serif';
          let infoText = '';
          if (leg.confidence) infoText += `Confidence: ${leg.confidence}`;
          if (leg.expected_value) infoText += (infoText ? ' | ' : '') + `EV: ${leg.expected_value}`;
          ctx.fillText(infoText, 70, yPosition + 45);
        }

        // Separator line between legs
        if (index < parlay.parlay_legs.length - 1) {
          ctx.strokeStyle = '#374151'; // gray-700
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(40, yPosition + 65);
          ctx.lineTo(width - 40, yPosition + 65);
          ctx.stroke();
        }

        yPosition += 120;
      });
    }

    // Footer with potential payout
    const footerY = height - 80;
    ctx.strokeStyle = '#374151'; // gray-700
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, footerY - 20);
    ctx.lineTo(width - 40, footerY - 20);
    ctx.stroke();

    if (parlay.potential_payout) {
      ctx.fillStyle = '#10b981'; // green-500
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText(`Potential Payout: $${parlay.potential_payout}`, 40, footerY);
    }

    // Branding
    ctx.fillStyle = '#6b7280'; // gray-500
    ctx.font = '12px Arial, sans-serif';
    const brandText = 'Generated by AiParlayCalculator.com';
    const brandWidth = ctx.measureText(brandText).width;
    ctx.fillText(brandText, width - brandWidth - 40, height - 20);

    // Convert to buffer and send as response
    const buffer = canvas.toBuffer('image/png');
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="parlay-${Date.now()}.png"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);

  } catch (error) {
    console.error('Error generating parlay image:', error);
    res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
}