require('dotenv').config();

const AD_ACCOUNT_ID = process.env.FACEBOOK_AD_ACCOUNT_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_USER_ACCESS_TOKEN; // 注意：广告通常需要用户令牌
const PAGE_ID = process.env.FACEBOOK_PAGE_ID;

if (!AD_ACCOUNT_ID || !ACCESS_TOKEN) {
  console.error('❌ 错误: 请在 .env 中配置 FACEBOOK_AD_ACCOUNT_ID 和 FACEBOOK_USER_ACCESS_TOKEN');
  console.log('提示: FACEBOOK_AD_ACCOUNT_ID 通常以 act_ 开头');
  process.exit(1);
}

const postId = process.argv[2];

if (!postId) {
  console.error('❌ 错误: 请提供要速推的帖子 ID');
  console.log('用法: node scripts/fb_boost_post.js <post_id>');
  process.exit(1);
}

const API_VER = 'v22.0';
const BASE_URL = `https://graph.facebook.com/${API_VER}`;

async function boostPost() {
  try {
    console.log(`🚀 开始速推帖子: ${postId}`);

    // 1. 创建广告系列 (Campaign)
    console.log('📦 正在创建广告系列 (Campaign)...');
    const campRes = await fetch(`${BASE_URL}/${AD_ACCOUNT_ID}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Boost Post - ${postId} - ${new Date().toISOString().split('T')[0]}`,
        objective: 'OUTCOME_AWARENESS', // 改为“知名度”目标，通常限制更少
        special_ad_categories: [], // 必须指定，普通广告为空数组
        status: 'PAUSED', // 默认暂停，防止误花钱
        is_adset_budget_sharing_enabled: false,
        access_token: ACCESS_TOKEN
      })
    });
    const campData = await campRes.json();
    if (campData.error) {
      console.error('❌ Campaign API Error Full:', JSON.stringify(campData.error, null, 2));
      throw new Error(`Campaign创建失败: ${campData.error.message}`);
    }
    const campaignId = campData.id;
    console.log(`✅ 广告系列已创建: ${campaignId}`);

    // 2. 创建广告组 (Ad Set)
    console.log('🎯 正在创建广告组 (Ad Set)...');
    const adSetRes = await fetch(`${BASE_URL}/${AD_ACCOUNT_ID}/adsets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Ad Set - ${postId}`,
        campaign_id: campaignId,
        daily_budget: 10000,
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'REACH', // 改为“覆盖人数”
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP', // 自动出价
        promoted_object: { page_id: PAGE_ID }, // 必须指定推广的主页 ID
        targeting: {
          geo_locations: { countries: ['MX'] }, // 默认投放墨西哥
          age_min: 18,
          age_max: 65,
          publisher_platforms: ['facebook'], // 仅限 Facebook
          facebook_positions: ['feed'],      // 仅限 Feed 信息流
        },
        status: 'PAUSED',
        access_token: ACCESS_TOKEN
      })
    });
    const adSetData = await adSetRes.json();
    if (adSetData.error) {
      console.error('❌ Ad Set API Error Full:', JSON.stringify(adSetData.error, null, 2));
      throw new Error(`Ad Set创建失败: ${adSetData.error.message}`);
    }
    const adSetId = adSetData.id;
    console.log(`✅ 广告组已创建: ${adSetId}`);

    // 3. 创建广告 (Ad) - 绑定现有帖子
    console.log('🖼️ 正在创建广告 (Ad)...');
    const adRes = await fetch(`${BASE_URL}/${AD_ACCOUNT_ID}/ads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Ad - ${postId}`,
        adset_id: adSetId,
        creative: {
          object_story_id: postId // 关键: 绑定现有帖子ID
        },
        status: 'PAUSED',
        access_token: ACCESS_TOKEN
      })
    });
    const adData = await adRes.json();
    if (adData.error) {
       console.error('❌ Ad API Error Full:', JSON.stringify(adData.error, null, 2));
       throw new Error(`Ad创建失败: ${adData.error.message}`);
    }
    
    console.log(`\n🎉 成功! 帖子已转换为广告。`);
    console.log(`广告 ID: ${adData.id}`);
    console.log(`管理链接: https://adsmanager.facebook.com/adsmanager/manage/ads?act=${AD_ACCOUNT_ID.replace('act_', '')}&selection_id=${adData.id}`);
    console.log(`⚠️ 注意: 广告默认为 [PAUSED] 暂停状态，请在后台检查并开启。`);

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  }
}

boostPost();
