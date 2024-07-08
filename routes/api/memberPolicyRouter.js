const { db_Select, db_Insert } = require("../../modules/MasterModule");

const memberPolicyRouter = require("express").Router(),
  fs = require("fs"),
  path = require("path");

memberPolicyRouter.post("/member_policy_dtls", async (req, res) => {
  var data = req.body;
  var select =
      "a.form_no,a.member_id,a.association,a.memb_name,a.policy_holder_type,b.unit_name",
    table_name = "td_stp_ins a, md_unit b",
    // whr = data.flag
    //   ? `form_no = '${data.form_no}'`
    //   : data.mem_id
    //   ? `member_id = '${data.mem_id}'`
    //   : null,
    whr = `a.association = b.unit_id`;
  order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

memberPolicyRouter.post("/member_policy_dtls_view", async (req, res) => {
  var data = req.body;
  var select =
      "a.form_no,a.form_dt,a.fin_yr,a.policy_holder_type,a.member_id,a.association,a.memb_type,a.memb_oprn,a.memb_name,a.dob,a.mem_address,a.phone_no,a.min_no,a.personel_no,a.dependent_name,a.spou_min_no,a.spou_dob,a.spou_phone,a.spou_address",
    table_name = "td_stp_ins a",
    whr = `a.form_no = '${data.form_no}'
      AND a.member_id = '${data.member_id}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  //   console.log(res_dt, "lolo");

  if (res_dt.suc > 0) {
    var select = "sl_no,ind_type,fin_year,particulars,amount,treatment_dtls",
      table_name = "td_stp_dtls",
      whr = `form_no = '${data.form_no}'`,
      order = null;
    var dep_dt = await db_Select(select, table_name, whr, order);
    res_dt.msg[0]["dep_dt"] =
      dep_dt.suc > 0 ? (dep_dt.msg.length > 0 ? dep_dt.msg : []) : [];
  }
  console.log(dep_dt, "iii");
  res.send(res_dt);
});

memberPolicyRouter.post("/update_member_policy_dtls", async (req, res) => {
  var data = req.body.data;
  data = JSON.parse(data, "juju");
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

  var table_name = "td_stp_ins",
    fields = `association = '${data.unit_nm}', personel_no = '${data.personal_no}', memb_oprn = '${data.memb_opr}', memb_name = '${data.member}', min_no = '${data.min_no}',dob = '${data.gen_dob}', phone_no = '${data.mobile}', fin_yr = '${data.fin_yr}', mem_address = '${data.mem}',dependent_name = '${data.spouse}', spou_min_no	 = '${data.spouse_min_no}', spou_dob = '${data.spou_dob}', spou_phone = '${data.spou_mobile}', spou_address = '${data.spou_mem}',
    modified_by = '${data.user}', modified_at = '${datetime}'`,
    values = null,
    whr = `form_no = '${data.form_no}'`,
    flag = 1;
  var res_dt = await db_Insert(table_name, fields, values, whr, flag);

  if (data.depenFields_2.length > 0) {
    for (let dt of data.depenFields_2) {
      var table_name = "td_stp_dtls",
        fields =
          dt.sl_no > 0
            ? `fin_year = '${dt.fin_year}',
     amount = '${dt.amount}', particulars = '${dt.particulars}', treatment_dtls = '${dt.treatment_dtls}',
     modified_by = '${data.user}', modified_at = '${datetime}'`
            : `(form_no,sl_no,ind_type,fin_year,amount,particulars,treatment_dtls,created_by,created_at)`,
        values = `SELECT '${data.form_no}',max(sl_no)+1,'${dt.ind_type}','${dt.fin_year}','${dt.amount}','${dt.particulars}','${dt.treatment_dtls}','${data.user}','${datetime}' from td_stp_dtls WHERE form_no = '${data.form_no}'`,
        whr =
          dt.sl_no > 0
            ? `form_no = '${data.form_no}' AND sl_no = ${dt.sl_no}`
            : null,
        flag = dt.sl_no > 0 ? 1 : 0;
      var spou_dt = await db_Insert(
        table_name,
        fields,
        values,
        whr,
        flag,
        true
      );
    }
  }
  res.send(res_dt);
});

memberPolicyRouter.post("/member_gmp_policy_dtls", async (req, res) => {
  var data = req.body;
  var select =
      "a.form_no,a.member_id,a.association,a.memb_name,a.policy_holder_type,b.unit_name",
    table_name = "td_gen_ins a, md_unit b",
    whr = `a.association = b.unit_id`;
  order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

module.exports = { memberPolicyRouter };
