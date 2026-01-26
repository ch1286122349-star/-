const https = require('https');

const token = process.argv[2];
if (!token) {
  console.error('Usage: node scripts/fetch_ad_accounts.js <user_token>');
  process.exit(1);
}

const url = `https://graph.facebook.com/v22.0/me/adaccounts?fields=name,account_id,account_status,currency&access_token=${token}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.error) {
        console.error('Error:', json.error.message);
      } else {
        console.log('Ad Accounts found:');
        if (json.data && json.data.length > 0) {
            json.data.forEach(acc => {
                console.log(`- Name: ${acc.name}, ID: act_${acc.account_id}, Status: ${acc.account_status} (1=Active), Currency: ${acc.currency}`);
            });
        } else {
            console.log('No ad accounts found for this user.');
        }
      }
    } catch (e) {
      console.error('Parse error:', e.message);
    }
  });
}).on('error', err => {
  console.error('Request error:', err.message);
});
