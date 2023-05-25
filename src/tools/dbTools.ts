let db = window.electronAPI.db

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

db.asyncRun = function (sql: string, params: Array<string>) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (this: any, err: Error) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};


function getCategory(parent_category_id: Number | string): any {
  return db.asyncAll(
    `select id,specific_category as name,'leaf'leaf from books_account_category_specific where parent_category_id = ?`,
    [parent_category_id])

}
async function getselectoptions_s() {
  let selectoptions: any = [];
  await db.asyncEach(`select * from books_account_info`, [], (row: any) => {
    let option = { value: 1, label: "default" };
    option.value = row.id;
    option.label = row.name;
    selectoptions.push(option);
  })
  return selectoptions
}

function getAccountType_s() {
  let accountTypes: any = {};
  db.each(`select * from books_account_info`, [], (err: Error, row: any) => {
    if (err) {
      throw err;
    }
    accountTypes[row.id] = row.type;
  });
  return accountTypes;
}

async function getselects(flow: any) {
  let rows = await db.asyncAll(
    `select id,first_level as name from books_account_category_first where flow_sign = ?`,
    [flow]
  );
  return rows;
}

function addBill(category: any, flow: any, detailed: any, account: any, comment: any, time: any) {
  db.run(
    `INSERT INTO books_account_book(types_id,flow,detailed,account_info_id,comment,when_time) values (?,?,?,?,?,?)`,
    [
      category,
      flow,
      detailed,
      account,
      comment,
      time,
    ]
  );
}

function addTransfer(detailed: any, account: any, aimAccount: any, comment: any, when: any) {
  db.run(
    `INSERT INTO books_account_book(flow,detailed,account_info_id,aim_account_id,comment,when_time) values (?,?,?,?,?,?)`,
    [
      "transfer",
      detailed,
      account,
      aimAccount,
      comment,
      when,
    ]
  );
}

function getAccountNames() {
  let accountNames: any = {};
  db.each(`select * from books_account_info`, [], (err: Error, row: any) => {
    if (err) {
      throw err;
    }
    accountNames[row.id] = row.name;
  });
  return accountNames;
}


function deleteBill(id: Number) {
  db.run(`DELETE  From books_account_book where id = ?`, [id]);
}

function gettotalpages(categoryNull: any, categoryParam: any, accountParam: any, selectedStartTime: any, selectedEndTime: any, flowParam: any) {
  return db.asyncGet(
    `SELECT COUNT(*) as count from ( SELECT * FROM books_account_book WHERE types_id is ` +
    categoryNull +
    ` types_id like ? )  WHERE account_info_id like ? and when_time >= ? and when_time <= ? and flow like ? `,
    [
      categoryParam,
      accountParam,
      selectedStartTime,
      selectedEndTime,
      flowParam,
    ])
}

