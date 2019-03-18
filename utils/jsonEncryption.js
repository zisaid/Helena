let crypto = require('crypto');

module.exports = {
    pluginId: 'jsonEncryption',
    jsonEncryption: function (req) {
        let key, iv;
        if(req.query.sid && req.query.sid.length > 31){
            key = req.query.sid.substr(0, 24);
            iv = req.query.sid.substr(15, 16);
        }
        this.jsonEncryption = function (json) {
            if(key && iv) {
                let cipher = crypto.createCipheriv('aes192', key, iv);
                let enc = cipher.update(json, 'utf8', 'hex');//编码方式从utf-8转为hex;
                json = enc + cipher.final('hex');//编码方式从转为hex;
            } else {
                json = '';
            }
            return json;
        };
    }
};
