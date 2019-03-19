# 日志

- 1.0.9 增加json输出加密插件
>- 插件样例在/utils/jsonEncryption.js
>- 这个样例要求请求时必须带上sid(sessionId,32位)，若无，输出空
>- 如不需要加密，则不需要使用，一旦使用则所有通过res.json的输出都会加密（无sid时输出为空）
>- 设置加密的情况下，加密信息走res.json()，不加密的信息走res.send()
- 1.0.8 路由增加请求方式get,put,post,delete,all
>- 若有重复，则谁先注册谁优先
- 1.0.7 修改拦截器模式
>- app.before(path,func)      
>- app.after(path,func)
>- 支持next()
- 1.0.6 增加拦截器,app.all(path,func)
- 1.0.5 插件功能
>- app.use(),可以在response前加自定义header

# Todo List
- 设置，处理cookie
