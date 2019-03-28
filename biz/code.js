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
                codes = {};
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
 * @param nodeCode
 */
code.code2labels = function (type, nodeCode) {
    let result = codes[type + 'Arr'][nodeCode].label;
    while (codes[type + 'Arr'][nodeCode].fid > 0) {
        nodeCode = codes[type + 'Arr'][nodeCode].fid;
        result = codes[type + 'Arr'][nodeCode].label + '-' + result;
    }
    return result;
};

code.code2label = function (type, nodeCode) {
    return codes[type + 'Arr'][nodeCode].label;
};

/**
 * 单个标签快速转代码，仅找到最先找到的那个，一般用于标签不重复的代码表
 * @param type
 * @param label
 */
code.label2code = function (type, label) {
    let nodeCode;
    for (let node of codes[type + 'Arr']) {
        if (node.label === label) {
            nodeCode = node.id;
            break;
        }
    }
    return nodeCode;
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

code.code2codes = function (type, nodeCode) {
    let item = codes[type + 'Arr'][nodeCode];
    let single = [nodeCode];
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
    let result = false;
    if (codes[type]) {
        mongodb.update(db, table, {label: type}, codes[type]);
        result = true;
    }
    return result;
};

code.create = function (type) {
    let result = false;
    if (!codes[type]) {
        codes[type] = {
            'label': type,
            'id': 0,
            'fid': -1,
            'idcount': 0,
            'disabled': false,
            'children': []
        };
        codes[type + 'Arr'] = [];
        codes[type + 'Arr'].push(codes[type]);
        code.save2db(type);
        result = true;
    }
    if (result) result = codes[type];
    return result;
};

code.modifyLabel = function (type, nodeCode, label) {
    let result = false;
    if (nodeCode > 0 && codes[type + 'Arr'] && codes[type + 'Arr'][nodeCode]) {
        codes[type + 'Arr'][nodeCode].label = label;
        code.save2db(type);
        result = true;
    }
    if (result) result = codes[type];
    return result;
};

code.moveSubtree = function (type, nodeCode, toNodeCode, way) {
    let result = false;
    let codesType = codes[type + 'Arr'];
    //要做为某个节点的子节点移入，这个节点的子节点必须为空。如果不空，需要用节点前或后的方式
    if (nodeCode > 0 && toNodeCode > 0
        && codesType && codesType[nodeCode] && codesType[toNodeCode]
        && (way === code.SON || way === code.AFTER || way === code.BEFORE)
        && (way !== code.SON || codesType[toNodeCode].children.length < 1)) {
        //从原父节点断开
        let fatherCode = codesType[nodeCode].fid;
        if (fatherCode > -1) {
            let site = -1;
            for (let i = 0; i < codesType[fatherCode].children.length; i++) {
                if (codesType[fatherCode].children[i].id === nodeCode) {
                    site = i;
                    break;
                }
            }
            if (site > -1) codesType[fatherCode].children.splice(site, 1);
            //连接新的父结点
            if (way === code.SON) {
                codesType[nodeCode].fid = toNodeCode;
                codesType[toNodeCode].children.push(codesType[nodeCode]);
            } else {
                fatherCode = codesType[toNodeCode].fid;
                codesType[nodeCode].fid = fatherCode;
                site = - 1;
                for (let i = 0; i < codesType[fatherCode].children.length; i++) {
                    if (codesType[fatherCode].children[i].id === toNodeCode) {
                        site = i;
                        break;
                    }
                }
                if (way === code.AFTER) site++;
                codesType[fatherCode].children.splice(site, 0, codesType[nodeCode]);
            }
            result = true;
            code.save2db(type);
        }
    }
    if (result) result = codes[type];
    return result;
};

code.copySubtree = function (type, nodeCode, toNodeCode, way) {
    let result = false;
    let codesType = codes[type + 'Arr'];
    //要做为某个节点的子节点移入，这个节点的子节点必须为空。如果不空，需要用节点前或后的方式
    if (nodeCode > 0 && toNodeCode > 0
        && codesType && codesType[nodeCode] && codesType[toNodeCode]
        && (way === code.SON || way === code.AFTER || way === code.BEFORE)
        && (way !== code.SON || codesType[toNodeCode].children.length < 1)) {
        let copy = function (from, fid) {
            codesType[0].idcount++;
            let to = {};
            to.id = codesType[0].idcount;
            to.fid = fid;
            to.disabled = false;
            to.label = from.label;
            to.children = [];
            from.children.forEach(son => {
                let sonNode = copy(son, to.id);
                to.children.push(sonNode);
            });
            codesType[to.id] = to;
            return to;
        };
        let newNode = copy(codesType[nodeCode], 0);
        newNode.label = '<副本>' + newNode.label;
        if (way === code.SON) {
            newNode.fid = codesType[toNodeCode].id;
            codesType[toNodeCode].children.push(newNode);
        } else {
            newNode.fid = codesType[toNodeCode].fid;
            let children = codesType[newNode.fid].children;
            let site = -1;
            for (let i = 0; i < children.length; i++) {
                if (children[i].id === toNodeCode) {
                    site = i;
                    break;
                }
            }
            if (site > -1) {
                if (way === code.AFTER) site++;
                children.splice(site, 0, newNode);
            }
        }
        result = true;
        code.save2db(type);
    }
    if (result) result = codes[type];
    return result;
};

code.changeSubtreeDisabledValue = function (type, nodeCode, disabled) {
    let result = false;
    let codesType = codes[type + 'Arr'];
    let f = function (type, node, disabled) {
        node.disabled = disabled;
        node.children.forEach(sonNode => {
            f(type, sonNode, disabled);
        });
    };
    if (codesType && codesType[nodeCode]) {
        f(type, codesType[nodeCode], disabled);
        code.save2db(type);
        result = true;
    }
    if (result) result = codes[type];
    return result;
};

code.addSubtree = function (type, labelList, toNodeCode, way) {
    let result = false;
    if (codes[type + 'Arr'] && codes[type + 'Arr'][toNodeCode]
        && (way === code.SON || way === code.AFTER || way === code.BEFORE)
        && (way !== code.SON || codes[type + 'Arr'][toNodeCode].children.length < 1)) {
        let node = codes[type + 'Arr'][toNodeCode];
        let newNodes = [];
        labelList.forEach(label => {
            newNodes.push({label: label, id: 0, fid: -1, disabled: false, children: []});
        });
        if (way === code.SON) {
            newNodes.forEach(newNode => {
                codes[type + 'Arr'][0].idcount++;
                newNode.id = codes[type + 'Arr'][0].idcount;
                newNode.fid = node.id;
                node.children.push(newNode);
                codes[type + 'Arr'][newNode.id] = newNode;
            });
            code.save2db(type);
            result = true;
        } else {
            if (node.fid > -1) {
                let children = codes[type + 'Arr'][node.fid].children;
                let site = -1;
                for (let i = 0; i < children.length; i++) {
                    if (children[i].id === toNodeCode) {
                        site = i;
                        break;
                    }
                }
                if (site > -1) {
                    if (way === code.AFTER) site++;
                    newNodes.forEach(newNode => {
                        codes[type + 'Arr'][0].idcount++;
                        newNode.id = codes[type + 'Arr'][0].idcount;
                        newNode.fid = node.fid;
                        codes[type + 'Arr'][newNode.id] = newNode;
                    });
                    children.splice(site, 0, ...newNodes);
                    code.save2db(type);
                    result = true;
                }
            }
        }
    }
    if (result) result = codes[type];
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
