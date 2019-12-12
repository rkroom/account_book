// 定义函数
function initializeDb (filename, password) {
  // 引入sqlcipher
  var sqlite3 = require('@journeyapps/sqlcipher').verbose()
  // 新建一个数据库对象
  let db = new sqlite3.Database(filename)
  // 按顺序执行语句
  db.serialize(function () {
    // 数据库密码
    db.run(`PRAGMA KEY = '` + password + `'`)
    // 创建表结构
    db.run(`CREATE TABLE "books_account_book" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL)`)
  })
  // 关闭数据库
  db.close()
}

//导出函数，关于export可见https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/export
export default initializeDb
