import fse from "fs-extra";
import pkg from '../../package.json'
// 定义函数
function initializeDb(filename: string, password: string) {
  return new Promise(function (resolve, reject) {
    //删除同名文件
    if (fse.existsSync(filename)) {
      try {
        fse.removeSync(filename)
      }
      catch (err) {
        reject("remove file err" + err)
      }
    }
    // 引入sqlcipher
    const sqlite3 = require("@journeyapps/sqlcipher").verbose();
    // 新建一个数据库对象
    const db = new sqlite3.Database(filename);
    // 按顺序执行语句
    db.serialize(function () {
      // 数据库密码
      db.run(`PRAGMA KEY = '` + password + `'`);
      // 创建表结构
      // 采用事务，以确保表结构被正确的创建了，https://www.runoob.com/sqlite/sqlite-transaction.html
      db.run(`BEGIN TRANSACTION`);
      db.run(`CREATE TABLE "app" (
      "id"	INTEGER,
      "key"	TEXT NOT NULL UNIQUE,
      "value"	TEXT NOT NULL,
      PRIMARY KEY("id" AUTOINCREMENT)
    )`);
      db.run(`CREATE TABLE "books_account_book" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          "types_id" integer,
          "flow" varchar(20) NOT NULL,
          "detailed" decimal NOT NULL,
          "account_info_id" integer NOT NULL,
          "aim_account_id" integer,
          "comment" varchar(255),
          "created" datetime NOT NULL DEFAULT (datetime('now','localtime')),
          "when_time" datetime NOT NULL DEFAULT (datetime('now','localtime')),
          "updated" datetime NOT NULL DEFAULT (datetime('now','localtime')),
          CONSTRAINT "fk_books_account_book_books_account_info_1" FOREIGN KEY("account_info_id") REFERENCES "books_account_info"("id"),
          CONSTRAINT "fk_books_account_book_books_account_category_specific_1" FOREIGN KEY("types_id") REFERENCES "books_account_category_specific"("id"),
          CONSTRAINT "fk_books_account_book_books_account_info_2" FOREIGN KEY("aim_account_id") REFERENCES "books_account_info"("id"))`);
      db.run(
        `CREATE INDEX "books_account_book_account_info_id_030de390" ON "books_account_book" ("account_info_id" ASC)`
      );
      db.run(
        `CREATE INDEX "books_account_book_aim_account_id_f5979f3c" ON "books_account_book" ("aim_account_id" ASC)`
      );
      db.run(
        `CREATE INDEX "books_account_book_types_id_5b535171" ON "books_account_book" ("types_id" ASC)`
      );
      db.run(
        `CREATE TRIGGER update_book_datetime_Trigger AFTER UPDATE On books_account_book BEGIN  UPDATE books_account_book SET updated = (datetime('now','localtime')) WHERE id = NEW.id; END`
      );
      db.run(`CREATE TABLE "books_account_category_first" (
          "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          "first_level" varchar(100) NOT NULL,
          "flow_sign" varchar(10) NOT NULL,
          "created" datetime NOT NULL DEFAULT (datetime('now','localtime')),
          "updated" datetime NOT NULL DEFAULT (datetime('now','localtime')))`);
      db.run(`CREATE TABLE "books_account_category_specific" (
          "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          "created" datetime NOT NULL DEFAULT (datetime('now','localtime')),
          "updated" datetime NOT NULL DEFAULT (datetime('now','localtime')),
          "parent_category_id" integer NOT NULL,
          "specific_category" varchar(10) NOT NULL,
          CONSTRAINT "fk_books_account_category_specific_books_account_category_first_1" FOREIGN KEY ("parent_category_id") REFERENCES "books_account_category_first" ("id"))`);
      db.run(
        `CREATE INDEX "books_account_category_specific_parent_category_id_fd8a3ed5" ON "books_account_category_specific" ("parent_category_id" ASC)`
      );
      db.run(
        `INSERT INTO "sqlite_sequence" (name, seq) VALUES ('books_account_category_specific', 1000)`
      );
      db.run(`CREATE TABLE "books_account_info" (
          "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
          "name" varchar(30) NOT NULL,
          "amount" decimal NOT NULL DEFAULT 0,
          "type" varchar(15) NOT NULL,
          "created" datetime NOT NULL DEFAULT (datetime('now','localtime')),
          "updated" datetime NOT NULL DEFAULT (datetime('now','localtime')))`);
      db.run(
        `CREATE TRIGGER update_category_datetime_Trigger AFTER UPDATE On books_account_category_first BEGIN  UPDATE books_account_category_first SET updated = datetime('now','localtime') WHERE id = NEW.id; END`
      );
      db.run(
        `CREATE TRIGGER update_specific_datetime_Trigger AFTER UPDATE On books_account_category_specific BEGIN  UPDATE books_account_category_specific SET updated = datetime('now','localtime') WHERE id = NEW.id; END`
      );
      db.run(
        `CREATE TRIGGER update_account_datetime_Trigger AFTER UPDATE On books_account_info BEGIN  UPDATE books_account_info SET updated = datetime('now','localtime') WHERE id = NEW.id; END`
      );
      db.run(`CREATE TABLE "diaries_diary_info" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "diarydate" datetime NOT NULL DEFAULT (datetime('now','localtime')),
      "weather" varchar(30) NOT NULL,
      "title" varchar(30),
      "content" TEXT NOT NULL,
      "created" datetime NOT NULL DEFAULT (datetime('now','localtime')),
      "updated" datetime NOT NULL DEFAULT (datetime('now','localtime')))`);
      db.run(
        `CREATE TRIGGER update_diary_datetime_Trigger AFTER UPDATE On diaries_diary_info BEGIN  UPDATE diaries_diary_info SET updated = (datetime('now','localtime')) WHERE id = NEW.id; END;`
      );
      db.run(`CREATE TABLE "schemes_project_info" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "created" datetime NOT NULL DEFAULT (datetime('now','localtime')),
      "type" varchar(30) NOT NULL,
      "content" TEXT NOT NULL,
      "finished" datetime,
      "amount" decimal,
      "finaldate" datetime,
      "status" varchar(30) NOT NULL,
      "round" varchar(30),
      "datesign" integer,
      "updated" datetime NOT NULL DEFAULT (datetime('now','localtime')),
      "recordtime" datetime NOT NULL DEFAULT (datetime('now','localtime')))`);
      db.run(
        `CREATE TRIGGER update_schemes_datetime_Trigger AFTER UPDATE On schemes_project_info BEGIN  UPDATE schemes_project_info SET updated = (datetime('now','localtime')) WHERE id = NEW.id; END;`
      );
      db.run(`CREATE TABLE "schemes_handle_info" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "project_id" integer NOT NULL,
      "handledate" datetime NOT NULL DEFAULT (datetime('now','localtime')),
      "comment" TEXT,
      "recordtime" datetime NOT NULL DEFAULT (datetime('now','localtime')),
      "updated" datetime NOT NULL DEFAULT (datetime('now','localtime')),
      CONSTRAINT "fk_schemes_project_handle_info" FOREIGN KEY ("project_id") REFERENCES "schemes_project_info" ("id"))`);
      db.run(
        `CREATE TRIGGER update_handle_datetime_Trigger AFTER UPDATE On schemes_handle_info BEGIN  UPDATE schemes_handle_info SET updated = (datetime('now','localtime')) WHERE id = NEW.id; END`
      );
      // 默认值
      db.run(
        `INSERT INTO "books_account_category_first"("id", "first_level", "flow_sign") VALUES (1, '食品酒水', 'consume')`
      );
      db.run(
        `INSERT INTO "books_account_category_first"("id", "first_level", "flow_sign") VALUES (2, '居家物业', 'consume')`
      );
      db.run(
        `INSERT INTO "books_account_category_first"("id", "first_level", "flow_sign") VALUES (3, '行车交通', 'consume')`
      );
      db.run(
        `INSERT INTO "books_account_category_first"("id", "first_level", "flow_sign") VALUES (4, '交流通讯', 'consume')`
      );
      db.run(
        `INSERT INTO "books_account_category_first"("id", "first_level", "flow_sign") VALUES (5, '休闲娱乐', 'consume')`
      );
      db.run(
        `INSERT INTO "books_account_category_first"("id", "first_level", "flow_sign") VALUES (6, '学习进修', 'consume')`
      );
      db.run(
        `INSERT INTO "books_account_category_first"("id", "first_level", "flow_sign") VALUES (7, '人情往来', 'consume')`
      );
      db.run(
        `INSERT INTO "books_account_category_first"("id", "first_level", "flow_sign") VALUES (8, '医疗保健', 'consume')`
      );
      db.run(
        `INSERT INTO "books_account_category_first"("id", "first_level", "flow_sign") VALUES (9, '衣服饰品', 'consume')`
      );
      db.run(
        `INSERT INTO "books_account_category_first"("id", "first_level", "flow_sign") VALUES (10, '金融保险', 'consume')`
      );
      db.run(
        `INSERT INTO "books_account_category_first"("id", "first_level", "flow_sign") VALUES (11, '其他杂项', 'consume')`
      );
      db.run(
        `INSERT INTO "books_account_category_first"("id", "first_level", "flow_sign") VALUES (12, '职业收入', 'income')`
      );
      db.run(
        `INSERT INTO "books_account_category_first"("id", "first_level", "flow_sign") VALUES (13, '其他收入', 'income')`
      );
      db.run(
        `INSERT INTO "books_account_info"("id", "name", "amount", "type") VALUES (1, '现金', 0, 'asset')`
      );
      db.run(
        `INSERT INTO "books_account_info"("id", "name", "amount", "type") VALUES (2, '银行', 0, 'asset')`
      );
      db.run(
        `INSERT INTO "books_account_info"("id", "name", "amount", "type") VALUES (3, '余额宝', 0, 'asset')`
      );
      db.run(
        `INSERT INTO "books_account_info"("id", "name", "amount", "type") VALUES (4, '财付通', 0, 'asset')`
      );
      db.run(
        `INSERT INTO "books_account_info"("id", "name", "amount", "type") VALUES (5, '微信', 0, 'asset')`
      );
      db.run(
        `INSERT INTO "books_account_info"("id", "name", "amount", "type") VALUES (6, '白条', 0, 'debt')`
      );
      db.run(
        `INSERT INTO "books_account_info"("id", "name", "amount", "type") VALUES (7, '花呗', 0, 'debt')`
      );
      db.run(
        `INSERT INTO "books_account_info"("id", "name", "amount", "type") VALUES (8, '信用卡', 0, 'debt')`
      );
      db.run(
        `INSERT INTO "books_account_info"("id", "name", "amount", "type") VALUES (9, '借呗', 0, 'debt')`
      );
      db.run(
        `INSERT INTO "books_account_info"("id", "name", "amount", "type") VALUES (10, '应付款项', 0, 'debt')`
      );
      db.run(
        `INSERT INTO "books_account_info"("id", "name", "amount", "type") VALUES (11, '应收款项', 0, 'asset')`
      );
      db.run(
        `INSERT INTO "books_account_info"("id", "name", "amount", "type") VALUES (12, '公司报销', 0, 'asset')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1001, 1, '早午晚餐')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1002, 1, '水果零食')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1003, 1, '饮料')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1004, 1, '调味')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1005, 1, '烟酒茶')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1006, 2, '日常用品')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1007, 2, '水电煤气')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1008, 2, '维修保养')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1009, 2, '物业管理')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1010, 2, '房租')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1011, 3, '公共交通')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1012, 3, '打车租车')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1013, 3, '私家车费用')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1014, 4, '手机费')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1015, 4, '上网费')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1016, 4, '邮寄费')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1017, 5, '电子产品')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1018, 5, '运动健身')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1019, 5, '腐败聚会')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1020, 5, '休闲玩乐')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1021, 5, '宠物宝贝')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1022, 5, '旅游度假')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1023, 6, '书报杂志')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1024, 6, '培训进修')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1025, 6, '数码装备')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1026, 6, '学费')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1027, 6, '学习用具')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1028, 6, '杂费')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1029, 7, '送礼请客')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1030, 7, '发红包')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1031, 7, '孝敬家长')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1032, 7, '慈善捐助')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1033, 8, '检查费')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1034, 8, '药品费')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1035, 8, '保健费')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1036, 8, '美容费')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1037, 8, '治疗费')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1038, 9, '衣服裤子')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1039, 9, '服饰配件')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1040, 9, '鞋帽包包')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1041, 9, '化妆饰品')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1042, 10, '银行手续')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1043, 10, '投资亏损')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1044, 10, '按揭还款')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1045, 10, '利息支出')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1046, 10, '赔偿罚款')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1047, 10, '保险')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1048, 11, '其他支出')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1049, 11, '意外丢失')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1050, 11, '烂账损失')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1051, 12, '工资收入')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1052, 12, '利息收入')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1053, 12, '加班收入')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1054, 12, '奖金收入')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1055, 12, '投资收入')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1056, 12, '兼职收入')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1057, 13, '礼金收入')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1058, 13, '中奖收入')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1059, 13, '意外来钱')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1060, 13, '经营所得')`
      );
      db.run(
        `INSERT INTO "books_account_category_specific"("id", "parent_category_id", "specific_category") VALUES (1061, 13, '退款')`
      );
      db.run(
        `INSERT INTO "app"("key", "value") VALUES ('version',"` + pkg.version + `")`
      );
      db.run(`COMMIT`, [], function (err: Error) {
        if (err) {
          reject("database commit err" + err)
        }
      });
      // 关闭数据库
      db.close((err: Error) => {
        if (err) {
          reject("databse close err" + err)
        }
        resolve({ filename: filename, password: password })
      });
    });
  })

}

//导出函数，关于export可见https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/export
export default initializeDb;