let crypto = require('crypto');

let sid =   '9vApxLk5G3PAsJrM9vApxLktDzjqWjcd';
console.log(sid.length);
const key = sid.substr(0, 24);
const iv = sid.substr(15, 16);

let cipher = crypto.createCipheriv('aes192', key,iv);
let enc = cipher.update('你说说你说说say say', 'utf8', 'hex');//编码方式从utf-8转为hex;
enc += cipher.final('hex');//编码方式从转为hex;
console.log('加密：', enc);
let decipher = crypto.createDecipheriv('aes192', key,iv);
let dec = decipher.update('bc825ba6b483722179b66bd5ad256919', 'hex', 'utf8');//编码方式从hex转为utf-8;
dec += decipher.final('utf8');//编码方式从utf-8;
console.log('解密：', dec);
