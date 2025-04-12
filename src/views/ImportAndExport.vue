<template>
    <el-row type="flex" :gutter="20">
        <el-col :span="16">
            <el-input v-model="inputFile" placeholder="导入账单" />
        </el-col>
        <el-button @click="openFile">选择文件</el-button>
        <el-button @click="confirmExport">开始导入</el-button>
        <el-button @click="exportTemplate">导出模板</el-button>
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
import ExcelJS from 'exceljs'
import { dateFmt } from '../tools/tools'
import { getSpecificIdandName_A, getAccountIDName, importBillsFromExcel, getFirstLevel, getCategoryInfo } from '../tools/dbTools'

const { proxy } = getCurrentInstance() as any
let inputFile = ref('')
let tableData = ref([{}])
const flows = { "收入": "income", "支出": "consume", "转账": "transfer" }

let sqlParams: Array<ExcelBillTuple>
let specificCategoryId: {}
getSpecificIdandName_A().then((r: any) => {
    r.forEach((element: any) => {
        specificCategoryId = { ...specificCategoryId, ...{ [element.specific_category]: element.id } }
    });
})
let accountNameAndId: {}
getAccountIDName().then((r: any) => {
    r.forEach((element: any) => {
        accountNameAndId = { ...accountNameAndId, ...{ [element.name]: element.id } }
    });
})

