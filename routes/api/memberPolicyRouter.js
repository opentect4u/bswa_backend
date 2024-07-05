const { db_Select } = require("../../modules/MasterModule");

const memberPolicyRouter = require("express").Router(),
  fs = require("fs"),
  path = require("path");

memberPolicyRouter.post("/member_policy_dtls", async (req, res) => {
  var data = req.body;
  var select = "a.form_no,a.member_id,a.association,a.memb_name,b.unit_name",
    table_name = "td_stp_ins a, md_unit b",
    // whr = data.flag
    //   ? `form_no = '${data.form_no}'`
    //   : data.mem_id
    //   ? `member_id = '${data.mem_id}'`
    //   : null,
    whr = `a.association = b.unit_id`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

module.exports = { memberPolicyRouter };
