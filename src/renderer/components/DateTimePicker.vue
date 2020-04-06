<template>
  <div>
    <div style="display:none">
      <el-date-picker
        v-model="queryDate"
        type="datetimerange"
        align="right"
        unlink-panels
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :picker-options="pickerOptions"
        value-format="yyyy-MM-dd HH:mm:ss"
        :default-time="defaultTime"
        @change="dateTime"
        ref="datePicker"
      ></el-date-picker>
    </div>
    <el-button @click="selectTime">选择时间</el-button>
  </div>
</template>

<script>
import { currentlyMonthDays, previousMonthDays } from "@/utils/common.js";

const pmd = previousMonthDays();
const cmd = currentlyMonthDays();

export default {
  name: "DateTimePicker",
  model: {
    prop: "queryDate",
    event: "sendDate"
  },
  props: {
    queryDate: {
      type: Array,
      default: function() {
        return [];
      }
    }
  },
  data() {
    return {
      defaultTime: ["00:00:00", "23:59:59"],
      pickerOptions: {
        shortcuts: [
          {
            text: "最近一周",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit("pick", [start, end]);
            }
          },
          {
            text: "最近30天",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
              picker.$emit("pick", [start, end]);
            }
          },
          {
            text: "上一月份",
            onClick(picker) {
              const end = pmd[1];
              const start = pmd[0];
              picker.$emit("pick", [start, end]);
            }
          },
          {
            text: "本月",
            onClick(picker) {
              const end = cmd[1];
              const start = cmd[0];
              picker.$emit("pick", [start, end]);
            }
          }
        ]
      }
    };
  },
  methods: {
    selectTime() {
      this.$refs.datePicker.pickerVisible = true;
    },
    dateTime() {
      this.$emit("sendDate", this.queryDate);
    }
  }
};
</script>