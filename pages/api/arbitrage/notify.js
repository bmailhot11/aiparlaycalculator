// Arbitrage Email Notification API
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, arbitrageData, userPremiumStatus } = req.body;

  // Verify user is premium
  if (!userPremiumStatus?.isPremium) {
    return res.status(403).json({ 
      success: false,
      error: 'Premium subscription required for arbitrage alerts' 
    });
  }

  if (!email) {
    return res.status(400).json({ 
      success: false,
      error: 'Email address is required' 
    });
  }

  if (!arbitrageData) {
    return res.status(400).json({ 
      success: false,
      error: 'Arbitrage data is required' 
    });
  }

  try {
    console.log(`🚨 [Arbitrage Alert] Sending notification to ${email}`);
    
    await sendArbitrageAlert(email, arbitrageData);
    
    // Store notification in user's alert history
    await storeAlertHistory(email, arbitrageData);
    
    return res.status(200).json({
      success: true,
      message: 'Arbitrage alert sent successfully',
      email,
      arbitrage_id: arbitrageData.id
    });

  } catch (error) {
    console.error('❌ Error sending arbitrage alert:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send arbitrage alert',
      details: error.message
    });
  }
}

async function sendArbitrageAlert(email, arbitrageData) {
  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Generate stakes breakdown
  const stakesTable = arbitrageData.stake_distribution
    .map(stake => `• ${stake.sportsbook}: ${stake.stake} on ${stake.selection} → Payout: ${stake.payout}`)
    .join('\n');

  const legsTable = arbitrageData.legs
    .map(leg => `• ${leg.sportsbook}: ${leg.selection} @ ${leg.american_odds > 0 ? '+' : ''}${leg.american_odds}`)
    .join('\n');

  // Create email content
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #F4C430; margin: 0; font-size: 28px;">🎯 ARBITRAGE OPPORTUNITY ALERT</h1>
          <p style="color: #666; margin: 10px 0 0 0;">Guaranteed profit opportunity detected!</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #333; margin-top: 0;">${arbitrageData.matchup}</h2>
          <p style="margin: 5px 0;"><strong>Market:</strong> ${arbitrageData.market_display}</p>
          <p style="margin: 5px 0;"><strong>Sport:</strong> ${arbitrageData.sport}</p>
          <p style="margin: 5px 0;"><strong>Game Time:</strong> ${new Date(arbitrageData.commence_time).toLocaleDateString()} ${new Date(arbitrageData.commence_time).toLocaleTimeString()}</p>
        </div>

        <div style="background: #e8f5e8; border: 2px solid #28a745; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #28a745; margin-top: 0; text-align: center;">💰 PROFIT BREAKDOWN</h3>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #28a745; margin: 10px 0;">
              ${arbitrageData.profit_percentage}% Guaranteed Profit
            </div>
            <p style="margin: 5px 0;">Investment Required: $${arbitrageData.investment_needed}</p>
            <p style="margin: 5px 0;">Guaranteed Return: $${arbitrageData.guaranteed_profit}</p>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #333; border-bottom: 2px solid #F4C430; padding-bottom: 10px;">📊 Betting Instructions</h3>
          <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
            ${legsTable.split('\n').map(leg => `<p style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">${leg}</p>`).join('')}
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #333; border-bottom: 2px solid #F4C430; padding-bottom: 10px;">💸 Optimal Stake Distribution</h3>
          <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
            ${stakesTable.split('\n').map(stake => `<p style="margin: 8px 0; padding: 8px; background: #f0f8ff; border-radius: 4px;">${stake}</p>`).join('')}
          </div>
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
          <h4 style="color: #8a6d3b; margin-top: 0;">⚠️ Important Reminders:</h4>
          <ul style="color: #8a6d3b; margin: 10px 0; padding-left: 20px;">
            <li>Act quickly - arbitrage opportunities disappear fast</li>
            <li>Double-check odds before placing bets (they may have changed)</li>
            <li>Ensure you have accounts and funds ready at both sportsbooks</li>
            <li>Consider betting limits and transaction fees</li>
            <li>This is a risk-free profit opportunity when executed correctly</li>
          </ul>
        </div>

        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">
            This alert was sent because you're subscribed to BetChekr Premium arbitrage notifications.
          </p>
          <a href="https://www.betchekr.com/arbitrage" 
             style="display: inline-block; background: #F4C430; color: #0B0F14; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
            View More Opportunities →
          </a>
        </div>
      </div>
    </div>
  `;

  const emailText = `
🎯 ARBITRAGE OPPORTUNITY ALERT

Guaranteed Profit Opportunity: ${arbitrageData.profit_percentage}%

Game: ${arbitrageData.matchup}
Market: ${arbitrageData.market_display}
Sport: ${arbitrageData.sport}

BETTING INSTRUCTIONS:
${legsTable}

OPTIMAL STAKES:
${stakesTable}

Investment: $${arbitrageData.investment_needed}
Guaranteed Profit: $${arbitrageData.guaranteed_profit}

Act quickly - arbitrage opportunities disappear fast!

View more: https://www.betchekr.com/arbitrage
  `;

  // Send email
  await transporter.sendMail({
    from: `"BetChekr Arbitrage Alerts" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: `🚨 ${arbitrageData.profit_percentage}% Arbitrage Alert: ${arbitrageData.matchup}`,
    text: emailText,
    html: emailHtml,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high'
    }
  });

  console.log(`✅ Arbitrage alert sent to ${email}`);
}

async function storeAlertHistory(email, arbitrageData) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const alertsFile = path.join(process.cwd(), 'data', 'arbitrage-alerts.json');
    
    // Ensure data directory exists
    await fs.mkdir(path.dirname(alertsFile), { recursive: true });
    
    let alerts = [];
    try {
      const data = await fs.readFile(alertsFile, 'utf8');
      alerts = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start with empty array
      console.log('Creating new arbitrage alerts file');
    }
    
    // Add new alert
    alerts.push({
      id: arbitrageData.id,
      email,
      arbitrage: arbitrageData,
      sent_at: new Date().toISOString(),
      status: 'sent'
    });
    
    // Keep only last 1000 alerts
    if (alerts.length > 1000) {
      alerts = alerts.slice(-1000);
    }
    
    await fs.writeFile(alertsFile, JSON.stringify(alerts, null, 2));
    console.log(`📝 Alert history stored for ${email}`);
  } catch (error) {
    console.error('Error storing alert history:', error);
  }
}