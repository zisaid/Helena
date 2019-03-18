let axios = require('axios');

// 创建axios实例
const request = axios.create({
    timeout: 20000
});

// request拦截器
request.interceptors.request.use(
    config => {
        return config;
    },
    error => {
        // Do something with request error
        console.log('err' + error);// for debug
        Promise.reject(error);
    }
);

// response.js拦截器
request.interceptors.response.use(
    response => {
        return response.data;
    },
    error => {
        console.log('err' + error); // for debug
        return Promise.reject(error);
    }
);

module.exports = request;
