const sq3 = require("@journeyapps/sqlcipher"); //引入sqlcipher
const fse = require("fs-extra")

const configFile = require('@electron/remote').getGlobal("shareObject")['configFile']
let configInfo = JSON.parse(fse.readFileSync(configFile, "utf-8"))
let dbpath = configInfo['dbpath']

function accessDb(dbpath: string, password: string | null) {
  const sqlite3 = sq3.verbose();
  const db = new sqlite3.Database(dbpath);
  // 开发模式下，自动输入密码
  if (process.env.NODE_ENV === "development" || (import.meta as any).env.DEV) {
    //debug 有trace和profile,profile模式下有两个参数，1.语句，2.执行时间，profile将在查询完成后运行
    db.on("trace", (value: any) => {
      console.log(value);
    });
    const passwd = configInfo["password"];
    db.run(`PRAGMA KEY = '` + passwd + `'`);
  }
  if (password) {
    db.run(`PRAGMA KEY = '` + password + `'`);
  }
  return db
}

let db = accessDb(dbpath, null)


export default db
export {
  accessDb
}