require('dotenv').config();

console.log('--- Environment Variable Debug ---');
console.log('Checking for FACEBOOK_PAGE_ID...');
if (process.env.FACEBOOK_PAGE_ID) {
    console.log(`✅ FACEBOOK_PAGE_ID exists. Length: ${process.env.FACEBOOK_PAGE_ID.length}`);
    console.log(`First 3 chars: ${process.env.FACEBOOK_PAGE_ID.substring(0, 3)}`);
} else {
    console.log('❌ FACEBOOK_PAGE_ID is missing or empty.');
}

console.log('Checking for FACEBOOK_PAGE_ACCESS_TOKEN...');
if (process.env.FACEBOOK_PAGE_ACCESS_TOKEN) {
    console.log(`✅ FACEBOOK_PAGE_ACCESS_TOKEN exists. Length: ${process.env.FACEBOOK_PAGE_ACCESS_TOKEN.length}`);
    console.log(`First 5 chars: ${process.env.FACEBOOK_PAGE_ACCESS_TOKEN.substring(0, 5)}`);
} else {
    console.log('❌ FACEBOOK_PAGE_ACCESS_TOKEN is missing or empty.');
}

console.log('\n--- All keys in process.env containing "FACEBOOK" ---');
Object.keys(process.env).forEach(key => {
    if (key.includes('FACEBOOK')) {
        console.log(`- ${key}`);
    }
});
