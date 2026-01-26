require('dotenv').config();

const ACCESS_TOKEN = process.env.FACEBOOK_USER_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ Missing FACEBOOK_USER_ACCESS_TOKEN');
  process.exit(1);
}

const API_VER = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${API_VER}`;
const TARGET_ADSET_NAME = '海关问题';

async function findAdSetGlobally() {
  try {
    console.log('🔍 Fetching all ad accounts...');
    const accountsRes = await fetch(`${BASE_URL}/me/adaccounts?fields=name,account_id&limit=100&access_token=${ACCESS_TOKEN}`);
    const accountsData = await accountsRes.json();

    if (accountsData.error) {
      console.error('❌ Error fetching accounts:', accountsData.error.message);
      return;
    }

    const accounts = accountsData.data || [];
    console.log(`📋 Found ${accounts.length} accounts. Searching for Ad Set "${TARGET_ADSET_NAME}"...`);

    for (const acc of accounts) {
      const actId = `act_${acc.account_id}`;
      // console.log(`  Checking account: ${acc.name} (${actId})...`);
      
      try {
        const adsetsRes = await fetch(`${BASE_URL}/${actId}/adsets?fields=name,id,status&limit=50&access_token=${ACCESS_TOKEN}`);
        const adsetsData = await adsetsRes.json();
        
        if (adsetsData.data) {
          const found = adsetsData.data.find(as => as.name === TARGET_ADSET_NAME);
          if (found) {
            console.log(`\n🎉 FOUND IT!`);
            console.log(`✅ Ad Set Name: ${found.name}`);
            console.log(`✅ Ad Set ID:   ${found.id}`);
            console.log(`✅ Account Name: ${acc.name}`);
            console.log(`✅ Account ID:   ${actId}`);
            console.log(`✅ Status:       ${found.status}`);
            return; // Stop after finding the first match
          }
        }
      } catch (e) {
        // Ignore individual account errors (permissions etc)
      }
    }

    console.log(`\n❌ Could not find any Ad Set named "${TARGET_ADSET_NAME}" in any accessible account.`);

  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

findAdSetGlobally();
