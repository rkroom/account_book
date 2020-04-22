<template>
  <div>
    <!--表格组件-->
    <el-table :data="tableData" :cell-style="cellStyle">
      <el-table-column prop="date" label="日期" width="139">
      </el-table-column>
      <el-table-column prop="category" label="分类">
      </el-table-column>
      <el-table-column prop="flow" label="收支">
      </el-table-column>
      <el-table-column prop="detailed" label="金额">
      </el-table-column>
      <el-table-column prop="account" label="账户" width="100">
      </el-table-column>
      <el-table-column prop="aim_account" label="目标账户" width="100">
      </el-table-column>
      <el-table-column prop="comment" label="备注" :show-overflow-tooltip="true" width="100">
      </el-table-column>
      <el-table-column label="操作">
        <template slot-scope="scope">
          <el-button size="mini" type="text" @click="handleDelete(scope.$index,scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination background layout="prev, pager, next" :total="totalPage" :page-size="13"
      @current-change="handlePage">
    </el-pagination>
  </div>
</template>
<script>
import db from '@/utils/sqdb'
import vm from '@/components/event.js' // 借助第三方进行通信
// 获取账户名
function getAccountName () {
  let accountNames = {}
  db.each(`select * from books_account_info`, [], (err, row) => {
    if (err) {
      throw err
    }
    accountNames[row.id] = row.name
  })
  return accountNames
}
// 分页，每页13
const pageSize = 13
export default {
  name: 'BookTable',
  data () {
    return {
      tableData: [],
      totalPage: 0,
      accountName: {},
      accountType: {},
      categoryName: {}
    }
  },
  //父组件传递过来的账户ID
  props: {
    accountId: {
      type:[String,Number],
      default:NaN
    },
    cellStyle: {
      type:Object,
      default:()=>({})
    }
  },
  methods: {
    // 接收从记账组件传递过来的数据
    receive: function () {
      let flowlist = { consume: '支出', income: '收入', transfer: '转账' }
      vm.$on('appendTable', (row) => {
        this.tableData.unshift({
          id: row.id,
          date: row.when_time.substring(0, 16),
          category: this.categoryName[row.types_id],
          flow: flowlist[row.flow],
          detailed: row.detailed,
          account: this.accountName[row.account_info_id],
          aim_account: this.accountName[row.aim_account_id],
          comment: row.comment,
          flowSign: row.flow,
          account_id: row.account_info_id,
          aim_account_id: row.aim_account_id
        })
      })
    },
    handleDelete (index, row) {
      // 删除记账记录
      this.$confirm('此操作将删除金额为 ' + row.detailed + ' 的记录, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        db.serialize(() => {
          db.run(`BEGIN TRANSACTION`)
          if (row.flowSign === 'consume') {
            if (this.accountType[row.account_id] === 'asset') {
              db.run(`UPDATE books_account_info set amount = amount + ? where id = ?`, [row.detailed, row.account_id])
            } else if (this.accountType[row.account_id] === 'debt') {
              db.run(`UPDATE books_account_info set amount = amount - ? where id = ?`, [row.detailed, row.account_id])
            }
          } else if (row.flowSign === 'income') {
            if (this.accountType[row.account_id] === 'asset') {
              db.run(`UPDATE books_account_info set amount = amount - ? where id = ?`, [row.detailed, row.account_id])
            } else if (this.accountType[row.account_id] === 'debt') {
              db.run(`UPDATE books_account_info set amount = amount + ? where id = ?`, [row.detailed, row.account_id])
            }
          } else if (row.flowSign === 'transfer') {
            if (this.accountType[row.account_id] === this.accountType[row.aim_account_id]) {
              db.run(`UPDATE books_account_info set amount = amount + ? where id = ?`, [row.detailed, row.account_id])
              db.run(`UPDATE books_account_info set amount = amount - ? where id = ?`, [row.detailed, row.aim_account_id])
            } else if (this.accountType[row.account_id] === 'asset') {
              db.run(`UPDATE books_account_info set amount = amount + ? where id = ?`, [row.detailed, row.account_id])
              db.run(`UPDATE books_account_info set amount = amount + ? where id = ?`, [row.detailed, row.aim_account_id])
            } else if (this.accountType[row.account_id] === 'debt') {
              db.run(`UPDATE books_account_info set amount = amount - ? where id = ?`, [row.detailed, row.account_id])
              db.run(`UPDATE books_account_info set amount = amount - ? where id = ?`, [row.detailed, row.aim_account_id])
            }
          }
          db.run(`DELETE  From books_account_book where id = ?`, [row.id])
          db.run(`COMMIT`)
        })
        this.tableData.splice(index, 1)
        this.$message({
          type: 'success',
          message: '删除成功!'
        })
      }).catch(() => {
        this.$notify({
          type: 'info',
          message: '已取消删除'
        })
      })
    },
    // 更改页码
    handlePage (value) {
      this.gettabledata(pageSize, (value - 1) * pageSize)
    },
    // 获取总页数
    gettotalpage () {
      db.get(`SELECT COUNT(id) as count from books_account_book WHERE account_info_id like ?`, [this.accountId], (err, row) => {
        if (err) {
          throw err
        }
        this.totalPage = row.count
      })
    },
    // 获取数据
    gettabledata (pageSize, page) {
      let tabledata = []
      let flowlist = { consume: '支出', income: '收入', transfer: '转账' }
      let sql = `select * from books_account_book where account_info_id like ? order by when_time desc limit ? offset ?`
      db.each(sql, [this.accountId, pageSize, page], (err, row) => {
        let data = { id: 1, date: '2000-00-00', category: '早午晚餐', flow: '支出', detailed: '0', account: '余额宝', aim_account: '现金', comment: '', flowSign: '' }
        if (err) {
          throw err
        }
        data.id = row.id
        data.date = row.when_time.substring(0, 16)
        data.category = this.categoryName[row.types_id]
        data.flow = flowlist[row.flow]
        data.detailed = row.detailed
        data.account = this.accountName[row.account_info_id]
        data.aim_account = this.accountName[row.aim_account_id]
        data.comment = row.comment
        data.flowSign = row.flow
        data.aim_account_id = row.aim_account_id
        data.account_id = row.account_info_id
        tabledata.push(data)
      })
      this.tableData = tabledata
    },
    // 获取账户类型
    getAccountType () {
      let accountTypes = {}
      db.each(`select * from books_account_info`, [], (err, row) => {
        if (err) {
          throw err
        }
        accountTypes[row.id] = row.type
      })
      this.accountType = accountTypes
    },
    // 获取分类名
    getCategoryName () {
      let categoryName = {}
      db.each(`SELECT id,specific_category from books_account_category_specific`, [], (err, row) => {
        if (err) {
          throw err
        }
        categoryName[row.id] = row.specific_category
      })
      this.categoryName = categoryName
    },
    // 初始化数据
    getdata () {
      this.accountName = getAccountName()
      this.getCategoryName()
      this.getAccountType()
      this.gettabledata(pageSize, 0)
      this.gettotalpage()
    }
  },
  created: function () {
    this.getdata()
  },
  mounted: function () {
    this.receive()
  },
  watch: {
    // 当父组件传递过来的账户ID发生改变
    accountId: function () {
      this.gettabledata(pageSize, 0)
      this.gettotalpage()
    }
  }
}
</script>
