require('dotenv').config();

const ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error('❌ 错误: 未找到 FACEBOOK_PAGE_ACCESS_TOKEN');
  process.exit(1);
}

async function debugToken() {
  try {
    console.log('🔍 正在诊断 Token...');

    // 1. 检查 Token 代表的对象 (User 还是 Page?)
    const meRes = await fetch(`https://graph.facebook.com/v22.0/me?access_token=${ACCESS_TOKEN}`);
    const meData = await meRes.json();

    if (meData.error) {
      console.error('❌ Token 无效:', meData.error.message);
      return;
    }

    console.log('\n--- 身份信息 ---');
    console.log(`ID: ${meData.id}`);
    console.log(`Name: ${meData.name}`);
    
    // 如果没有 metadata 字段分辨，通常可以通过查看 permissions 来辅助，或者看 access_token 的获取方式
    // 但最直接的是看 /me 的结果。如果是 Page Token，这里显示的应该是 Page 的名字。
    
    // 2. 检查权限
    const permRes = await fetch(`https://graph.facebook.com/v22.0/me/permissions?access_token=${ACCESS_TOKEN}`);
    const permData = await permRes.json();

    console.log('\n--- 拥有权限 ---');
    if (permData.data) {
      const permissions = permData.data.map(p => p.permission);
      console.log(permissions.join(', '));

      const required = ['pages_manage_posts', 'pages_read_engagement'];
      const missing = required.filter(p => !permissions.includes(p) && !permissions.includes('manage_pages')); // manage_pages 是旧版但也可能有效
      
      if (missing.length > 0) {
        console.log(`\n⚠️  警告: 缺少关键权限: ${missing.join(', ')}`);
      } else {
        console.log('\n✅ 关键权限看起来已就绪');
      }
    } else {
      console.log('无法获取权限列表 (可能是 Page Token，Page Token 不直接返回 permissions 端点，这是正常的)');
    }

    // 3. 如果是 User Token，尝试列出 Accounts 帮助用户找到正确的 Page Token
    if (permData.data) { // 只有 User Token 才有 /permissions 端点
        console.log('\n💡 检测到这可能是一个 [User Token] (用户令牌)。');
        console.log('❌ 发帖需要使用 [Page Token] (主页令牌)。');
        console.log('正在尝试获取你的主页 Token...');
        
        const accountsRes = await fetch(`https://graph.facebook.com/v22.0/me/accounts?access_token=${ACCESS_TOKEN}`);
        const accountsData = await accountsRes.json();
        
        if (accountsData.data && accountsData.data.length > 0) {
            console.log('\n请使用以下 Token 之一替换 .env 中的 FACEBOOK_PAGE_ACCESS_TOKEN:');
            accountsData.data.forEach(page => {
                console.log(`\n📄 主页: ${page.name} (ID: ${page.id})`);
                console.log(`🔑 Token: ${page.access_token}`);
            });
        } else {
            console.log('\n❌ 未找到任何主页。请确认你是否创建了主页。');
        }
    } else {
        console.log('\n✅ 这看起来像是一个 [Page Token]。如果发帖仍然失败，请检查主页设置。');
    }

  } catch (error) {
    console.error('诊断脚本错误:', error.message);
  }
}

debugToken();
