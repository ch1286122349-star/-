const imaps = require('imap-simple');
require('dotenv').config();

// IMAP 配置
const imapConfig = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: process.env.EMAIL_IMAP_HOST,
    port: parseInt(process.env.EMAIL_IMAP_PORT),
    tls: false, // 端口 143 不使用 TLS
    authTimeout: 30000
  }
};

/**
 * 连接到邮箱
 * @returns {Promise} IMAP 连接
 */
async function connectToEmail() {
  try {
    const connection = await imaps.connect(imapConfig);
    console.log('邮箱连接成功');
    return connection;
  } catch (error) {
    console.error('邮箱连接失败:', error);
    throw error;
  }
}

/**
 * 获取收件箱邮件列表
 * @param {number} limit - 获取邮件数量限制
 * @returns {Promise} 邮件列表
 */
async function getInboxEmails(limit = 10) {
  try {
    const connection = await connectToEmail();
    
    // 选择收件箱
    await connection.openBox('INBOX');
    
    // 搜索最近的邮件
    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      struct: true
    };
    
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    // 限制邮件数量
    const limitedMessages = messages.slice(-limit);
    
    // 解析邮件信息
    const emails = limitedMessages.map(message => {
      const header = message.parts.find(part => part.which === 'HEADER');
      const body = message.parts.find(part => part.which === 'TEXT');
      
      return {
        uid: message.attributes.uid,
        date: new Date(message.attributes.date),
        subject: header.body.subject ? header.body.subject[0] : '(无主题)',
        from: header.body.from ? header.body.from[0] : '(未知发件人)',
        to: header.body.to ? header.body.to[0] : '(未知收件人)',
        body: body ? body.body : '',
        seen: message.attributes.flags.includes('\\Seen'),
        attachments: message.attributes.struct ? message.attributes.struct.some(part => part.subtype === 'OCTET-STREAM') : false
      };
    });
    
    connection.end();
    return emails.reverse(); // 最新的在前面
  } catch (error) {
    console.error('获取邮件失败:', error);
    throw error;
  }
}

/**
 * 获取未读邮件
 * @returns {Promise} 未读邮件列表
 */
async function getUnreadEmails() {
  try {
    const connection = await connectToEmail();
    
    await connection.openBox('INBOX');
    
    // 搜索未读邮件
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      struct: true
    };
    
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    const emails = messages.map(message => {
      const header = message.parts.find(part => part.which === 'HEADER');
      const body = message.parts.find(part => part.which === 'TEXT');
      
      return {
        uid: message.attributes.uid,
        date: new Date(message.attributes.date),
        subject: header.body.subject ? header.body.subject[0] : '(无主题)',
        from: header.body.from ? header.body.from[0] : '(未知发件人)',
        to: header.body.to ? header.body.to[0] : '(未知收件人)',
        body: body ? body.body : '',
        attachments: message.attributes.struct ? message.attributes.struct.some(part => part.subtype === 'OCTET-STREAM') : false
      };
    });
    
    connection.end();
    return emails;
  } catch (error) {
    console.error('获取未读邮件失败:', error);
    throw error;
  }
}

/**
 * 标记邮件为已读
 * @param {number} uid - 邮件 UID
 * @returns {Promise} 操作结果
 */
async function markAsRead(uid) {
  try {
    const connection = await connectToEmail();
    await connection.openBox('INBOX');
    
    await connection.addFlags(uid, ['\\Seen']);
    
    connection.end();
    return { success: true };
  } catch (error) {
    console.error('标记邮件失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 搜索邮件
 * @param {string} query - 搜索关键词
 * @param {string} searchIn - 搜索范围 ('SUBJECT', 'BODY', 'FROM', 'TO')
 * @returns {Promise} 搜索结果
 */
async function searchEmails(query, searchIn = 'SUBJECT') {
  try {
    const connection = await connectToEmail();
    await connection.openBox('INBOX');
    
    const searchCriteria = [searchIn, query];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      struct: true
    };
    
    const messages = await connection.search(searchCriteria, fetchOptions);
    
    const emails = messages.map(message => {
      const header = message.parts.find(part => part.which === 'HEADER');
      const body = message.parts.find(part => part.which === 'TEXT');
      
      return {
        uid: message.attributes.uid,
        date: new Date(message.attributes.date),
        subject: header.body.subject ? header.body.subject[0] : '(无主题)',
        from: header.body.from ? header.body.from[0] : '(未知发件人)',
        to: header.body.to ? header.body.to[0] : '(未知收件人)',
        body: body ? body.body : '',
        seen: message.attributes.flags.includes('\\Seen')
      };
    });
    
    connection.end();
    return emails.reverse();
  } catch (error) {
    console.error('搜索邮件失败:', error);
    throw error;
  }
}

/**
 * 测试邮箱连接
 */
async function testConnection() {
  try {
    const emails = await getInboxEmails(1);
    console.log('邮箱连接测试成功，获取到最新邮件');
    return { success: true, count: emails.length };
  } catch (error) {
    console.error('邮箱连接测试失败:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  connectToEmail,
  getInboxEmails,
  getUnreadEmails,
  markAsRead,
  searchEmails,
  testConnection
};
