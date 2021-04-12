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
import HomeTable from "@/views/reportManage/CommonReport/components/HomeTable";

export default {
  components: {
    HomeTable
  },
  data() {
    //   t_Rpt_StorageAge
    return {
      fTableView: "t_CarPositionInfo",
      //是否新增成功
      isSaveSuccess: false
    };
  }
};
</script>
<style lang="scss"></style>