const openFile = () => {
    window.electronAPI.openFile().then(async (r: Array<string>) => {
        if (r.length != 0) {
            inputFile.value = r[0]
            const buffer = await window.electronAPI.readFileBuffer(r[0]);
            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.load(buffer)

            const worksheet = workbook.getWorksheet("账单")

            if (!worksheet) {
                throw new Error("未找到指定的工作表");
            }

            // 获取表头
            const tableTitle: string[] = []
            worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
                tableTitle.push(cell.text)
            })
            // 处理数据行
            tableData.value = []
            sqlParams = []
            for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
                const row = worksheet.getRow(rowNumber)
                const rowData: any[] = []
                row.eachCell({ includeEmpty: true }, (cell) => {
                    let value;
                    if (cell.value && typeof cell.value === 'object' && 'formula' in cell.value) {
                        value = cell.value.result;
                    } else {
                        value = cell.value;
                    }
                    rowData.push(value);
                });

                let formattedTime = dateFmt("yyyy-MM-dd hh:mm:ss", new Date(
                    //将exceljs读取的日期转换为本地时区
                    rowData[3].getTime() + rowData[3].getTimezoneOffset() * 60000
                ))

                tableData.value.push({
                    [tableTitle[0]]: rowData[0],
                    [tableTitle[1]]: rowData[1],
                    [tableTitle[2]]: rowData[2],
                    [tableTitle[3]]: formattedTime,
                    [tableTitle[4]]: rowData[4],
                    [tableTitle[5]]: rowData[5],
                    [tableTitle[6]]: rowData[6],
                    "flow": flows[rowData[1] as keyof typeof flows],
                    "category": specificCategoryId[rowData[0] as keyof typeof specificCategoryId],
                    "account": accountNameAndId[rowData[4] as keyof typeof accountNameAndId]
                })
                sqlParams.push([
                    specificCategoryId[rowData[0] as keyof typeof specificCategoryId],
                    flows[rowData[1] as keyof typeof flows],
                    rowData[2],
                    accountNameAndId[rowData[4] as keyof typeof accountNameAndId],
                    accountNameAndId[rowData[5] as keyof typeof accountNameAndId] || null, // 处理可能为空的目标账户
                    rowData[6],
                    formattedTime,
                ])
            }
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
            importBillsFromExcel(sqlParams).then(() => {
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

// Helper：数字转列字母（例如 1 -> A, 2 -> B 等）
function columnLetter(col: number): string {
    let letter = "";
    while (col > 0) {
        const mod = (col - 1) % 26;
        letter = String.fromCharCode(65 + mod) + letter;
        col = Math.floor((col - mod) / 26);
    }
    return letter;
}

const exportTemplate = async () => {
    const [firstLevel, categoryInfo, accountIDName] = await Promise.all([
        getFirstLevel(),
        getCategoryInfo(),
        getAccountIDName()
    ]);
    try {
        // 创建 Excel 工作簿
        const workbook = new ExcelJS.Workbook();

        // 第一页：原始账单
        const dropDownSheet = workbook.addWorksheet("原始账单");
        // 第二页：选项
        const groupedSheet = workbook.addWorksheet("选项");
        // 第三页：账单
        const worksheet = workbook.addWorksheet("账单");

        // -------------------------------------
        // Step 1: 在“原始账单”工作表添加表头
        // -------------------------------------
        const originalBillHeaders = [
            "交易时间", "交易类型", "交易对方", "商品",
            "收/支", "金额(元)", "支付方式", "当前状态",
            "收支", "一级", "二级", "账户", "目标账户", "备注"
        ];
        dropDownSheet.addRow(originalBillHeaders);

        // -------------------------------------
        // Step 2: 在“账单”工作表添加表头
        // -------------------------------------
        const headers = ["分类", "收支", "金额", "时间", "账户", "目标账户", "备注"];
        worksheet.addRow(headers);

        // ================================
        // Block 1：firstLevel 按 flow_sign 分组
        // ================================
        const groupMap1: Record<string, string[]> = {};
        firstLevel.forEach(item => {
            if (!groupMap1[item.flow_sign]) {
                groupMap1[item.flow_sign] = [];
            }
            groupMap1[item.flow_sign].push(item.first_level);
        });
        const block1Keys = Object.keys(groupMap1);
        // 构造反向映射：英文 value -> 中文键
        const reverseFlows: Record<string, string> = Object.fromEntries(
            Object.entries(flows).map(([k, v]) => [v, k])
        );
        const header1 = block1Keys.map(key => reverseFlows[key] || key);
        const maxRows1 = block1Keys.length ? Math.max(...block1Keys.map(key => groupMap1[key].length)) : 0;
        const rows1: string[][] = [];
        for (let i = 0; i < maxRows1; i++) {
            const rowData = block1Keys.map(key => groupMap1[key][i] || "");
            rows1.push(rowData);
        }

        // 按每列实际数据创建命名区域
        header1.forEach((header, index) => {
            const colIndex = index + 1; // Excel 列从 1 开始
            const colLetterStr = columnLetter(colIndex);
            const key = block1Keys[index];
            const actualRowCount = groupMap1[key].length;
            const range = `选项!$${colLetterStr}$2:$${colLetterStr}$${actualRowCount + 1}`;
            workbook.definedNames.add(range, header);
        });

        // ================================
        // Block 2：categoryInfo 按 first_level 分组，仅显示 specific_category
        // ================================
        const groupMap2: Record<string, string[]> = {};
        categoryInfo.forEach(item => {
            if (!groupMap2[item.first_level]) {
                groupMap2[item.first_level] = [];
            }
            groupMap2[item.first_level].push(item.specific_category);
        });
        const header2 = Object.keys(groupMap2);
        const maxRows2 = header2.length ? Math.max(...Object.values(groupMap2).map(arr => arr.length)) : 0;
        const rows2: string[][] = [];
        for (let i = 0; i < maxRows2; i++) {
            const rowData = header2.map(fl => groupMap2[fl][i] || "");
            rows2.push(rowData);
        }

        // 按每列实际数据创建命名区域
        header2.forEach((firstLevel, index) => {
            const excelColNumber = header1.length + index + 2;
            const colLetter = columnLetter(excelColNumber);
            const actualRowCount = groupMap2[firstLevel].length;
            const startRow = 2;
            const endRow = actualRowCount + 1;
            const range = `选项!$${colLetter}$${startRow}:$${colLetter}$${endRow}`;
            workbook.definedNames.add(range, firstLevel);
        });

        // ================================
        // Block 3：直接遍历 categoryInfo，输出 [specific_category, id]
        // ================================
        const thirdBlockData: (string | number)[][] = categoryInfo.map(item => [item.specific_category, item.id]);
        const block3Header = thirdBlockData.length > 0 ? thirdBlockData[0] : ["", ""];
        const block3Rows = thirdBlockData.length > 1 ? thirdBlockData.slice(1) : [];

        // ================================
        // Block 4：输出 accountIDName，每条记录为 [name, id]
        // ================================
        const accountBlockData: (string | number)[][] = accountIDName.map(item => [item.name, item.id]);
        const block4Header = accountBlockData.length > 0 ? accountBlockData[0] : ["", ""];
        const block4Rows = accountBlockData.length > 1 ? accountBlockData.slice(1) : [];

        // ================================
        // Block 5：输出 flows 对象，每条记录为 [中文key, 英文value]
        // ================================
        const flowsBlockData: string[][] = Object.entries(flows).map(([k, v]) => [k, v]);
        const block5Header = flowsBlockData.length > 0 ? flowsBlockData[0] : ["", ""];
        const block5Rows = flowsBlockData.length > 1 ? flowsBlockData.slice(1) : [];

        // =======================================
        // 合并所有块数据到“选项”工作表中，各块之间隔一列空白
        // =======================================
        const combinedHeader = [
            ...header1,
            "",
            ...header2,
            "",
            ...block3Header,
            "",
            ...block4Header,
            "",
            ...block5Header
        ];
        groupedSheet.addRow(combinedHeader);

        const totalRows = Math.max(
            rows1.length,
            rows2.length,
            block3Rows.length,
            block4Rows.length,
            block5Rows.length
        );
        for (let i = 0; i < totalRows; i++) {
            const rowBlock1 = i < rows1.length ? rows1[i] : new Array(header1.length).fill("");
            const rowBlock2 = i < rows2.length ? rows2[i] : new Array(header2.length).fill("");
            const rowBlock3 = i < block3Rows.length ? block3Rows[i] : ["", ""];
            const rowBlock4 = i < block4Rows.length ? block4Rows[i] : ["", ""];
            const rowBlock5 = i < block5Rows.length ? block5Rows[i] : ["", ""];
            const combinedRow = [
                ...rowBlock1,
                "",
                ...rowBlock2,
                "",
                ...rowBlock3,
                "",
                ...rowBlock4,
                "",
                ...rowBlock5
            ];
            groupedSheet.addRow(combinedRow);
        }

        // ================================
        // 为“选项”工作表中有数据的单元格添加边框
        // ================================
        groupedSheet.eachRow((row) => {
            row.eachCell({ includeEmpty: true }, (cell) => {
                const cellValue = cell.value;
                if (
                    cellValue !== null &&
                    cellValue !== undefined &&
                    cellValue.toString().trim() !== ""
                ) {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" }
                    };
                }
            });
        });

        // -----------------------------------------------------
        // Step 3: 在“原始账单”工作表设置数据验证
        // -----------------------------------------------------
        dropDownSheet.getCell("I2").dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: ['"收入,支出"'],
            showErrorMessage: true,
            errorStyle: "warning",
            errorTitle: "无效值",
            error: "请选择列表中的值"
        };

        dropDownSheet.getCell("I2").value = "收入";

        dropDownSheet.getCell("J2").dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: ['=INDIRECT(I2)'],
            showErrorMessage: true,
            errorStyle: "warning",
            errorTitle: "无效值",
            error: "请选择列表中的值"
        };

        const defaultFlowKey = Object.keys(groupMap1).find(key => reverseFlows[key] === "收入");
        if (defaultFlowKey && groupMap1[defaultFlowKey].length > 0) {
            // 将对应组的第一项设置为 J2 默认值
            dropDownSheet.getCell("J2").value = groupMap1[defaultFlowKey][0];
        }

        dropDownSheet.getCell("K2").dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: ['=INDIRECT(J2)'],
            showErrorMessage: true,
            errorStyle: "warning",
            errorTitle: "无效值",
            error: "请选择列表中的值"
        };

        const defaultJ2 = dropDownSheet.getCell("J2").value?.toString();
        if (defaultJ2 && groupMap2[defaultJ2] && groupMap2[defaultJ2].length > 0) {
            dropDownSheet.getCell("K2").value = groupMap2[defaultJ2][0];
        }

        const block4NameColIndex = header1.length + 1 + header2.length + 1 + block3Header.length + 1 + 1;
        const block4NameColLetter = columnLetter(block4NameColIndex);
        const lastRow = accountIDName.length;

        dropDownSheet.getCell("L2").dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`=选项!$${block4NameColLetter}$1:$${block4NameColLetter}$${lastRow}`],
            showErrorMessage: true,
            errorStyle: "warning",
            errorTitle: "无效值",
            error: "请选择列表中的值"
        };

        if (accountIDName.length > 0) {
            dropDownSheet.getCell("L2").value = accountIDName[0].name;
        }

        worksheet.getCell('A2').value = { formula: '原始账单!K2' }
        worksheet.getCell('B2').value = { formula: '原始账单!I2' }
        worksheet.getCell('C2').value = { formula: '原始账单!F2' }
        worksheet.getCell('D2').value = { formula: '原始账单!A2' }
        worksheet.getCell('E2').value = { formula: '原始账单!L2' }

        // -------------------------------
        // 生成 Excel 文件并保存
        // -------------------------------
        const buffer = await workbook.xlsx.writeBuffer();
        const nodeBuffer = Buffer.from(buffer);
        await window.electronAPI.saveFile(nodeBuffer, "账单模板.xlsx");

        proxy.$notify({
            type: "success",
            message: "模板导出成功"
        });
    } catch (error) {
        proxy.$alert("模板导出失败：" + error, {
            confirmButtonText: "确定"
        });
    }
};

</script>