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

memberPolicyRouter.post("/member_gmp_policy_dtls_view", async (req, res) => {
  var data = req.body;
  var select =
      "form_no,form_dt,policy_holder_type,member_id,association,memb_type,memb_oprn,memb_name,father_husband_name,sex,marital_status,dob,form_type,ins_period,form_status,disease_flag,disease_type",
    table_name = "td_gen_ins",
    whr = `form_no = '${data.form_no}'
      AND member_id = '${data.member_id}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  console.log(res_dt, "lolo");

  if (res_dt.suc > 0) {
    var select =
        "sl_no,member_id,dept_name,relation,disease_flag,disease_type,dob spou_dob",
      table_name = "td_gen_ins_depend",
      whr = `form_no = '${data.form_no}'`,
      order = null;
    var dep_dt = await db_Select(select, table_name, whr, order);
    res_dt.msg[0]["dep_dt"] =
      dep_dt.suc > 0 ? (dep_dt.msg.length > 0 ? dep_dt.msg : []) : [];
  }

  if (res_dt.suc > 0) {
    var select =
        "form_no,premium_dt,premium_id,premium_amt,premium_amt2,prm_flag2,premium_amt3,prm_flag3",
      table_name = "td_premium_dtls",
      whr = `form_no = '${data.form_no}'`,
      order = null;
    var premium_dt = await db_Select(select, table_name, whr, order);
    res_dt.msg[0]["premium_dt"] =
      premium_dt.suc > 0
        ? premium_dt.msg.length > 0
          ? premium_dt.msg
          : []
        : [];
  }

  // console.log(premium_dt, "iii");
  res.send(res_dt);
});

memberPolicyRouter.post("/update_member_gmp_policy_dtls", async (req, res) => {
  var data = req.body;
  console.log(data, "bye");
  // data = JSON.parse(data, "hi");
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

  var table_name = "td_gen_ins",
    fields = `association = '${data.unit_nm}', memb_oprn = '${data.memb_oprn}', memb_name = '${data.member}', father_husband_name = '${data.gurdian}',sex = '${data.gen}', marital_status = '${data.marital_status}', dob = '${data.gen_dob}', disease_flag = '${data.type_diseases}',disease_type = '${data.name_diseases}',
    modified_by = '${data.user}', modified_at = '${datetime}'`,
    values = null,
    whr = `form_no = '${data.form_no}'`,
    flag = 1;
  var res_dt = await db_Insert(table_name, fields, values, whr, flag);

  var table_name = "td_premium_dtls",
    fields = `premium_id = '${data.grp_name}', premium_amt = '${
      data.pre_amont
    }', premium_amt2 = '${
      data.sup_top_flag == "p2" || data.sup_top_flag == "p3"
        ? `${data.sup_top_up}`
        : ""
    }', prm_flag2 = '${
      data.sup_top_flag == "p2" || data.sup_top_flag == "p3" ? "Y" : "N"
    }',prm_flag3 = '${
      data.sup_top_flag == "p3" || data.sup_top_flag == "p2" ? "Y" : "N"
    }', premium_amt3 = '${
      data.sup_top_flag == "p3" || data.sup_top_flag == "p2"
        ? `${data.sup_top_up}`
        : ""
    }',
  modified_by = '${data.user}', modified_at = '${datetime}'`,
    values = null,
    whr = `form_no = '${data.form_no}'`,
    flag = 1;
  var pre_dt = await db_Insert(table_name, fields, values, whr, flag);

  console.log(pre_dt, "pre_dt");

  if (data.dependent_dt.length > 0) {
    for (let dt of data.dependent_dt) {
      var table_name = "td_gen_ins_depend",
        fields =
          dt.sl_no > 0
            ? `dept_name = '${dt.dependent_name}', dob = '${dt.dob}',
     relation = '${dt.relation}', disease_flag = '${dt.type_diseases}', disease_type = '${dt.name_diseases}',
     modified_by = '${data.user}', modified_at = '${datetime}'`
            : `(form_no,sl_no,member_id,dept_name,dob,relation,disease_flag,disease_type,created_by,created_at)`,
        values = `SELECT '${data.form_no}',max(sl_no)+1,'${data.member_id}','${dt.dependent_name}','${dt.dob}','${dt.relation}','${dt.type_diseases}','${dt.name_diseases}','${data.user}','${datetime}' from td_gen_ins_depend WHERE form_no = '${data.form_no}'`,
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
      console.log(spou_dt, "spou_dt");
    }
  }
  console.log(res_dt, "hiii");
  res.send(res_dt);
});

module.exports = { memberPolicyRouter };
