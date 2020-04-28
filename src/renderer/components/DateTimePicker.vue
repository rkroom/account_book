<template>
    <el-popover ref="dateTimeVisible" @show="selectTime" placement="right" width="400" trigger="click">
      <el-date-picker
        v-model="queryDateLocal"
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
        @blur="closePop"	
        ref="datePicker"
      ></el-date-picker>
      <i v-if="icon" class="el-icon-arrow-down" slot="reference"></i>
      <el-button v-if="button" slot="reference">选择时间</el-button>
    </el-popover>
</template>

<script>
import { currentlyMonthDays, previousMonthDays } from "@/utils/common.js";

const pmd = previousMonthDays();
const cmd = currentlyMonthDays();

export default {
  name: "DateTimePicker",
  model: {
    prop: "queryDateLocal",
    event: "sendDate"
  },
  props: {
    queryDate: {
      type: Array,
      default: function() {
        return [];
      }
    },
    icon:{
      type:Boolean,
      default:false
    }
  },
  data() {
    return {
      queryDateLocal:this.queryDate,
      button:true,
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
    dateTime(value) {
      if(value){
      this.$emit("sendDate", this.queryDateLocal);
      }else{
        this.$emit("sendDate", ["0000-00-00", "now"]);
      }
    },
    closePop(){
      this.$refs.dateTimeVisible.doClose()
    }
  },
  created:function(){
    if(this.icon){
      this.button = false
    }
  }
};
</script>