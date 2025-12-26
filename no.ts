import crypto from 'crypto';

console.log(crypto.createHash('sha256').update(crypto.randomBytes(15).toString('hex')).digest('hex'));