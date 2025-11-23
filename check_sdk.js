const sdk = require('@directus/sdk');
console.log('Exports:', Object.keys(sdk).filter(k => k.includes('Policy') || k.includes('Permission') || k.includes('Role') || k.includes('User')));
