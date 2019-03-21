// const mongodbUtil = require('../util/mongodbUtils');
// const setting = require('../setting');
// const dbRes = setting[setting.env].dbRes;
// const wyUtils = require('../util/wyUtils');
// const xlsx = require('node-xlsx');
// const fs = require('fs');
//
// let codes;
// let codeLock = false;
// let codeGrade = {
//     '一年级上': 0,
//     '一年级下': 0,
//     '二年级上': 1,
//     '二年级下': 2,
//     '三年级上': 3,
//     '三年级下': 4,
//     '四年级上': 5,
//     '四年级下': 6,
//     '五年级上': 7,
//     '五年级下': 8,
//     '六年级上': 9,
//     '六年级下': 10,
//     '七年级上': 11,
//     '七年级下': 12,
//     '八年级上': 13,
//     '八年级下': 14,
//     '九年级上': 15,
//     '九年级下': 16,
//     '九年级全一册': 15.5,
//     '高中英语1': 17,
//     '高中英语2': 17,
//     '高中英语3': 17,
//     '高中英语4': 18,
//     '高中英语5': 18,
//     '高中英语6': 18,
//     '高中英语7': 19,
//     '高中英语8': 19,
//     '高中英语9': 19,
//     '高中英语10': 19,
//     '高中英语11': 19,
//     '高一上': 17,
//     '高一下': 18,
//     '高二上': 19,
//     '高二下': 19,
//     '高三上': 19,
//     '高三下': 19
// };
//
// let specialCodes = {
//     1000000: '音标库',
//     1000001: '小道消息'
// };
// let code = {};
//
// code.freshCodes = function () {
//     codes = undefined;
//     codeLock = false;
// };
//
// code.onready = function () {
//     return new Promise((resolve, reject) => {
//         if (codeLock) {
//             wyUtils.sleep(200)
//                 .then(() => {
//                     code.onready()
//                         .then(res => {
//                             resolve(res);
//                         });
//                 });
//         } else {
//             if (codes) {
//                 resolve(true);
//             } else {
//                 codes = {};
//                 codeLock = true;
//                 let mkArr = function (obj, arr) {
//                     arr[obj.id] = obj;
//                     for (let son of obj.children) {
//                         mkArr(son, arr);
//                     }
//                 };
//
//                 mongodbUtil.read(dbRes, 'codes')
//                     .then(res => {
//                         for (let re of res) {
//                             codes[re.label] = re;
//                             codes[re.label + 'Arr'] = [];
//                             mkArr(codes[re.label], codes[re.label + 'Arr']);
//                         }
//                         codeLock = false;
//                         resolve(true);
//                     })
//                     .catch(err => {
//                         codeLock = false;
//                         reject(err);
//                     });
//             }
//         }
//     });
// };
//
// code.getCode = function (type) {
//     return codes[type];
// };
//
// /**
//  * 代码转标签
//  * @param type
//  * @param code
//  */
// code.code2labels = function (type, code) {
//     let result = codes[type + 'Arr'][code].label;
//     if (codes[type + 'Arr'][code].topic) {
//         let topic = [];
//         codes[type + 'Arr'][code].topic.forEach(t => {
//             topic.push(code.code2labels('topic', t));
//         });
//         result = result + '<br/>话题：' + topic.join('，');
//     }
//     while (codes[type + 'Arr'][code].fid > 0) {
//         code = codes[type + 'Arr'][code].fid;
//         result = codes[type + 'Arr'][code].label + '-' + result;
//     }
//     return result;
// };
//
// code.code2label = function (type, code) {
//     if (code in specialCodes) return specialCodes[code];
//     else return codes[type + 'Arr'][code].label;
// };
//
// /**
//  * 单个标签快速转代码，仅找到最先找到的那个，一般用于标签不重复的代码表
//  * @param type
//  * @param label
//  */
// code.label2code = function (type, label) {
//     let code;
//     for (let node of codes[type + 'Arr']) {
//         if (node.label === label) {
//             code = node.id;
//             break;
//         }
//     }
//     return code;
// };
//
// /**
//  * 标签组转代码，返回所有符合条件的结点代码
//  * @param type
//  * @param labelList
//  * @returns
//  */
// code.labels2code = function (type, labelList) {
//     let result = [];
//     let findElement = function (elements, sn) {
//         for (let item of elements) {
//             // 列表中可以短，并且忽略大小写，比如代码表里是：Unit 1 Hello Lingling. 查找时可以用Unit 1找到这个节点
//             if (item.label.substr(0, labelList[sn].length).toLowerCase() === labelList[sn].toLowerCase()) {
//                 if (sn > labelList.length - 2) {
//                     result.push(code.code2codes(type, item.id));
//                 } else {
//                     if (item.children) findElement(item.children, sn + 1);
//                 }
//             } else {
//                 // 当sn不等于0时，不能进入下一层，而是回退到上层
//                 if (sn === 0 && item.children) findElement(item.children, sn);
//             }
//         }
//     };
//     findElement(codes[type].children, 0);
//     return result;
// };
//
// /**
//  * 标签组转代码，返回所有符合条件的结点代码
//  * @param type
//  * @param labelList
//  * @returns
//  */
// code.code2codes = function (type, code) {
//     let item = codes[type + 'Arr'][code];
//     let single = [code];
//     let loop = true;
//     let temp = item;
//     while (loop) {
//         if (temp.fid > 0) {
//             temp = codes[type + 'Arr'][temp.fid];
//             single.unshift(temp.id);
//         } else {
//             loop = false;
//         }
//     }
//     return single;
// };
//
// code.code2grade = function (type, code) {
//     let label = codes[type + 'Arr'][code].label;
//     return codeGrade[label];
// };
//
// /**
//  * 从一个节点导出代码表的excel表
//  * @param type
//  * @param code
//  */
// code.code2excel = function (type, code) {
//     let excel = [];
//     let mkexcel = function (node, excel, line) {
//         let tempLine = line.slice();
//         tempLine.push(node.id);
//         tempLine.push(node.label);
//         if (node.children.length < 1) {
//             excel.push(tempLine);
//         } else {
//             for (let son of node.children) {
//                 mkexcel(son, excel, tempLine);
//             }
//         }
//     };
//
//     mkexcel(codes[type + 'Arr'][code], excel, []);
//     for (let i = excel.length - 1; i > 0; i--) {
//         for (let j = 0; j < excel[i].length; j++) {
//             if (excel[i][j] === excel[i - 1][j]) {
//                 excel[i][j] = null;
//             }
//         }
//     }
//     let buffer = xlsx.build([
//         {
//             name: 'sheet1',
//             data: excel
//         }
//     ]);
//     //TODO 存放位置，以及是不是要写入数据库，记到个人下载记录里，形成个人资源，反复下载
//     let filename = wyUtils.unicode(code);
//
//     fs.writeFileSync(filename + '.xlsx', buffer, {'flag': 'w'});   //生成excel
//
//     return filename;
// };
//
// /**
//  * 插入一个节点，way 0-当前节点的子节点（原先子节点为空），-1当前节点前，1当前节点后
//  * @param type
//  * @param code
//  * @param way
//  * @param label
//  */
// code.nodeAdd = function (type, nodeList) {
//     let result = [];
//     nodeList.forEach(value => {
//         let code = value[0];
//         let way = value[1];
//         let labels = value[2];
//
//         let node = codes[type + 'Arr'][code];
//         let newNodes = undefined;
//         if (node && (way === 0 || way === -1 || way === 1)) {
//             newNodes = [];
//             labels.forEach(label => {
//                 newNodes.push({label: label, id: 0, fid: -1, disabled: false, children: []});
//             });
//             if (way === 0) {
//                 if (node.children.length > 0) {
//                     newNodes = undefined;
//                 } else {
//                     newNodes.forEach(newNode => {
//                         codes[type + 'Arr'][0].idcount++;
//                         newNode.id = codes[type + 'Arr'][0].idcount;
//                         newNode.fid = node.id;
//                         node.children.push(newNode);
//                         codes[type + 'Arr'][newNode.id] = newNode;
//                     });
//                 }
//             } else {
//                 let children = codes[type + 'Arr'][node.fid].children;
//                 let site = -1;
//                 for (let i = 0; i < children.length; i++) {
//                     if (children[i].id === code) {
//                         site = i;
//                         break;
//                     }
//                 }
//                 if (site > -1) {
//                     if (way === 1) site++;
//                     newNodes.forEach(newNode => {
//                         codes[type + 'Arr'][0].idcount++;
//                         newNode.id = codes[type + 'Arr'][0].idcount;
//                         newNode.fid = node.fid;
//                         codes[type + 'Arr'][newNode.id] = newNode;
//                         children.splice(site, 0, newNode);
//                         site++;
//                     });
//                 }
//             }
//         }
//         result = result.concat(newNodes);
//     });
//     //TODO 暂时屏蔽，在没有防范措施前，防止误更新
//     //mongodbUtil.update('res', 'codes', {label: type}, codes[type]);
//     return result;
// };
//
// code.sort = function (type, c1, c2) {
//     let result = 0;
//     let len1 = c1.length;
//     let len2 = c2.length;
//     let len = (len1 > len2) ? len2 : len1;
//     let father = 0;
//     for (let i = 0; i < len; i++) {
//         if (c1[i] !== c2[i]) {
//             let children = codes[type + 'Arr'][father].children;
//             let site1 = -1;
//             let site2 = -1;
//             for (let j = 0; j < children.length; j++) {
//                 if (site1 < 0 && children[j].id === c1[i]) site1 = j;
//                 else if (site2 < 0 && children[j].id === c2[i]) site2 = j;
//             }
//             result = site1 - site2;
//             break;
//         } else {
//             father = c1[i];
//         }
//     }
//     if (!result) result = len1 - len2;
//     return result;
// };
//
// module.exports = code;