async function gettabledata_s(categoryNull: any, accountParam: any, categoryParam: any, selectedStartTime: any, selectedEndTime: any, flowParam: any, pageSize: any, page: any) {
  if (accountParam === "%"){
    return await db.asyncAll(
      `select i.name as account,b.account_info_id as account_id, case when b.flow = 'consume' then '支出' when b.flow = 'income' then '收入' 
      when b.flow = 'transfer' then '转账' end as flow,i2.name as aim_account,b.aim_account_id,s.specific_category as category,b.comment,
      strftime('%Y-%m-%d %H:%M',b.when_time) as date,b.detailed,b.flow as flowSign,b.id from books_account_book as b left join books_account_info as i
       on b.account_info_id = i.id left join books_account_info as i2 on b.aim_account_id = i2.id left join books_account_category_specific as s on 
       b.types_id = s.id where account_info_id like ? and (types_id is ` +
      categoryNull +
      ` types_id like ?) and when_time >= ? and when_time <= ? and flow like ? order by when_time desc limit ?
        offset ?`,
      [
        accountParam,
        categoryParam,
        selectedStartTime,
        selectedEndTime,
        flowParam,
        pageSize,
        page,
      ])
  }
  return await db.asyncAll(
    `select i.name as account,b.account_info_id as account_id, case when b.flow = 'consume' then '支出' when b.flow = 'income' then '收入' 
    when b.flow = 'transfer' then '转账' end as flow,i2.name as aim_account,b.aim_account_id,s.specific_category as category,b.comment,
    strftime('%Y-%m-%d %H:%M',b.when_time) as date,b.detailed,b.flow as flowSign,b.id from books_account_book as b left join books_account_info as i
     on b.account_info_id = i.id left join books_account_info as i2 on b.aim_account_id = i2.id left join books_account_category_specific as s on 
     b.types_id = s.id where account_info_id like ? or aim_account_id like ? and (types_id is ` +
    categoryNull +
    ` types_id like ?) and when_time >= ? and when_time <= ? and flow like ? order by when_time desc limit ?
      offset ?`,
    [
      accountParam,
      accountParam,
      categoryParam,
      selectedStartTime,
      selectedEndTime,
      flowParam,
      pageSize,
      page,
    ])

}

function getCategoryName_s() {
  let categoryName: any = {};
  db.each(
    `SELECT id,specific_category from books_account_category_specific`,
    [],
    (err: Error, row: any) => {
      if (err) {
        throw err;
      }
      categoryName[row.id] = row.specific_category;
    }
  );
  return categoryName;
}

async function getAccountOptions_s() {
  return await db.asyncAll(`select id,name from books_account_info`, []);
}

async function getSelect_s() {
  return await db.asyncAll(
    `select id,first_level as name from books_account_category_first`
  );
}

function getLastBill() {
  return db.asyncGet(
    `SELECT * from books_account_book order by id desc limit 1`,
    [])
}

function UpdateAmount(amout: any, id: any) {
  db.run(`UPDATE books_account_info set amount = ? where id = ?`, [
    amout,
    id,
  ]);
}

function UpdateAccountName(name: any, id: any) {
  db.run(`UPDATE books_account_info set name = ? where id = ?`, [
    name,
    id,
  ]);

}

function addAccount(name: any, amount: any, type: any) {
  db.run(
    `INSERT INTO books_account_info(name,amount,type) values (?,?,?)`,
    [
      name,
      amount,
      type,
    ]
  );
}

function getAccountCount() {
  return db.asyncGet(
    `SELECT COUNT(id) as count from books_account_info`,
    [],
  );
}

function getAccountInfo_a(pageSize: any, page: any) {
  return db.asyncAll(
    `SELECT id,name,case when bai.type = 'asset' then '资产' when bai.type = 'debt' then '负债' end as type,cdetailed,idetailed,toutdetailed,tindetailed,amount,
    round((case when bai.type ='asset' then ifnull(idetailed,0)-ifnull(cdetailed,0)+ifnull(tindetailed,0)-ifnull(toutdetailed,0)+amount 
    when type = 'debt' then ifnull(cdetailed,0)-ifnull(idetailed,0)+ifnull(toutdetailed,0)-ifnull(tindetailed,0)-amount end),2) as balance FROM books_account_info as bai 
    LEFT JOIN (SELECT account_info_id,sum(detailed) as  cdetailed from books_account_book WHERE flow='consume' GROUP by account_info_id) as c on c.account_info_id = bai.id 
    left join (SELECT account_info_id,sum(detailed) as  idetailed from books_account_book WHERE flow='income' GROUP by account_info_id) as i on i.account_info_id = bai.id 
    left join (SELECT account_info_id,sum(detailed) as  toutdetailed from books_account_book WHERE flow='transfer' GROUP by account_info_id) as tout on tout.account_info_id = bai.id 
    left join (SELECT aim_account_id,sum(detailed) as  tindetailed from books_account_book WHERE flow='transfer' GROUP by aim_account_id) as tin on tin.aim_account_id = bai.id
    limit ? offset ?`,
    [pageSize, page]
  );
}

