<template>
  <div>
    <HomeTable
      :fTableView="fTableView"
      :isSaveSuccess="isSaveSuccess"
      :Desc="'order by fCreateDate desc'"
    ></HomeTable>
  </div>
</template>
<script>
import HomeTable from "./components/HomeTable";

export default {
  components: {
    HomeTable
  },
  data() {
    //   t_Rpt_StorageAge
    return {
      fTableView: "",
      //是否新增成功
      isSaveSuccess: false
    };
  },
  created() {
    let curretUrl = this.$route.path;
    let strArr = curretUrl.split("/");
    console.log(strArr)
    this.fTableView = strArr[3];
  }
};
</script>
<style lang="scss"></style>
