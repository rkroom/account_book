import sq3 from '@journeyapps/sqlcipher' //引入sqlcipher
import path from 'path'
import fse from 'fs-extra'

//配置文件
let configFile = path.join(require('electron').remote.app.getPath('userData'), 'config.json')
//数据库路径
let dbpath = JSON.parse(fse.readFileSync(configFile))['dbpath']
//新建数据库对象
let sqlite3 = sq3.verbose()
let db = new sqlite3.Database(dbpath)
// 开发模式下，自动输入密码
if (process.env.NODE_ENV === 'development'){
    //debug 有trace和profile,profile模式下有两个参数，1.语句，2.执行时间，profile将在查询完成后运行
    //db.on("trace",(value)=>{console.log(value)})
    let passwd = JSON.parse(fse.readFileSync(configFile))['password']
    db.run(`PRAGMA KEY = '` + passwd + `'`)
}

export default db