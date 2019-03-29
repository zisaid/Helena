const fs = require('fs');
const path = require('path');

let memLog = {};
let basePath = '/data/systemdata/logs';

let log = {};

let mkDirs = function (dirPath) {
    if (!fs.existsSync(dirPath)) {
        mkDirs(path.dirname(dirPath));
        fs.mkdirSync(dirPath);
    }
};

let makePath = function (prePath, appid, userid, type) {
    userid = userid.toString();
    let temp = '0000' + userid;
    return path.normalize(`${prePath}/${appid}/`
        + temp.substr(temp.length - 3, 3) + '/'
        + userid + '/'
        + type + '/');
};

let getAllFiles = function (dirPath, files = []) {
    if(fs.existsSync(dirPath)) {
        let dir = fs.readdirSync(dirPath);
        dir.forEach(value => {
            let p = path.format({root: dirPath, base: value});
            let stat = fs.statSync(p);
            if (!stat.isDirectory()) files.push(p);
        });
    }
    return files;
};

log.save = function (appid, userid, type, info, req) {
    let ip = '';
    try {
        ip = req.ip
            || req.headers['x-forwarded-for']
            || req.connection.remoteAddress
            || req.socket.remoteAddress
            || req.connection.socket.remoteAddress
            || req.headers['remote_addr']
            || req.headers['client_ip'];
    } catch (e) {
    }
    let date = new Date();
    let logs = {
        date: date.valueOf(),
        ip: ip,
        ver: 1,
        appid: appid,
        userid: userid,
        type: type,
        info: info
    };
    let path = makePath(basePath, appid, userid, type);

    let month = '0' + (date.getMonth() + 1);
    let day = '0' + date.getDate();
    let dateNow = date.getFullYear()
        + month.substr(month.length - 2, 2)
        + day.substr(day.length - 2, 2);
    let strLog = JSON.stringify(logs);
    if (memLog[path]) {
        if (memLog[path].date !== dateNow) {
            mkDirs(path);
            fs.appendFile(path + memLog[path].date + '.txt', memLog[path].value.json('\n') + '\n', err => {
                if (err) console.log(err);
            });
            memLog[path] = {date: dateNow, value: [strLog]};
        } else {
            memLog[path].value.push(strLog);
        }
    } else {
        memLog[path] = {date: dateNow, value: [strLog]};
    }
};

log.readByNumber = function (appid, userid, type, start, number) {
    let path = makePath(basePath, appid, userid, type);
    let count = start + number;
    let logs = (memLog[path]) ? [...memLog[path].value] : [];
    logs.reverse();
    if (logs.length < count) {
        let files = getAllFiles(path);
        for (let i = files.length - 1; i >= 0; i--) {
            let content = fs.readFileSync(files[i], 'utf8').split('\n');
            content.pop();
            content.reverse();
            logs = logs.concat(content);
            if (logs.length >= count) break;
        }
    }
    logs = logs.slice(start, count);
    return (logs);
};

log.readByDay = function (appid, userid, type, day) {
    let path = makePath(basePath, appid, userid, type);
    let logs = [];
    if (memLog[path] && memLog[path].date === day) {
        logs = [...memLog[path].value];
        logs.reverse();
    }
    if (fs.existsSync(path + day + '.txt')) {
        let content = fs.readFileSync(path + day + '.txt', 'utf8').split('\n');
        content.pop();
        content.reverse();
        logs = logs.concat(content);
    }
    return (logs);
};

log.saveMemLog = function () {
    let count = 0;
    for (let logPath in memLog) {
        mkDirs(logPath);
        fs.appendFileSync(logPath + memLog[logPath].date + '.txt', memLog[logPath].value.join('\n') + '\n');
        delete memLog[logPath];
        count++;
    }
    log.save('SYSTEM', 0, 'crond', 'save ' + count);
    return ('save ' + count.toString() + ' to file done.');
};

function crond() {
    setInterval(log.saveMemLog, 86400000); // 24 * 60 * 60 * 1000
    log.saveMemLog();
}

log.init = function(savePath) {
    basePath = savePath;
    let date = new Date();
    setTimeout(crond,
        (new Date(date.getFullYear(),
            date.getMonth(),
            date.getDate() + 1,
            0, 0, 0, 0)).valueOf() - date.valueOf());
};

module.exports = log;
