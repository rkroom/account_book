<template>
  <el-popover
    ref="dateTimeVisible"
    @show="selectTime"
    placement="right"
    width="400"
    trigger="click"
  >
    <template #reference>
      <el-button type="text" icon="el-icon-arrow-down"></el-button>
    </template>
    <el-date-picker
      v-model="queryDateLocal"
      type="datetimerange"
      align="right"
      unlink-panels
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      :shortcuts="pickerOptions"
      @change="dateTime"
      @blur="closePop"
      ref="datePicker"
      value-format="YYYY-MM-DD HH:mm:ss"
    ></el-date-picker>
  </el-popover>
</template>

<script>
import { currentlyMonthDays, previousMonthDays } from "@/utils/common";
const pmd = previousMonthDays();
const cmd = currentlyMonthDays();
export default {
  name: "DateTimePicker",
  props: {
    modelValue: {
      type: Array,
      default: function () {
        return [];
      },
    },
    queryDate: {
      type: Array,
      default: function () {
        return [];
      },
    },
  },
  data() {
    return {
      queryDateLocal: this.queryDate,
      pickerOptions: [
        {
          text: "最近一周",
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
            picker.$emit("pick", [start, end]);
          },
        },
        {
          text: "最近30天",
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
            picker.$emit("pick", [start, end]);
          },
        },
        {
          text: "上一月份",
          onClick(picker) {
            const end = pmd[1];
            const start = pmd[0];
            picker.$emit("pick", [start, end]);
          },
        },
        {
          text: "本月",
          onClick(picker) {
            const end = cmd[1];
            const start = cmd[0];
            picker.$emit("pick", [start, end]);
          },
        },
      ],
    };
  },
  methods: {
    selectTime() {
      this.$refs.datePicker.pickerVisible = true;
    },
    dateTime(value) {
      if (value) {
        this.$emit("update:modelValue", value);
      } else {
        this.$emit("update:modelValue", ["0000-00-00", "now"]);
      }
    },
    closePop() {
      this.$refs.dateTimeVisible.autoClose;
    },
  },
};
</script>
