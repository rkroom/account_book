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

export default db