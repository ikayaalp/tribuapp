import https from 'https';
import fs from 'fs';

const API_KEY = 'SSjAiPeO3QBiEqIgwBTVJhpIIpqzwf7xnuKARbPcWXCfE6Pgj1tvKbaqmJLf';
const searchWords = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Super Lig', 'Süper Lig', 'Eredivisie', 'Primeira Liga', 'Champions League', 'Europa League'];

const searchPromises = searchWords.map(word => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.sportmonks.com',
      port: 443,
      path: `/v3/football/leagues/search/${encodeURIComponent(word)}?api_token=${API_KEY}`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data.length > 0) {
            resolve({ word, results: json.data.map(l => ({ id: l.id, name: l.name })).slice(0, 2) });
          } else {
            resolve({ word, results: [] });
          }
        } catch { resolve({ word, results: [] }); }
      });
    });
    req.end();
  });
});

Promise.all(searchPromises).then(results => {
  fs.writeFileSync('scripts/leagues.json', JSON.stringify(results, null, 2), 'utf8');
});
