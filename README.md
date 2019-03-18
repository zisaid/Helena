# 日志

- 1.0.8 路由增加请求方式get,put,post,delete,all。
>- 若有重复，则谁先注册谁优先
- 1.0.7 修改拦截器模式
>- app.before(path,func)      
>- app.after(path,func)
>- 支持next()
- 1.0.6 增加拦截器,app.all(path,func)
- 1.0.5 插件功能
>- app.use(),可以在response前加自定义header
