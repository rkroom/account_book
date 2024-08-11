<template>
    <el-row type="flex" :gutter="20">
        <el-col :span="16">
            <el-input v-model="inputFile" placeholder="导入账单" />
        </el-col>
        <el-button @click="openFile">选择文件</el-button>
        <el-button @click="confirmExport">开始导入</el-button>
        <el-table :data="tableData" style="width: 100%">
            <el-table-column prop="分类" label="分类" />
            <el-table-column prop="收支" label="收支" />
            <el-table-column prop="金额" label="金额" />
            <el-table-column prop="时间" label="时间" />
            <el-table-column prop="账户" label="账户" />
            <el-table-column prop="目标账户" label="目标账户" />
            <el-table-column prop="备注" label="备注" />
        </el-table>
    </el-row>

</template>
  
<script lang="ts" setup>
import { ref, getCurrentInstance } from 'vue'
import { dateFmt, parseExcelDate } from '../tools/tools'
import { getSpecificIdandName_A, getAccountOptions_s, importBillsFromExcel } from '../tools/dbTools'

const { proxy } = getCurrentInstance() as any
var xlsx = require('node-xlsx');
let inputFile = ref('')
let tableData = ref([{}])
const flows = { "收入": "income", "支出": "consume", "转账": "transfer" }

let sqlParams: any[]
let specificCategoryId: {}
getSpecificIdandName_A().then((r: any) => {
    r.forEach((element: any) => {
        specificCategoryId = { ...specificCategoryId, ...{ [element.specific_category]: element.id } }

    });
})
let accountNameAndId: {}
getAccountOptions_s().then((r: any) => {
    r.forEach((element: any) => {
        accountNameAndId = { ...accountNameAndId, ...{ [element.name]: element.id } }
    });
})



const openFile = () => {
    window.electronAPI.openFile().then((r: Array<string>) => {
        if (r.length != 0) {
            inputFile.value = r[0]
            let data = xlsx.parse(r[0])
            const tableTitle = data[2].data[0]
            tableData.value = []
            sqlParams = []
            const info = data[2].data.slice(1)
            info.forEach((element: any) => {
                tableData.value.push({
                    [tableTitle[0]]: element[0],
                    [tableTitle[1]]: element[1],
                    [tableTitle[2]]: element[2],
                    [tableTitle[3]]: element[3],
                    [tableTitle[4]]: element[4],
                    [tableTitle[5]]: element[5],
                    [tableTitle[6]]: dateFmt("yyyy-MM-dd hh:mm:ss", parseExcelDate(element[6], false)),
                    "flow": flows[element[1] as keyof typeof flows] ,
                    "category": specificCategoryId[element[0] as keyof typeof specificCategoryId],
                    "account": accountNameAndId[element[3] as keyof typeof accountNameAndId]
                })
                sqlParams.push([specificCategoryId[element[0] as keyof typeof specificCategoryId], flows[element[1] as keyof typeof flows], element[2], accountNameAndId[element[3] as keyof typeof accountNameAndId], accountNameAndId[element[4] as keyof typeof accountNameAndId], element[5], dateFmt("yyyy-MM-dd hh:mm:ss", parseExcelDate(element[6], false))])
            });
        }
    })
}
const confirmExport = () => {
    if (sqlParams) {
        proxy.$confirm(
            "将导入" + sqlParams.length + "条数据，导入后将无法撤销。",
            "提示",
            {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
            }
        ).then(() => {
            importBillsFromExcel(sqlParams).then((r: any) => {
                sqlParams = []
                proxy.$notify({
                    type: "success",
                    message: "导入成功",
                })
            }).catch((r) => {
                proxy.$alert("导入失败：" + r, {
                    confirmButtonText: '确定',
                })
            })
        }).catch(() => {
            proxy.$notify({
                type: "info",
                message: "已取消导入",
            })
        })
    } else {
        proxy.$alert("无可导入数据", {
            confirmButtonText: '确定',
        })
    }
}
</script>
  