function getFirstLevelConsumeAnalysis_m(queryDate_start: any, queryDate_end: any) {
  return db.asyncAll(
    `SELECT round(sum(b.detailed),2) as value,f.first_level as name FROM books_account_book as b left JOIN 
  books_account_category_specific as s on b.types_id = s.id LEFT JOIN books_account_category_first as f on s.parent_category_id = f.id 
  WHERE flow="consume" AND when_time >= ? AND when_time <= ? GROUP BY parent_category_id`,
    [queryDate_start, queryDate_end]
  )
}

function totalBalance(type: any) {
  return db.asyncGet(`select round(sum(balance),2) as balance from (SELECT ifnull(idetailed,0)-ifnull(cdetailed,0)+ifnull(tindetailed,0)-ifnull(toutdetailed,0)+amount as balance FROM books_account_info as bai 
  LEFT JOIN (SELECT account_info_id,sum(detailed) as  cdetailed from books_account_book WHERE flow='consume' GROUP by account_info_id) as c on c.account_info_id = bai.id 
  left join (SELECT account_info_id,sum(detailed) as  idetailed from books_account_book WHERE flow='income' GROUP by account_info_id) as i on i.account_info_id = bai.id 
  left join (SELECT account_info_id,sum(detailed) as  toutdetailed from books_account_book WHERE flow='transfer' GROUP by account_info_id) as tout on tout.account_info_id = bai.id 
  left join (SELECT aim_account_id,sum(detailed) as  tindetailed from books_account_book WHERE flow='transfer' GROUP by aim_account_id) as tin on tin.aim_account_id = bai.id 
  WHERE bai.type = ?) `, [type])
}

function addFirstCategory(firstLevelName: any, flow: any) {
  db.run(
    `INSERT INTO books_account_category_first(first_level,flow_sign) values (?,?)`,
    [firstLevelName, flow]
  )
}

function addSpecificCategory(superiorLevel: any, specificLevel: any) {
  db.run(
    `INSERT INTO books_account_category_specific(parent_category_id,specific_category) values (?,?)`,
    [
      superiorLevel,
      specificLevel,
    ]
  );
}

async function getselectoptions_m() {
  // 获取一级分类
  let selectoptions: any = [];
  await db.asyncEach(`select * from books_account_category_first`, [], (row: any) => {
    let option = { value: 1, label: "default" };
    option.value = row.id;
    if (row.flow_sign == "consume") {
      option.label = row.first_level + "（支出）";
    } else {
      option.label = row.first_level + "（收入）";
    }
    selectoptions.push(option);
  })
  return selectoptions
}

function timeStatistics(flow: any, startTime: any, endTime: any) {
  return db.asyncGet(
    `SELECT round(sum(detailed),2) as amount FROM books_account_book WHERE flow = ? AND when_time > ? AND when_time < ?`,
    [flow, startTime, endTime])
}

async function getFirstLevelIdAndName_m() {
  let tmp: any = {};
  await db.asyncEach(
    `SELECT id,first_level FROM books_account_category_first`,
    [], (row: any) => {
      tmp[row.first_level] = row.id;
    }
  );
  return tmp;
}

function getFirstLevel_A() {
  return db.asyncAll(
    `SELECT id,first_level FROM books_account_category_first`,
    []
  )
}

function getSpecific_A(selectedOption: any, startTime: any, endTime: any) {
  return db.asyncAll(
    `SELECT s.id,s.specific_category,sum(b.detailed) as sum FROM (SELECT id,specific_category FROM books_account_category_specific where parent_category_id = ?) as s LEFT JOIN books_account_book as b on s.id = b.types_id WHERE b.when_time > ? AND when_time < ? GROUP by s.id`,
    [selectedOption, startTime, endTime])
}

