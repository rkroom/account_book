<template>
  <div>
    <el-row type="flex">
      <!--记账组件-->
      <PayForm></PayForm>
    </el-row>
    <el-row type="flex">
      <!--显示账单组件-->
      <BookTable accountId="%"></BookTable>
      <el-col :span="2"> </el-col>
    </el-row>
  </div>
</template>
<script>
import PayForm from "@/components/PayForm"; //引入记账组件
import BookTable from "@/components/BookTable"; //引入显示账单组件

export default {
  name: "book-page",
  components: { PayForm, BookTable }, //注册为组件
};
</script>
