import sq3 from "@journeyapps/sqlcipher"; //引入sqlcipher
import fse from "fs-extra";
import electron from "electron";

//配置文件
const configFile = electron.remote.getGlobal('shareObject').configFile
//数据库路径
const dbpath = JSON.parse(fse.readFileSync(configFile, "utf-8"))["dbpath"];
//新建数据库对象
const sqlite3 = sq3.verbose();
const db = new sqlite3.Database(dbpath);
// 开发模式下，自动输入密码
if (process.env.NODE_ENV === "development") {
  //debug 有trace和profile,profile模式下有两个参数，1.语句，2.执行时间，profile将在查询完成后运行
  db.on("trace", (value: any) => {
    console.log(value);
  });
  const passwd = JSON.parse(fse.readFileSync(configFile, "utf-8"))["password"];
  db.run(`PRAGMA KEY = '` + passwd + `'`);
}

db.asyncAll = function (sql: string, params: Array<string>) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: Error, data: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

db.asyncGet = function (sql: string, params: Array<string>) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err: Error, data: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

db.asyncEach = function (sql: string, params: Array<string>, action: any) {
  return new Promise(function (resolve, reject) {
    db.serialize(function () {
      db.each(sql, params, function (err: Error, row: any) {
        if (err) reject("Read error: " + err.message);
        else {
          if (row) {
            action(row);
          }
        }
      });
      db.get("", function (err: Error, row: any) {
        resolve(true);
      });
    });
  });
};

export default db;
