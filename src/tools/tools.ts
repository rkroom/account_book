import SSF from 'ssf'

function dateFmt(fmt: string, date: Date): string {
  const o: any = {
    "M+": date.getMonth() + 1,
    "d+": date.getDate(),
    "h+": date.getHours(),
    "m+": date.getMinutes(),
    "s+": date.getSeconds(),
    "q+": Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds(),
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (date.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  }
  for (const k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length === 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
    }
  }
  return fmt;
}

function currentlyMonthDays(): Array<string> {
  // 获取当前月份，由此计算本月收支
  const date = new Date();
  const year = date.getFullYear();
  let month: any = date.getMonth() + 1;
  if (month.toString().length === 1) {
    month = "0" + month;
  }
  const d = new Date(year, month, 0);
  return [
    year + "-" + month + "-" + "01 00:00:00",
    year + "-" + month + "-" + d.getDate() + " 23:59:59",
  ];
}

function previousMonthDays(): Array<string> {
  // 获取上月月份，由此计算上月收支
  const date = new Date();
  let year = date.getFullYear();
  let month: any = date.getMonth();
  if (month === 0) {
    year = year - 1;
    month = 12;
  }
  if (month.toString().length === 1) {
    month = "0" + month;
  }
  const d = new Date(year, month, 0);
  return [
    year + "-" + month + "-" + "01 00:00:00",
    year + "-" + month + "-" + d.getDate() + " 23:59:59",
  ];
}

function isValidKey(key: string | number | symbol, object: object): key is keyof typeof object {
  return key in object
}

function parseExcelDate(n: number, isDate1904: boolean) {
  const parsed = SSF.parse_date_code(n, { date1904: isDate1904 });
  // return `${parsed.y}-${parsed.m}-${parsed.d}`;
  return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S);
}

export {
  dateFmt,
  currentlyMonthDays,
  previousMonthDays,
  isValidKey,
  parseExcelDate,
};