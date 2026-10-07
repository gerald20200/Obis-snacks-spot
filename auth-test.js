const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const pin = 'test-pin';
const hash = crypto.scryptSync(pin, 'obi-snack-pin-salt', 64).toString('hex');
assert.match(hash, /^[a-f0-9]{128}$/);
assert.equal(crypto.scryptSync(pin, 'obi-snack-pin-salt', 64).toString('hex'), hash);
assert.notEqual(crypto.scryptSync('wrong', 'obi-snack-pin-salt', 64).toString('hex'), hash);
console.log('PIN hashing test passed.');