function getSpecificIdandName_A() {
  return db.asyncAll(
    `SELECT id,specific_category FROM books_account_category_specific`,
    []
  );
}

function updateDiary(datetime: any, weather: any, title: any, content: any, diaryid: any) {
  db.run(
    `UPDATE diaries_diary_info SET diarydate = ?, weather = ?,title = ?, content = ? where id = ?`,
    [
      datetime,
      weather,
      title,
      content,
      diaryid,
    ]
  );
}

async function addDiary(datetime: any, weather: any, title: any, content: any) {
  db.run(
    `INSERT INTO diaries_diary_info(diarydate,weather,title,content) values (?,?,?,?)`,
    [
      datetime,
      weather,
      title,
      content,
    ]
  );
}

function getLastDiaryId() {
  return db.asyncGet(
    `SELECT id from diaries_diary_info order by id desc limit 1`, [])
}

function getTableData_listDiary(pageSize: any, page: any) {
  return db.asyncAll(
    `select *,strftime('%Y-%m-%d',diarydate) as diarydatef from diaries_diary_info order by diarydate desc limit ? offset ?`,
    [pageSize, page]
  );
}

function getTotalPage_listDiary() {
  return db.asyncGet(`SELECT COUNT(id) as count from diaries_diary_info`, [])
}

async function addProject(objective: any, goaldate: any, amount: any) {
  db.run(
    `INSERT INTO schemes_project_info(type,content,finaldate,amount,status) values (?,?,?,?,?)`,
    [
      "goal",
      objective,
      goaldate,
      amount,
      "continuing",
    ]
  );
}

function getLastProjectID() {
  return db.asyncGet(`select * from schemes_project_info WHERE type = 'goal' order by id desc limit 1`, [])
}

function getTableData_g(pageSize: any, page: any) {
  return db.asyncAll(
    `select *,strftime('%Y-%m-%d',created) as createdf,strftime('%Y-%m-%d',finaldate) as finaldatef,strftime('%Y-%m-%d',finished) as finishedf from schemes_project_info WHERE type = 'goal' order by status limit ? offset ?`,
    [pageSize, page])
}

function updateProject(rowStatus: any, finshedDate: any, id: any) {
  db.run(
    `UPDATE schemes_project_info SET status = ? ,finished = ? where id = ?`,
    [rowStatus, finshedDate, id]
  );
}

function getTotalPage_g() {
  return db.asyncGet(
    `SELECT COUNT(id) as count from schemes_project_info`,
    [])
}

function addYearSchedule(createDate: any, project: any, expectDate: any, round: any) {
  db.run(
    `INSERT INTO schemes_project_info(created,type,content,finaldate,status,round) values (?,?,?,?,?,?)`,
    [
      createDate,
      "schedule",
      project,
      expectDate,
      "continuing",
      round,
    ]
  );
}

function addDaySchedule(createDate: any, project: any, round: any) {
  db.run(
    `INSERT INTO schemes_project_info(created,type,content,status,round) values (?,?,?,?,?)`,
    [
      createDate,
      "schedule",
      project,
      "continuing",
      round,
    ]
  );
}

function addMonthSchedule(createDate: any, project: any, round: any, days: any) {
  db.run(
    `INSERT INTO schemes_project_info(created,type,content,status,round,datesign) values (?,?,?,?,?,?)`,
    [
      createDate,
      "schedule",
      project,
      "continuing",
      round,
      days,
    ]
  );
}

function addCustomSchedule(createDate: any, project: any, expectDate: any, round: any, customDays: any) {
  db.run(
    `INSERT INTO schemes_project_info(created,type,content,finaldate,status,round,datesign) values (?,?,?,?,?,?,?)`,
    [
      createDate,
      "schedule",
      project,
      expectDate,
      "continuing",
      round,
      customDays,
    ]
  );
}

