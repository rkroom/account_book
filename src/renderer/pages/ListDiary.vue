<template>
  <div>
    <el-table :data="tableData" style="width: 100%" @row-click="handleRowClick" ref="diaryTable">
      <el-table-column type="expand">
        <template slot-scope="props">
          <el-form label-position="left">
            <el-form-item label="内容">
              <span>{{ props.row.content }}</span>
            </el-form-item>
          </el-form>
        </template>
      </el-table-column>
      <el-table-column label="日期" prop="diarydatef">
      </el-table-column>
      <el-table-column label="天气" prop="weather">
      </el-table-column>
      <el-table-column label="内容" prop="content" :show-overflow-tooltip="true">
      </el-table-column>
      <el-table-column label="标题" prop="title">
      </el-table-column>
      <el-table-column label="操作">
        <template slot-scope="scope">
          <el-button size="mini" type="text" @click.stop="handleEdit(scope.$index,scope.row)">编辑
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination background layout="prev, pager, next" :total="totalPage" :page-size="13"
      @current-change="handlePage">
    </el-pagination>
    <el-dialog title="编辑" :visible.sync="dialogVisible" width="65%" :before-close="handleClose" :close-on-click-modal="false"	v-dialogDrag>
      <DiaryEdit :diaryData="diaryData"></DiaryEdit>
      <span slot="footer" class="dialog-footer">
      </span>
    </el-dialog>
  </div>
</template>

<script>
import db from '@/utils/sqdb'
import DiaryEdit from '@/Pages/NewDiary'
import '@/components/v-dialogDrag'
const pageSize = 13

export default {
  name: 'ListDiary',
  components: { DiaryEdit },
  data () {
    return {
      tableData: [],
      totalPage: 0,
      dialogVisible: false,
      diaryData: '',
      pageNum: 1
    }
  },
  methods: {
    getTableData (pageSize, page) {
      db.all(`select *,strftime('%Y-%m-%d',diarydate) as diarydatef from diaries_diary_info order by diarydate desc limit ? offset ?`, [pageSize, page], (err, rows) => {
        if (err) {
          throw err
        }
        this.tableData = rows
      })
    },
    handlePage (value) {
      this.pageNum = value
      this.getTableData(pageSize, (value - 1) * pageSize)
    },
    getTotalPage () {
      db.get(`SELECT COUNT(id) as count from diaries_diary_info`, [], (err, row) => {
        if (err) {
          throw err
        }
        this.totalPage = row.count
      })
    },
    handleRowClick (row) {
      this.$refs.diaryTable.toggleRowExpansion(row)
    },
    handleEdit (index, row) {
      this.dialogVisible = true
      this.diaryData = row
    },
    handleClose (done) {
      this.getTableData(pageSize, (this.pageNum - 1) * pageSize)
      done()
    }
  },
  created: function () {
    this.getTableData(pageSize, 0)
    this.getTotalPage()
  }
}
</script>

<style>
.demo-table-expand {
  font-size: 0;
}
.demo-table-expand label {
  width: 90px;
  color: #99a9bf;
}
.demo-table-expand .el-form-item {
  margin-right: 0;
  margin-bottom: 0;
  width: 50%;
}
.el-dialog__wrapper > div{
height: 600px;
}
</style>