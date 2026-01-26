const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('--- .env 文件变量名检查 ---');
  const lines = envContent.split('\n');
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      if (parts.length > 0) {
        console.log(`第 ${index + 1} 行检测到变量: ${parts[0].trim()}`);
      }
    }
  });
} catch (error) {
  console.error('❌ 无法读取 .env 文件:', error.message);
}
