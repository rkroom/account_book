<template>
    <div>
        <el-form ref="goal" :model="goal" :rules="rules">
            <el-col >
                <el-form-item label="创建日期" prop="createdate">
                    <el-date-picker v-model="goal.createdate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
                        placeholder="选择日期" style="width: 180px">
                    </el-date-picker>
                </el-form-item>
            </el-col>
            <el-col >
                <el-form-item label="预计日期" prop="goaldate">
                    <el-date-picker v-model="goal.goaldate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
                        placeholder="选择日期" style="width: 180px">
                    </el-date-picker>
                </el-form-item>
            </el-col>
            <el-col >
                <el-form-item label="&nbsp;&nbsp;预期金额" prop="amount">
                    <el-input v-model="goal.amount" placeholder="请输入金额" style="width: 185px"></el-input>
                </el-form-item>
            </el-col>
            <el-col :span="16">
                <el-form-item prop="objective" label="预期目标">
                    <el-col :span="16">
                        <el-input placeholder="请输入内容" v-model="goal.objective">
                        </el-input>
                    </el-col>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onConfirm('goal')">保存</el-button>
                </el-form-item>
            </el-col>
        </el-form>
        <el-table :data="goalTableData" style="width: 100%" @row-click="handleRowClick" ref="goalTable">
            <el-table-column type="expand">
                <template v-slot="props">
                    <el-form inline>
                        <el-form-item>
                            <span>{{ props.row.content }}</span>
                        </el-form-item>
                    </el-form>
                </template>
            </el-table-column>
            <el-table-column prop="createdf" label="创建日期" width="120">
            </el-table-column>
            <el-table-column prop="content" label="目标" :show-overflow-tooltip="true">
            </el-table-column>
            <el-table-column prop="amount" label="预计金额" width="80">
            </el-table-column>
            <el-table-column prop="finaldatef" label="预计日期" width="120">
            </el-table-column>
            <el-table-column label="状态" width="100">
                <template v-slot="scope">
                    <el-button link type="primary" @click.stop="handleStatus(scope.$index, scope.row)">{{
                            status[scope.row.status]
                    }}
                    </el-button>
                </template>
            </el-table-column>
            <el-table-column prop="finishedf" label="完成日期"> </el-table-column>
        </el-table>
        <el-pagination background layout="prev, pager, next" :total="totalPage" :page-size="13"
            @current-change="handlePage">
        </el-pagination>
        <el-dialog title="状态" :modal="false" v-model="dialogVisible" width="15%" :before-close="handleClose">
            <el-select v-model="rowStatus" placeholder="请选择" @change="handleStatusChange" style="width: 135px">
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
                </el-option>
            </el-select>
            <p>时间</p>
            <el-date-picker v-model="finshedDate" type="datetime" placeholder="请选择日期" value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 180px">
            </el-date-picker>
            <template #footer>
                <span class="dialog-footer">
                    <el-button type="primary" @click="updateGoal">确 定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { addProject,getLastProjectID,getTableData_g,updateProject,getTotalPage_g } from '../tools/dbTools'
import { dateFmt } from "../tools/tools";
const pageSize = 13;

export default {
    name: "goal",
    data() {
        var checkAmount = (rule, value, callback) => {
            if (value === null) {
                return callback();
            }
            Number(value) ? callback() : callback(new Error("请输入数字"));
        };
        return {
            goal: {
                objective: "",
                amount: null,
                goaldate: "",
                createdate: dateFmt("yyyy-MM-dd hh:mm:ss", new Date()),
            },
            rules: {
                createdate: [
                    { required: true, message: "请选择日期", trigger: "blur" },
                ],
                objective: [{ required: true, message: "请输入目标", trigger: "blur" }],
                amount: [{ validator: checkAmount, trigger: "blur" }],
                goaldate: [{ required: true, message: "请选择日期", trigger: "blur" }],
            },
            goalTableData: [],
            options: [
                {
                    value: "continuing",
                    label: "进行中",
                },
                {
                    value: "finshed",
                    label: "已完成",
                },
                {
                    value: "giveup",
                    label: "已放弃",
                },
            ],
            dialogVisible: false,
            tempRow: {},
            pageNum: 1,
            totalPage: 0,
            rowStatus: "",
            rowIndex: 0,
            status: { continuing: "进行中", finshed: "已完成", giveup: "已放弃" },
            finshedDate: dateFmt("yyyy-MM-dd hh:mm:ss", new Date()),
        };
    },
    methods: {
        onConfirm(goal) {
            this.$refs[goal].validate((valid) => {
                if (valid) {
                    addProject(this.goal.objective, this.goal.goaldate, this.goal.amount).then(() => {
                        getLastProjectID().then(row => {
                            this.goalTableData.unshift(row);
                        })
                    })
                }
            });
        },
        getTableData(pageSize, page) {
            getTableData_g(pageSize, page).then(rows => { this.goalTableData = rows; })
        },
        handleRowClick(row) {
            this.$refs.goalTable.toggleRowExpansion(row);
        },
        handleStatus(index, row) {
            this.dialogVisible = true;
            this.rowIndex = index;
            this.tempRow = row;
            this.rowStatus = row.status;
        },
        handleClose(done) {
            done();
        },
        handleStatusChange(value) {
            this.rowStatus = value;
        },
        updateGoal() {
            if (this.rowStatus && this.rowStatus !== "continuing") {
                updateProject(this.rowStatus, this.finshedDate, this.tempRow.id);
                this.goalTableData[this.rowIndex].status = this.rowStatus;
                this.goalTableData[this.rowIndex].finishedf =
                    this.finshedDate.substring(0, 10);
            }
            this.dialogVisible = false;
        },
        handlePage(value) {
            this.pageNum = value;
            this.getTableData(pageSize, (value - 1) * pageSize);
        },
        getTotalPage() {
            getTotalPage_g().then(row => { this.totalPage = row.count; })

        },
    },
    created: function () {
        this.getTableData(pageSize, 0);
        this.getTotalPage();
    },
};
</script>

<style scoped>
.el-dialog {
    height: 300px;
}
</style>