<template>
    <div>
        <el-form ref="schedule" :model="schedule" :rules="rules">
            <el-col>
                <el-form-item label="创建日期" prop="createDate">
                    <el-date-picker v-model="schedule.createDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
                        placeholder="选择日期" style="width: 180px">
                    </el-date-picker>
                </el-form-item>
            </el-col>
            <el-col>
                <el-form-item label="周期&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" prop="round">
                    <el-select v-model="schedule.round" placeholder="请选择周期" style="width: 180px"
                        @change="handleRoundChange">
                        <el-option v-for="item in roundOptions" :key="item.value" :label="item.label"
                            :value="item.value">
                        </el-option>
                    </el-select>
                </el-form-item>
            </el-col>
            <el-col v-show="roundDays">
                <el-form-item label="日期" prop="days">
                    <el-select v-model="schedule.days" placeholder="请选择日期" style="width: 180px">
                        <el-option v-for="item in daysOptions" :key="item.value" :label="item.label"
                            :value="item.value">
                        </el-option>
                    </el-select>
                </el-form-item>
            </el-col>
            <el-col v-show="expectDate">
                <el-form-item :label="expect" prop="expect">
                    <el-date-picker v-model="schedule.expectDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
                        placeholder="选择日期" style="width: 180px">
                    </el-date-picker>
                </el-form-item>
            </el-col>
            <el-col v-show="customDays">
                <el-form-item prop="customDyas" label="天数">
                    <el-input placeholder="请输入天数" v-model.number="schedule.customDays" style="width: 100px">
                    </el-input>
                </el-form-item>
            </el-col>
            <el-col :span="16">
                <el-form-item prop="project" label="计划">
                    <el-col :span="16">
                        <el-input placeholder="请输入内容" v-model="schedule.project">
                        </el-input>
                    </el-col>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="onSave('schedule')">保存</el-button>
                </el-form-item>
            </el-col>
        </el-form>
        <el-table :data="scheduleTableData" style="width: 100%" @row-click="handleRowClick" ref="scheduleTable">
            <el-table-column type="expand">
                <template v-slot="props">
                    <el-table :data="props.row.handleinfo" row-class-name="nestingrow">
                        <el-table-column prop="handledate" label="完成日期">
                        </el-table-column>
                        <el-table-column prop="comment" label="备注"> </el-table-column>
                    </el-table>
                </template>
            </el-table-column>
            <el-table-column prop="createdf" label="创建日期" width="120">
            </el-table-column>
            <el-table-column prop="content" label="日程" :show-overflow-tooltip="true">
            </el-table-column>
            <el-table-column prop="roundf" label="周期" width="80"> </el-table-column>
            <el-table-column prop="datef" label="日期" width="140"> </el-table-column>
            <el-table-column label="最近完成" width="120">
                <template v-slot="scope">
                    <el-button link type="primary" @click.stop="handleRound(scope.$index, scope.row)">
                        {{ scope.row.thisround }}
                    </el-button>
                </template>
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

        <el-dialog title="循环记录" :modal="false" v-model="dialogRound" width="20%" :before-close="handleClose">
            <el-input v-model="handleComment" placeholder="请输入备注"></el-input>
            <p>时间</p>
            <el-date-picker v-model="finshedDate" type="datetime" placeholder="请选择日期" value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 135px">
            </el-date-picker>
            <template #footer>
                <span class="dialog-footer">
                    <el-button type="primary" @click="handleInfo">确 定</el-button>
                </span>
            </template>
        </el-dialog>

        <el-dialog title="状态" :modal="false" v-model="dialogVisible" width="20%" :before-close="handleClose">
            <el-select v-model="rowStatus" placeholder="请选择" @change="handleStatusChange" style="width: 135px">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value">
                </el-option>
            </el-select>
            <p>时间</p>
            <el-date-picker v-model="finshedDate" type="datetime" placeholder="请选择日期" value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 135px">
            </el-date-picker>
            <template #footer>
                <span class="dialog-footer">
                    <el-button type="primary" @click="updateSchedule">确 定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import {
    addYearSchedule,
    addDaySchedule,
    addMonthSchedule,
    addCustomSchedule,
    getLastSchedule,
    getTotalPage_schedule,
    updateSchedule_schedule,
    handleInfo_schedule,
    getTableData_schedule,
    getHandleInfo_schedule
} from "../tools/dbTools"
import { dateFmt } from "../tools/tools";
const pageSize = 13;

