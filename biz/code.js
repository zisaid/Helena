const mongodb = require('../utils/mongodb');

let codes;
let codeLock = false;

let db = 'res';
let table = 'codes';

let code = {};

code.BEFORE = -1;
code.AFTER = 1;
code.SON = 0;

code.init = function (codeDb, codeTable) {
    db = codeDb;
    table = codeTable;
};

code.freshCodes = function () {
    codes = undefined;
    codeLock = false;
};

code.onReady = function () {
    return new Promise((resolve, reject) => {
        if (codeLock) {
            sleep(200)
                .then(() => {
                    code.onReady()
                        .then(res => {
                            resolve(res);
                        });
                });
        } else {
            if (codes) {
                resolve(true);
            } else {
                codeLock = true;
                let mkArr = function (obj, arr) {
                    arr[obj.id] = obj;
                    for (let son of obj.children) {
                        mkArr(son, arr);
                    }
                };

                mongodb.read(db, table)
                    .then(res => {
                        for (let re of res) {
                            codes[re.label] = re;
                            codes[re.label + 'Arr'] = [];
                            mkArr(codes[re.label], codes[re.label + 'Arr']);
                        }
                        codeLock = false;
                        resolve(true);
                    })
                    .catch(err => {
                        codeLock = false;
                        reject(err);
                    });
            }
        }
    });
};

code.getCode = function (type) {
    return codes[type];
};

/**
 * 代码转标签
 * @param type
 * @param code
 */
code.code2labels = function (type, code) {
    let result = codes[type + 'Arr'][code].label;
    while (codes[type + 'Arr'][code].fid > 0) {
        code = codes[type + 'Arr'][code].fid;
        result = codes[type + 'Arr'][code].label + '-' + result;
    }
    return result;
};

code.code2label = function (type, code) {
    return codes[type + 'Arr'][code].label;
};

/**
 * 单个标签快速转代码，仅找到最先找到的那个，一般用于标签不重复的代码表
 * @param type
 * @param label
 */
code.label2code = function (type, label) {
    let code;
    for (let node of codes[type + 'Arr']) {
        if (node.label === label) {
            code = node.id;
            break;
        }
    }
    return code;
};

/**
 * 标签组转代码，返回所有符合条件的结点代码
 * @param type
 * @param labelList
 * @returns
 */
code.labels2code = function (type, labelList) {
    let result = [];
    let findElement = function (elements, sn) {
        for (let item of elements) {
            if (item.label.toLowerCase() === labelList[sn].toLowerCase()) {
                if (sn > labelList.length - 2) {
                    result.push(code.code2codes(type, item.id));
                } else {
                    if (item.children) findElement(item.children, sn + 1);
                }
            } else {
                // 当sn不等于0时，不能进入下一层，而是回退到上层
                if (sn === 0 && item.children) findElement(item.children, sn);
            }
        }
    };
    findElement(codes[type].children, 0);
    return result;
};

code.code2codes = function (type, code) {
    let item = codes[type + 'Arr'][code];
    let single = [code];
    let loop = true;
    let temp = item;
    while (loop) {
        if (temp.fid > 0) {
            temp = codes[type + 'Arr'][temp.fid];
            single.unshift(temp.id);
        } else {
            loop = false;
        }
    }
    return single;
};

code.sort = function (type, c1, c2) {
    let result = 0;
    let len1 = c1.length;
    let len2 = c2.length;
    let len = (len1 > len2) ? len2 : len1;
    let father = 0;
    for (let i = 0; i < len; i++) {
        if (c1[i] !== c2[i]) {
            let children = codes[type + 'Arr'][father].children;
            let site1 = -1;
            let site2 = -1;
            for (let j = 0; j < children.length; j++) {
                if (site1 < 0 && children[j].id === c1[i]) site1 = j;
                else if (site2 < 0 && children[j].id === c2[i]) site2 = j;
            }
            result = site1 - site2;
            break;
        } else {
            father = c1[i];
        }
    }
    if (!result) result = len1 - len2;
    return result;
};

code.save2db = function (type) {
    mongodb.update(db, table, {label: type}, codes[type]);
};

code.moveSubtree = function (type, nodeCode, toCode, way) {
    let result = false;
    let codesType = codes[type + 'Arr'];
    //要做为某个节点的子节点移入，这个节点的子节点必须为空。如果不空，需要用节点前或后的方式
    if (way > 0 || codesType[toCode].children.length < 1) {
        //从原父节点断开
        let fatherCode = codesType[nodeCode].fid;
        let site = -1;
        for (let i = 0; i < codesType[fatherCode].children.length; i++) {
            if (codesType[fatherCode].children[i].id === nodeCode) {
                site = i;
                break;
            }
        }
        if (site > -1) codesType[fatherCode].children.splice(site, 1);
        //连接新的父结点
        if(way === 0) {
            codesType[nodeCode].fid = toCode;
            codesType[toCode].children.push(codesType[nodeCode]);
        } else {
            codesType[nodeCode].fid = codesType[toCode].fid;
            if(way > 0) site++;
            codesType[fatherCode].children.splice(site, 0, codesType[nodeCode]);
        }
        result = true;
    }
    return result;
};


module.exports = code;

function sleep(time = 1000) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}