function getLastSchedule() {
  return db.asyncGet(
    `select *,strftime('%Y-%m-%d',created) as createdf from schemes_project_info order by id desc limit 1`,
    [])
}

function getTotalPage_schedule() {
  return db.asyncGet(
    `SELECT COUNT(id) as count from schemes_project_info`,
    [])
}

function updateSchedule_schedule(rowStatus: any, finshedDate: any, id: any) {
  db.run(
    `UPDATE schemes_project_info SET status = ? ,finished = ? where id = ?`,
    [rowStatus, finshedDate, id]
  );
}

function handleInfo_schedule(id: any, finshedDate: any, handleComment: any) {
  db.run(
    `INSERT INTO schemes_handle_info(project_id,handledate,comment) values (?,?,?)`,
    [id, finshedDate, handleComment]
  );
}

function getTableData_schedule(pageSize: any, page: any) {
  return db.asyncAll(
    `select sh.id as shid,sp.*,strftime('%Y-%m-%d',sp.created) as createdf,strftime('%Y-%m-%d',sp.finaldate) as finaldatef,
strftime('%Y-%m-%d',sp.finished) as finishedf,sh.id as shid,sh.handledate,sh.comment from schemes_project_info as sp 
LEFT join (select id,strftime('%Y-%m-%d',max(handledate)) as handledate,comment,project_id from schemes_handle_info GROUP by project_id ) as sh 
on sp.id = sh.project_id WHERE sp.type='schedule' ORDER by status LIMIT ? offset ?`,
    [pageSize, page]
  )
}

function getHandleInfo_schedule(id: any) {
  return db.asyncAll(
    `select strftime('%Y-%m-%d',handledate) as handledate,comment from schemes_handle_info where project_id = ? order by handledate DESC`,
    [id])
}

function changeDbPassword(value: string) {
  return new Promise((resolve, reject) => {
    db.run(`PRAGMA rekey = '` + value + `'`, [], (err: any) => {
      if (err) {
        reject(false)
      }
      resolve(true)
    });
  })

}


async function importBillsFromExcel(sqlParams: Array<Array<string>>) {
  await db.asyncRun(`BEGIN TRANSACTION`);
  for (let param of sqlParams) {
    try {
      await db.asyncRun("INSERT INTO books_account_book(types_id,flow,detailed,account_info_id,aim_account_id,comment,when_time) values (?,?,?,?,?,?,?)", param)
    } catch (err) {
      await db.asyncRun(`ROLLBACK`)
      throw err
    }
  }
  await db.asyncRun(`COMMIT`)
  return true
}

export {
  getCategory,
  getselectoptions_s,
  getAccountType_s,
  getselects,
  addBill,
  addTransfer,
  getAccountNames,
  deleteBill,
  gettotalpages,
  gettabledata_s,
  getCategoryName_s,
  getAccountOptions_s,
  getSelect_s,
  getLastBill,
  UpdateAmount,
  UpdateAccountName,
  addAccount,
  getAccountCount,
  getAccountInfo_a,
  getFirstLevelConsumeAnalysis_m,
  totalBalance,
  addFirstCategory,
  addSpecificCategory,
  getselectoptions_m,
  timeStatistics,
  getFirstLevelIdAndName_m,
  getFirstLevel_A,
  getSpecific_A,
  getSpecificIdandName_A,
  updateDiary,
  addDiary,
  getLastDiaryId,
  getTableData_listDiary,
  getTotalPage_listDiary,
  addProject,
  getLastProjectID,
  getTableData_g,
  updateProject,
  getTotalPage_g,
  addYearSchedule,
  addDaySchedule,
  addMonthSchedule,
  addCustomSchedule,
  getLastSchedule,
  getTotalPage_schedule,
  updateSchedule_schedule,
  handleInfo_schedule,
  getTableData_schedule,
  getHandleInfo_schedule,
  changeDbPassword,
  importBillsFromExcel,
}