export default {
    name: "schedule",
    data() {
        var checkDays = (rule, value, callback) => {
            if (this.roundDays) {
                if (value) {
                    return callback();
                } else {
                    return callback(new Error("请选择日期"));
                }
            } else {
                return callback();
            }
        };
        var checkExpect = (rule, value, callback) => {
            if (this.expectDate) {
                if (this.schedule.expectDate) {
                    return callback();
                } else {
                    return callback(new Error("请选择日期"));
                }
            } else {
                return callback();
            }
        };
        var checkCustom = (rule, value, callback) => {
            if (this.customDays) {
                if (Number(this.schedule.customDays) > 0) {
                    return callback();
                } else {
                    return callback(new Error("请输入天数"));
                }
            } else {
                return callback();
            }
        };
        return {
            schedule: {
                createDate: dateFmt("yyyy-MM-dd hh:mm:ss", new Date()),
                round: null,
                days: null,
                expectDate: null,
                project: "",
                customDays: null,
            },
            rules: {
                createDate: [
                    { required: true, message: "请选择日期", trigger: "blur" },
                ],
                round: [{ required: true, message: "请选择周期", trigger: "blur" }],
                days: [{ validator: checkDays, trigger: "blur" }],
                expect: [{ validator: checkExpect, trigger: "blur" }],
                project: [
                    { required: true, message: "请输入计划内容", trigger: "blur" },
                ],
                customDyas: [{ validator: checkCustom, trigger: "blur" }],
            },
            scheduleTableData: [],
            roundOptions: [
                {
                    value: "once",
                    label: "一次",
                },
                {
                    value: "day",
                    label: "每天",
                },
                {
                    value: "week",
                    label: "每周",
                },
                {
                    value: "month",
                    label: "每月",
                },
                {
                    value: "year",
                    label: "每年",
                },
                {
                    value: "custom",
                    label: "自定义",
                },
            ],
            dialogVisible: false,
            dialogRound: false,
            expectDate: false,
            roundDays: false,
            customDays: false,
            totalPage: 0,
            daysOptions: [],
            status: { continuing: "进行中", finshed: "已完成", giveup: "已放弃" },
            roundLabel: {
                once: "一次",
                day: "每天",
                week: "每周",
                month: "每月",
                year: "每年",
                custom: "自定义",
            },
            finshedDate: dateFmt("yyyy-MM-dd hh:mm:ss", new Date()),
            expect: "预计日期",
            rowStatus: "",
            statusOptions: [
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
            rowIndex: "",
            tempRow: [],
            handleComment: null,
            pageNum: 1,
        };
    },
    filters: {},
    methods: {
        onSave(schedule) {
            this.$refs[schedule].validate((valid) => {
                if (valid) {
                    switch (this.schedule.round) {
                        case "once":
                        case "year":
                            addYearSchedule(
                                this.schedule.createDate,
                                this.schedule.project,
                                this.schedule.expectDate,
                                this.schedule.round,
                            );
                            break;
                        case "day":
                            addDaySchedule(
                                this.schedule.createDate,
                                this.schedule.project,
                                this.schedule.round,
                            );
                            break;
                        case "week":
                        case "month":
                            addMonthSchedule(
                                this.schedule.createDate,
                                this.schedule.project,
                                this.schedule.round,
                                this.schedule.days,
                            );
                            break;
                        case "custom":
                            addCustomSchedule(
                                this.schedule.createDate,
                                "schedule",
                                this.schedule.project,
                                this.schedule.expectDate,
                                "continuing",
                                this.schedule.round,
                                this.schedule.customDays,
                            );
                            break;
                    }
                    this.schedule.project = null;
                    getLastSchedule().then(row => {
                        row["thisround"] = "未完成";
                        switch (row.round) {
                            case "day":
                                break;
                            case "once":
                                row["datef"] = row.finaldate.substring(0, 10);
                                break;
                            case "year":
                                row["datef"] = row.finaldate.substring(5, 10);
                                break;
                            case "week":
                                row["datef"] = row.datesign;
                                break;
                            case "month":
                                row["datef"] = row.datesign + "日";
                                break;
                            case "custom":
                                row["datef"] =
                                    "每" +
                                    row.datesign +
                                    "日" +
                                    "（" +
                                    row.finaldate.substring(5, 10) +
                                    "）";
                                break;
                        }
                        row["roundf"] = this.roundLabel[row.round];
                        row["handleinfo"] = [];
                        this.scheduleTableData.unshift(row);
                    })
                }
            });
        },
        getTotalPage() {
            getTotalPage_schedule().then(row => {
                this.totalPage = row.count;
            })
        },
        handleRowClick(row) {
            this.$refs.scheduleTable.toggleRowExpansion(row);
        },
        getDO() {
            let options = [];
            for (var i = 1; i <= 7; i++) {
                options.push({ value: i, label: i });
            }
            this.daysOptions = options;
        },
        getMO() {
            let options = [];
            for (var i = 1; i <= 31; i++) {
                options.push({ value: i, label: i });
            }
            this.daysOptions = options;
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
        handleRound(index, row) {
            this.dialogRound = true;
            this.tempRow = row;
            this.rowIndex = index;
        },
        updateSchedule() {
            if (this.rowStatus && this.rowStatus !== "continuing") {
                updateSchedule_schedule(this.rowStatus, this.finshedDate, this.tempRow.id);
                this.scheduleTableData[this.rowIndex].status = this.rowStatus;
                this.scheduleTableData[this.rowIndex].finishedf =
                    this.finshedDate.substring(0, 10);
            }
            this.dialogVisible = false;
        },
        handleInfo() {
            handleInfo_schedule(this.tempRow.id, this.finshedDate, this.handleComment);
            this.scheduleTableData[this.rowIndex]["handleinfo"].push({
                handledate: this.finshedDate.substring(0, 10),
                comment: this.handleComment,
            });
            this.scheduleTableData[this.rowIndex]["thisround"] =
                this.finshedDate.substring(0, 10);
            this.handleComment = null;
            this.dialogRound = false;
        },
        handlePage(value) {
            this.pageNum = value;
            this.getTableData(pageSize, (value - 1) * pageSize);
        },
        handleRoundChange(value) {
            if (value === "custom") {
                this.expect = "起始日期";
            } else {
                this.expect = "预计日期";
            }
            switch (value) {
                case "day":
                    this.roundDays = false;
                    this.expectDate = false;
                    this.customDays = false;
                    this.schedule.days = null;
                    this.schedule.expectDate = null;
                    this.schedule.customDays = null;
                    break;
                case "year":
                    this.expectDate = true;
                    this.roundDays = false;
                    this.customDays = false;
                    this.schedule.days = null;
                    this.schedule.expectDate = null;
                    this.schedule.customDays = null;
                    break;
                case "once":
                    this.expectDate = true;
                    this.roundDays = false;
                    this.customDays = false;
                    this.schedule.days = null;
                    this.schedule.expectDate = null;
                    this.schedule.customDays = null;
                    break;
                case "week":
                    this.expectDate = false;
                    this.roundDays = true;
                    this.customDays = false;
                    this.schedule.days = null;
                    this.schedule.expectDate = null;
                    this.schedule.customDays = null;
                    this.getDO();
                    break;
                case "month":
                    this.expectDate = false;
                    this.roundDays = true;
                    this.customDays = false;
                    this.schedule.days = null;
                    this.schedule.expectDate = null;
                    this.schedule.customDays = null;
                    this.getMO();
                    break;
                case "custom":
                    this.expectDate = true;
                    this.roundDays = false;
                    this.customDays = true;
                    this.schedule.days = null;
                    this.schedule.expectDate = null;
                    this.schedule.customDays = null;
                    break;
            }
        },
        getTableData(pageSize, page) {
            getTableData_schedule(pageSize, page).then((result) => {
                result.forEach((row) => {
                    getHandleInfo_schedule(row.id).then(hr => {
                        row["handleinfo"] = hr;
                    })
                    let fdate = new Date(row.finaldate).getTime();
                    let nowdate = new Date().getTime();
                    //  let hdate = new Date(row.handledate).getTime()
                    if (row.handledate) {
                        row["thisround"] = row.handledate;
                    } else {
                        row["thisround"] = "未完成";
                    }
                    switch (row.round) {
                        case "day":
                            break;
                        case "once":
                            row["datef"] = row.finaldate.substring(0, 10);
                            break;
                        case "year":
                            row["datef"] = row.finaldate.substring(5, 10);
                            break;
                        case "week":
                            row["datef"] = row.datesign;
                            break;
                        case "month":
                            row["datef"] = row.datesign + "日";
                            break;
                        case "custom":
                            if (nowdate < fdate) {
                                row["datef"] =
                                    "每" +
                                    row.datesign +
                                    "日" +
                                    "（" +
                                    row.finaldate.substring(5, 10) +
                                    "）";
                            } else {
                                row["datef"] =
                                    "每" +
                                    row.datesign +
                                    "日" +
                                    "（" +
                                    dateFmt(
                                        "MM-dd",
                                        new Date(
                                            Math.ceil((nowdate - fdate) / (row.datesign * 86400000)) *
                                            (row.datesign * 86400000) +
                                            fdate
                                        )
                                    ) +
                                    "）";
                            }
                            break;
                    }
                    row["roundf"] = this.roundLabel[row.round];
                });
                this.scheduleTableData = result;
            });
        },
    },
    created: function () {
        this.getTotalPage();
        this.getTableData(pageSize, 0);
    },
};
</script>

<style scoped>
.el-dialog {
    height: 300px;
}

.el-table .nestingrow {
    background: #f0f9eb;
}
</style>