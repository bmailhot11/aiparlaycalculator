// Script to manually publish daily picks
// Run with: node scripts/publish-daily-picks.js

async function publishDailyPicks() {
  console.log('📝 Publishing daily picks...');
  
  try {
    const response = await fetch('http://localhost:3001/api/daily-picks/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Daily picks published successfully!');
      console.log('Recommendation ID:', result.reco_id);
      console.log('Date:', result.publish_date);
      
      if (result.workflow_results?.publishing?.recommendations) {
        const recs = result.workflow_results.publishing.recommendations;
        console.log('\nPublished picks:');
        console.log('- Single bet:', recs.single ? '✓' : '✗');
        console.log('- 2-leg parlay:', recs.parlay2 ? '✓' : '✗');
        console.log('- 4-leg parlay:', recs.parlay4 ? '✓' : '✗');
        
        if (recs.no_bet_reason) {
          console.log('No bet reason:', recs.no_bet_reason);
        }
      }
    } else {
      console.error('❌ Failed to publish picks:', result.message || result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  publishDailyPicks();
}

module.exports = { publishDailyPicks };