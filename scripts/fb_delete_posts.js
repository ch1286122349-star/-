require('dotenv').config();

const ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ 请在 .env 中设置 FACEBOOK_PAGE_ACCESS_TOKEN');
  process.exit(1);
}

const postIds = process.argv.slice(2);

if (postIds.length === 0) {
  console.error('❌ 请至少提供一个要删除的帖子 ID');
  console.log('用法: node scripts/fb_delete_posts.js <post_id> [<post_id> ...]');
  process.exit(1);
}

async function deletePost(postId) {
  const url = `https://graph.facebook.com/v22.0/${postId}`;

  try {
    const res = await fetch(`${url}?access_token=${ACCESS_TOKEN}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (data.success) {
      console.log(`✅ 已删除帖子 ${postId}`);
    } else {
      throw new Error(JSON.stringify(data));
    }
  } catch (error) {
    console.error(`❌ 删除帖子 ${postId} 失败:`, error.message);
  }
}

(async () => {
  console.log('🗑️ 正在删除帖子...');
  for (const id of postIds) {
    await deletePost(id);
  }
  console.log('🗑️ 删除操作完成');
})();
