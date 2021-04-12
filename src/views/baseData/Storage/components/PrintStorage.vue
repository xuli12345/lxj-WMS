<template>
  <div ref="toPrint">
    <div
      v-for="(item, index) in tableData"
      :key="index"
      style="align-items: center; width:100%;display:flex;"
    >
      <!--  -->
      <div v-for="(it, i) in item" :key="i" style="height:100vh;width:50%;">
      
        <div
          style="flex-direction: column;
    display: flex; height:100%"
        >
          <div
            v-for="(val, idx) in it"
            :key="idx"
            style="display: flex;
            flex-direction: column;  
             align-items: center;
             flex:1
            "
          >
            <div
              style="display:flex; justify-content: space-between; font-size:14px"
            >
              <div>
                {{
                  val.lastNum == "14"
                    ? "第四层"
                    : val.lastNum == "13"
                    ? "第三层"
                    : val.lastNum == "12"
                    ? "第二层"
                    : "第一层"
                }}
              </div>
            </div>

            <svg
              id="svg"
              :key="idx"
              class="barcode"
              :jsbarcode-value="val.fStorageBarCode"
              jsbarcode-textmargin="0"
              jsbarcode-height="75"
              jsbarcode-width="2"
              jsbarcode-fontoptions="bold"
            ></svg>
            <!-- <img
            style="width:40px"
            v-if="val.direction"
            src="@/assets/img/right.jpg"
            alt=""
          /> -->
            <!-- <img style="width:40px" v-else src="@/assets/img/left.jpg" alt="" /> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import JsBarcode from "jsbarcode";

export default {
  props: ["dataCode"],
  data() {
    return {
      tableData: [],
      dataTime: new Date()
    };
  },

  mounted() {
    this.tableData = this.dataCode;
    console.log(this.tableData, this.dataCode, "print");

    setTimeout(() => {
      JsBarcode(".barcode").init();
    }, 250);
  },
  watch: {
    dataCode(newVal, oldVal) {
      // console.log(newVal, "newVal");
      this.tableData = newVal;
      setTimeout(() => {
        JsBarcode(".barcode").init();
      }, 250);
    }
  }
};
</script>

<style>
.input-box /deep/.el-input__inner {
  border: none !important;
}
#svg {
  width: 100% !important;
}
</style>
