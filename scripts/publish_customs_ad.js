require('dotenv').config();
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const AD_SET_ID = '120238030169510396'; // "海关问题" Ad Set ID
const API_VER = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${API_VER}`;

// --- Credentials ---
const AD_ACCOUNT_ID = process.env.FACEBOOK_AD_ACCOUNT_ID;
const USER_TOKEN = process.env.FACEBOOK_USER_ACCESS_TOKEN;
const PAGE_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.FACEBOOK_PAGE_ID;

if (!AD_ACCOUNT_ID || !USER_TOKEN || !PAGE_TOKEN || !PAGE_ID) {
  console.error('❌ Missing required environment variables in .env');
  process.exit(1);
}

// --- Inputs Parsing ---
// Usage: node script.js "Caption" img1.jpg img2.jpg ...
const args = process.argv.slice(2);
let caption = '';
const imagePaths = [];

args.forEach(arg => {
  if (fs.existsSync(arg)) {
    imagePaths.push(arg);
  } else {
    // Assume it's the caption (or part of it, though quotes handle that)
    if (!caption) caption = arg;
  }
});

if (imagePaths.length === 0 || !caption) {
  console.error('❌ Usage: node scripts/publish_customs_ad.js "Your Caption" <image_path_1> [image_path_2] ...');
  process.exit(1);
}

// Helper: Upload Photo to Page (unpublished) to get ID
async function uploadPagePhoto(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer]);
  const formData = new FormData();
  formData.append('access_token', PAGE_TOKEN);
  formData.append('published', 'false'); // Important: Do not publish yet
  formData.append('source', blob, path.basename(filePath));

  const res = await fetch(`${BASE_URL}/${PAGE_ID}/photos`, { method: 'POST', body: formData });
  const data = await res.json();
  if (data.error) throw new Error(`Page photo upload failed: ${data.error.message}`);
  return data.id;
}

// Helper: Upload Image to Ad Account Library to get Hash
async function uploadAdImage(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  // Ad Images endpoint requires 'bytes' as base64 for direct upload or file upload
  // Easiest is usually bytes=BASE64_STRING
  const base64Content = fileBuffer.toString('base64');
  
  const res = await fetch(`${BASE_URL}/${AD_ACCOUNT_ID}/adimages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bytes: base64Content,
      filename: path.basename(filePath),
      access_token: USER_TOKEN
    })
  });
  
  const data = await res.json();
  if (data.error) throw new Error(`Ad Image upload failed: ${data.error.message}`);
  
  // Response format: { images: { "filename": { hash: "...", url: "..." } } }
  const values = Object.values(data.images || {});
  if (!values.length) throw new Error('No image hash returned.');
  return values[0].hash;
}

async function run() {
  try {
    console.log(`🚀 Starting Ad Workflow with ${imagePaths.length} images...`);

    // --- Step 1: Organic Post (Page) ---
    console.log(`\n📤 Step 1: Creating Organic Post on Page...`);
    
    // Upload all photos as unpublished first
    const mediaIds = [];
    for (const imgPath of imagePaths) {
      console.log(`   Uploading to Page: ${path.basename(imgPath)}...`);
      const id = await uploadPagePhoto(imgPath);
      mediaIds.push({ media_fbid: id });
    }

    // Publish the Feed Post
    console.log('   Publishing Feed Post...');
    const postRes = await fetch(`${BASE_URL}/${PAGE_ID}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: caption,
        attached_media: mediaIds,
        access_token: PAGE_TOKEN
      })
    });
    const postData = await postRes.json();
    if (postData.error) throw new Error(`Feed post failed: ${postData.error.message}`);
    const postId = postData.id;
    console.log(`✅ Post published! ID: ${postId}`);


    // --- Step 2: Ad Configuration ---
    console.log(`\n🔍 Step 2: Fetching Ad Set Config...`);
    const adSetRes = await fetch(`${BASE_URL}/${AD_SET_ID}?fields=promoted_object&access_token=${USER_TOKEN}`);
    const adSetData = await adSetRes.json();
    if (adSetData.error) throw new Error(`Ad Set fetch failed: ${adSetData.error.message}`);
    
    const waNumber = adSetData.promoted_object?.whatsapp_phone_number;
    const targetLink = waNumber ? `https://wa.me/${waNumber}` : `https://facebook.com/${PAGE_ID}`;


    // --- Step 3: Create Ad Creative ---
    console.log(`\n🎨 Step 3: Creating Ad Creative...`);
    let creativePayload = {};

    if (imagePaths.length > 1) {
      // --- CAROUSEL CREATIVE ---
      console.log('   Detected multiple images. Creating Carousel format...');
      const attachments = [];
      
      for (const [index, imgPath] of imagePaths.entries()) {
        console.log(`   Uploading to Ad Library: ${path.basename(imgPath)}...`);
        const hash = await uploadAdImage(imgPath);
        
        attachments.push({
          link: targetLink,
          image_hash: hash,
          name: index === 0 ? "Buscamos Proveedor" : "Detalles Técnicos", // Simple headlines
          description: index === 0 ? "Monterrey" : "Ver Planos",
          call_to_action: {
            type: 'WHATSAPP_MESSAGE',
            value: { link: targetLink }
          }
        });
      }

      creativePayload = {
        name: `Carousel Creative - ${postId}`,
        object_story_spec: {
          page_id: PAGE_ID,
          link_data: {
            link: targetLink,
            message: caption,
            child_attachments: attachments,
            multi_share_optimized: true
          }
        },
        access_token: USER_TOKEN
      };

    } else {
      // --- SINGLE IMAGE CREATIVE ---
      console.log('   Single image detected. Creating Standard format...');
      // For single image, we can just use the hash from ad library too for consistency
      const hash = await uploadAdImage(imagePaths[0]);
      
      creativePayload = {
        name: `Creative - ${postId}`,
        object_story_spec: {
          page_id: PAGE_ID,
          link_data: {
            message: caption,
            image_hash: hash,
            link: targetLink,
            call_to_action: {
              type: 'WHATSAPP_MESSAGE',
              value: { link: targetLink }
            }
          }
        },
        access_token: USER_TOKEN
      };
    }

    // Submit Creative
    const creativeRes = await fetch(`${BASE_URL}/${AD_ACCOUNT_ID}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creativePayload)
    });
    const creativeData = await creativeRes.json();
    if (creativeData.error) {
      console.error('❌ Creative Error:', JSON.stringify(creativeData.error, null, 2));
      throw new Error(`Creative creation failed: ${creativeData.error.message}`);
    }
    const creativeId = creativeData.id;
    console.log(`✅ Creative created! ID: ${creativeId}`);


    // --- Step 4: Create Ad ---
    console.log(`\n🚀 Step 4: Creating the Ad...`);
    const adRes = await fetch(`${BASE_URL}/${AD_ACCOUNT_ID}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Ad - Welding - ${postId}`,
        adset_id: AD_SET_ID,
        creative: { creative_id: creativeId },
        status: 'PAUSED',
        access_token: USER_TOKEN
      })
    });
    const adData = await adRes.json();

    if (adData.error) throw new Error(`Ad creation failed: ${adData.error.message}`);

    console.log(`\n🎉 SUCCESS! Ad created successfully.`);
    console.log(`🆔 Ad ID: ${adData.id}`);
    console.log(`🔗 Link: https://adsmanager.facebook.com/adsmanager/manage/ads?act=${AD_ACCOUNT_ID.replace('act_', '')}&selection_id=${adData.id}`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

run();
