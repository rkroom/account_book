<template>
    <div>
        <el-table :data="tableData" style="width: 100%" @row-click="handleRowClick" ref="diaryTable">
            <el-table-column type="expand">
                <template v-slot="props">
                    <el-form label-position="left">
                        <el-form-item label="内容">
                            <span>{{ props.row.content }}</span>
                        </el-form-item>
                    </el-form>
                </template>
            </el-table-column>
            <el-table-column label="日期" prop="diarydatef"> </el-table-column>
            <el-table-column label="天气" prop="weather"> </el-table-column>
            <el-table-column label="内容" prop="content" :show-overflow-tooltip="true">
            </el-table-column>
            <el-table-column label="标题" prop="title"> </el-table-column>
            <el-table-column label="操作">
                <template v-slot="scope">
                    <el-button link @click.stop="handleEdit(scope.$index, scope.row)">编辑
                    </el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination background layout="prev, pager, next" :total="totalPage" :page-size="13"
            @current-change="handlePage">
        </el-pagination>
        <el-dialog title="编辑" v-model="dialogVisible" width="65%" :before-close="handleClose"
            :close-on-click-modal="false">
            <DiaryEdit :diaryData="diaryData"></DiaryEdit>
            <template #footer>
                <span class="dialog-footer"> </span>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import {getTableData_listDiary,getTotalPage_listDiary} from '../tools/dbTools'
import DiaryEdit from "./NewDiary.vue";
const pageSize = 13;

export default {
    name: "ListDiary",
    components: { DiaryEdit },
    data() {
        return {
            tableData: [],
            totalPage: 0,
            dialogVisible: false,
            diaryData: "",
            pageNum: 1,
        };
    },
    methods: {
        getTableData(pageSize, page) {
            getTableData_listDiary(pageSize, page).then(rows => {
                this.tableData = rows
            })
        },
        handlePage(value) {
            this.pageNum = value;
            this.getTableData(pageSize, (value - 1) * pageSize);
        },
        getTotalPage() {
            getTotalPage_listDiary().then(row => { this.totalPage = row.count })
        },
        handleRowClick(row) {
            this.$refs.diaryTable.toggleRowExpansion(row);
        },
        handleEdit(index, row) {
            this.dialogVisible = true;
            this.diaryData = row;
        },
        handleClose(done) {
            this.getTableData(pageSize, (this.pageNum - 1) * pageSize);
            done();
        },
    },
    created: function () {
        this.getTableData(pageSize, 0);
        this.getTotalPage();
    },
};
</script>

<style scoped>
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

.el-dialog {
    height: 600px;
}
</style>