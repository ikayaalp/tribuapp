import https from 'https';

const API_KEY = 'SSjAiPeO3QBiEqIgwBTVJhpIIpqzwf7xnuKARbPcWXCfE6Pgj1tvKbaqmJLf';

const today = new Date().toISOString().split('T')[0];

const options = {
  hostname: 'api.sportmonks.com',
  port: 443,
  path: `/v3/football/fixtures/date/${today}?api_token=${API_KEY}&include=league;participants;scores`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Total fixtures:', json.data?.length);
      if (json.data && json.data.length > 0) {
        // Collect unique leagues
        const leagues = {};
        json.data.forEach(fix => {
          if (fix.league) {
            leagues[fix.league.name] = fix.league.id;
          }
        });
        console.log('Leagues today:', Object.entries(leagues).slice(0, 20));
        
        // Log one fixture
        const sample = json.data[0];
        console.log('Sample fixture:', JSON.stringify({
          id: sample.id,
          name: sample.name,
          starting_at: sample.starting_at,
          league: sample.league?.name,
          participants: sample.participants?.map(p => p.name),
          scores: sample.scores?.length
        }, null, 2));
      } else {
        console.log('Response:', json);
      }
    } catch (e) {
      console.error('Parse error:', e, data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
