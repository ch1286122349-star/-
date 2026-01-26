require('dotenv').config();

const AD_ACCOUNT_ID = process.env.FACEBOOK_AD_ACCOUNT_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_USER_ACCESS_TOKEN;

if (!AD_ACCOUNT_ID || !ACCESS_TOKEN) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

const API_VER = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${API_VER}`;

async function listAdSets() {
  try {
    console.log(`🔍 Searching for Ad Sets in account ${AD_ACCOUNT_ID}...`);
    const url = `${BASE_URL}/${AD_ACCOUNT_ID}/adsets?fields=name,status,campaign{name}&limit=50&access_token=${ACCESS_TOKEN}`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.error('❌ API Error:', JSON.stringify(data.error, null, 2));
      return;
    }

    console.log('\n📋 Ad Sets Found:');
    if (data.data && data.data.length > 0) {
      data.data.forEach(adset => {
        console.log(`- Name: "${adset.name}" | ID: ${adset.id} | Status: ${adset.status} | Campaign: ${adset.campaign ? adset.campaign.name : 'N/A'}`);
      });
    } else {
      console.log('No Ad Sets found.');
    }

  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

listAdSets();
