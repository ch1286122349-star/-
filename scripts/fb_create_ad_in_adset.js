require('dotenv').config();

const AD_ACCOUNT_ID = process.env.FACEBOOK_AD_ACCOUNT_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_USER_ACCESS_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

if (!AD_ACCOUNT_ID || !ACCESS_TOKEN || !PAGE_ACCESS_TOKEN) {
  console.error('❌ Missing env vars: FACEBOOK_AD_ACCOUNT_ID, FACEBOOK_USER_ACCESS_TOKEN, or FACEBOOK_PAGE_ACCESS_TOKEN');
  process.exit(1);
}

const adSetId = process.argv[2];
const postId = process.argv[3];

if (!adSetId || !postId) {
  console.error('❌ Usage: node scripts/fb_create_ad_in_adset.js <ad_set_id> <post_id>');
  process.exit(1);
}

const API_VER = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${API_VER}`;

async function createAd() {
  try {
    console.log(`🚀 Preparing Ad for Post ${postId} in Ad Set ${adSetId}...`);

    // 1. Fetch Ad Set details to get Page ID and WhatsApp Number (if any)
    console.log('🔍 Fetching Ad Set details...');
    const adSetRes = await fetch(`${BASE_URL}/${adSetId}?fields=promoted_object,name&access_token=${ACCESS_TOKEN}`);
    const adSetData = await adSetRes.json();
    
    if (adSetData.error) throw new Error(`Ad Set fetch failed: ${adSetData.error.message}`);
    
    const pageId = adSetData.promoted_object?.page_id;
    const waNumber = adSetData.promoted_object?.whatsapp_phone_number;

    if (!pageId) throw new Error('Ad Set is missing promoted_object.page_id');
    console.log(`✅ Target Page ID: ${pageId}`);
    if (waNumber) console.log(`✅ Target WhatsApp: ${waNumber}`);

    // 2. Fetch original Post details (Message and Image URL)
    console.log('📦 Fetching original Post content...');
    // Use Page Token to ensure access to page content
    const postRes = await fetch(`${BASE_URL}/${postId}?fields=message,full_picture&access_token=${PAGE_ACCESS_TOKEN}`);
    const postData = await postRes.json();

    if (postData.error) throw new Error(`Post fetch failed: ${postData.error.message}`);
    
    const message = postData.message || '';
    const imageUrl = postData.full_picture;

    if (!imageUrl) throw new Error('Post does not have an image to use for the ad.');

    // 3. Skip Image Upload (Bypass API capability issue)
    // console.log('🖼️  Uploading image to Ad Library...'); 
    // Instead of uploading, we will use the URL directly in the creative

    // 4. Create Ad Creative with WhatsApp CTA
    console.log('🎨 Creating WhatsApp-compatible Ad Creative...');
    const creativePayload = {
      name: `Creative for Post ${postId}`,
      object_story_spec: {
        page_id: pageId,
        link_data: {
          message: message,
          picture: imageUrl, // Use URL directly instead of hash
          link: waNumber ? `https://wa.me/${waNumber}` : `https://facebook.com/${pageId}`, // Required for link_data
          call_to_action: {
            type: 'WHATSAPP_MESSAGE',
            value: {
              link: waNumber ? `https://wa.me/${waNumber}` : `https://facebook.com/${pageId}`
            }
          }
        }
      },
      access_token: ACCESS_TOKEN
    };

    const creativeRes = await fetch(`${BASE_URL}/${AD_ACCOUNT_ID}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creativePayload)
    });
    const creativeData = await creativeRes.json();
    if (creativeData.error) {
      console.error('❌ Creative API Error Full:', JSON.stringify(creativeData.error, null, 2));
      throw new Error(`Creative creation failed: ${creativeData.error.message}`);
    }
    
    const creativeId = creativeData.id;
    console.log(`✅ Creative ID: ${creativeId}`);

    // 5. Create the Ad
    console.log('🚀 Creating the Ad...');
    const adRes = await fetch(`${BASE_URL}/${AD_ACCOUNT_ID}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Ad from Post ${postId}`,
        adset_id: adSetId,
        creative: {
          creative_id: creativeId
        },
        status: 'PAUSED', // Create as paused
        access_token: ACCESS_TOKEN
      })
    });

    const adData = await adRes.json();

    if (adData.error) {
      console.error('❌ Ad API Error:', JSON.stringify(adData.error, null, 2));
      throw new Error(adData.error.message);
    }

    console.log(`\n🎉 Ad Created Successfully!`);
    console.log(`✅ Ad ID: ${adData.id}`);
    console.log(`🔗 Manage: https://adsmanager.facebook.com/adsmanager/manage/ads?act=${AD_ACCOUNT_ID.replace('act_', '')}&selection_id=${adData.id}`);

  } catch (error) {
    console.error('❌ Failed to create Ad:', error.message);
  }
}

createAd();
