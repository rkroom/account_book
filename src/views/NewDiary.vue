<template>
  <el-form ref="newDiary" :model="diary" :rules="rules">
    <el-col :span="5">
      <el-form-item label="日期" prop="datetime">
        <el-date-picker
          v-model="diary.datetime"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="选择日期"
          style="width: 135px"
          :picker-options="pickerOptions"
        >
        </el-date-picker>
      </el-form-item>
    </el-col>
    <el-col :span="5">
      <el-form-item label="天气" prop="weather">
        <el-input
          v-model="diary.weather"
          placeholder="请输入天气"
          style="width: 135px"
        ></el-input>
      </el-form-item>
    </el-col>
    <el-col :span="5">
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="diary.title"
          placeholder="请输入标题"
          style="width: 135px"
        ></el-input>
      </el-form-item>
    </el-col>
    <el-col :span="16">
      <el-form-item prop="content">
        <el-input
          type="textarea"
          :autosize="{ minRows: 15, maxRows: 25 }"
          placeholder="请输入内容"
          v-model="diary.content"
        >
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSave('newDiary')">保存</el-button>
      </el-form-item>
    </el-col>
  </el-form>
</template>

<script>
import db from "@/utils/sqdb";
import { dateFtt } from "@/utils/common"; //日期格式化

export default {
  name: "newdiary",
  data() {
    return {
      diary: {
        datetime: dateFtt("yyyy-MM-dd hh:mm:ss", new Date()),
        weather: "晴",
        title: null,
        content: "",
      },
      diaryid: "",
      rules: {
        datetime: [{ required: true, message: "请选择日期", trigger: "blur" }],
        weather: [{ required: true, message: "请输入天气", trigger: "blur" }],
        content: [{ required: true, message: "请添加内容", trigger: "blur" }],
      },
      pickerOptions: {
        shortcuts: [
          {
            text: "今天",
            onClick(picker) {
              picker.$emit("pick", new Date());
            },
          },
          {
            text: "昨天",
            onClick(picker) {
              const date = new Date();
              date.setTime(date.getTime() - 3600 * 1000 * 24);
              picker.$emit("pick", date);
            },
          },
          {
            text: "一周前",
            onClick(picker) {
              const date = new Date();
              date.setTime(date.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit("pick", date);
            },
          },
        ],
      },
    };
  },
  props: {
    diaryData: {
      type: String,
      default: "",
    },
  },
  methods: {
    onSave(diary) {
      this.$refs[diary].validate((valid) => {
        if (valid) {
          db.serialize(() => {
            if (this.diaryid) {
              db.run(
                `UPDATE diaries_diary_info SET diarydate = ?, weather = ?,title = ?, content = ? where id = ?`,
                [
                  this.diary.datetime,
                  this.diary.weather,
                  this.diary.title,
                  this.diary.content,
                  this.diaryid,
                ]
              );
              this.$notify({
                message: "更新成功",
                duration: 1500,
                type: "success",
              });
            } else {
              db.run(
                `INSERT INTO diaries_diary_info(diarydate,weather,title,content) values (?,?,?,?)`,
                [
                  this.diary.datetime,
                  this.diary.weather,
                  this.diary.title,
                  this.diary.content,
                ]
              );
              db.get(
                `SELECT * from diaries_diary_info order by id desc limit 1`,
                [],
                (err, row) => {
                  if (err) {
                    throw err;
                  }
                  this.diaryid = row.id;
                }
              );
              this.$notify({
                message: "保存成功",
                duration: 1500,
                type: "success",
              });
            }
          });
        }
      });
    },
  },
  mounted: function () {
    if (this.diaryData) {
      this.diary = this.diaryData;
      this.diary.datetime = this.diaryData.diarydate;
      this.diaryid = this.diaryData.id;
    }
  },
  watch: {
    diaryData: function () {
      if (this.diaryData) {
        this.diary = this.diaryData;
        this.diary.datetime = this.diaryData.diarydate;
        this.diaryid = this.diaryData.id;
      }
    },
  },
};
</script>
