const express = require("express");
const dateFormat = require("dateformat");
const { db_Select, getCurrFinYear } = require("../../modules/MasterModule");
const {
  super_form_save,
  reject_dt,
  approve_dt,
  approve_dt_stp,
} = require("../../modules/super_policyMOdule");

const super_policyRouter = express.Router();

// super_policyRouter.get("/get_member_policy_super", async (req, res) => {
//   var data = req.query;
//   // console.log(data, "hhhh");
//   var select =
//       "a.form_no,a.form_dt,a.member_id,a.mem_dt,a.mem_type,a.memb_oprn,a.memb_name,a.unit_id,a.gurdian_name,a.gender,a.marital_status,a.dob,a.pers_no,a.min_no,a.memb_address,a.phone_no,b.dependent_dt,b.dependent_name,b.gurdian_name spou_guard,b.relation,b.min_no spou_min,b.dob spou_db,b.phone_no spou_phone,b.memb_address spou_address",
//     // "a.form_no,a.form_dt,a.member_id,a.mem_dt,a.mem_type,a.memb_oprn,a.memb_name,a.unit_id,a.gurdian_name,a.gender,a.marital_status,a.dob,a.pers_no,a.min_no,a.memb_address,a.phone_no",
//     table_name = "md_member a, md_dependent b",
//     // whr = `a.form_no = b.form_no
//     // AND a.member_id ='${data.member_id}'`,
//     whr = `a.form_no = b. form_no 
//     AND a.member_id = b.member_id
//     AND a.mem_type = b.mem_type
//     AND a.member_id ='${data.member_id}'`,
//     order = null;
//   var res_dt = await db_Select(select, table_name, whr, order);
//   // console.log(res_dt, "kiki");
//   res.send(res_dt);
// });


super_policyRouter.get("/get_member_policy_super", async (req, res) => {
    var data = req.query;
    // console.log(data, "hhhh");
    var select =
        "a.form_no,a.form_dt,a.member_id,a.mem_dt,a.mem_type,a.memb_oprn,a.memb_name,a.unit_id,a.gurdian_name,a.gender,a.marital_status,a.dob,a.pers_no,a.min_no,a.memb_address,a.phone_no,b.dependent_dt,b.dependent_name,b.gurdian_name spou_guard,b.relation,b.min_no spou_min,b.dob spou_db,b.phone_no spou_phone,b.memb_address spou_address",
      table_name = "md_member a LEFT JOIN md_dependent b ON a.form_no = b.form_no AND a.member_id = b.member_id AND a.mem_type = b.mem_type",
      whr = `a.member_id ='${data.member_id}'`,
      order = null;
    var res_dt = await db_Select(select, table_name, whr, order);
    // console.log(res_dt, "kiki");
    res.send(res_dt);
  });

// super_policyRouter.get("/get_super_dependent", async (req, res) => {
//   var data = req.query;
//   // console.log(data, "jjj");
//   var select =
//       "a.sl_no,a.dependent_name,a.relation,a.dob,a.member_id,a.min_no,a.phone_no,a.memb_address,b.relation_name",
//     table_name = "md_dependent a, md_relationship b",
//     whr = `a.relation = b.id
//       AND a.member_id ='${data.member_id}'`,
//     order = null;
//   var res_dt = await db_Select(select, table_name, whr, order);
//   // console.log(res_dt, "mimi");
//   res.send(res_dt);
// });

super_policyRouter.get("/get_super_mediclaim", async (req, res) => {
  var data = req.query;
  // console.log(data, "hhhh");
  var select =
      "form_no,sl_no,ind_type,fin_year,particulars,amount,treatment_dtls",
    table_name = "td_stp_dtls",
    whr = `form_no ='${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  console.log(res_dt, "kiki");
  res.send(res_dt);
});

super_policyRouter.get("/get_super_transaction", async (req, res) => {
  var data = req.query;
  console.log(data, "hhhh");
  var select =
      "a.form_no,a.form_dt,a.fin_yr,a.member_id,a.remarks,a.form_status,a.resolution_no,a.resolution_dt,b.premium_amt,b.pay_mode",
    table_name = "td_stp_ins a, td_transactions b",
    whr = `a.form_no = b.form_no AND a.form_no ='${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  console.log(res_dt, "kiki");
  res.send(res_dt);
});

super_policyRouter.get("/get_super_transaction_reject", async (req, res) => {
  var data = req.query;
  console.log(data, "hhhh");
  var select =
      "a.form_no,a.form_dt,a.fin_yr,a.member_id,a.remarks,a.form_status,a.resolution_no,a.resolution_dt",
    table_name = "td_stp_ins a",
    whr = `a.form_no ='${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  console.log(res_dt, "kiki");
  res.send(res_dt);
});

super_policyRouter.get("/get_date", async (req, res) => {
  var finDt = await getCurrFinYear();

  // console.log(current_year, previous_year, next_year, curr_fin_year, prev_fin_year);
  res.send({
    suc: 1,
    msg: {
      curr_fin_year: finDt.curr_fin_year,
      prev_fin_year: finDt.prev_fin_year,
    },
  });
});

super_policyRouter.post("/save_super_policy_form", async (req, res) => {
  var data = req.body;
  console.log(data, "mm");
  var save_super = await super_form_save(data);
  console.log(save_super, "aaa");
  res.send(save_super);
});

super_policyRouter.get("/check_member_id", async (req, res) => {
  var data = req.query;
  console.log(data);
  var select = "member_id",
    table_name = "td_stp_ins",
    where = `member_id = '${data.member_id}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, where, order);
  res.send(res_dt);
});

super_policyRouter.get("/frm_list_policy", async (req, res) => {
  var data = req.query;
  console.log(data, "mimi");
  // if (data.checkedmember) {
  var select = "form_no,form_dt,member_id,form_status,memb_name, phone_no",
    table_name = "td_stp_ins",
    whr = `form_status IN('P','R','T')`;
  // AND a.form_no = '${data.form_no}' OR b.memb_name = '${data.form_no}'`,
  order = null;
  // var res_dt = await db_Select(select, table_name, whr, order);
  // } else {
  //   var select = "form_no,form_dt,member_id,memb_name",
  //     table_name = "td_stp_ins",
  //     whr = `form_status = 'T'
  //     AND form_no = '${data.form_no}' OR memb_name = '${data.form_no}'`,
  //     order = null;
  // }
  var res_dt_1 = await db_Select(select, table_name, whr, order);
  console.log(res_dt_1, "mistu");
  res.send(res_dt_1);
});

super_policyRouter.get("/frm_list_policy_2", async (req, res) => {
  var data = req.query;
  console.log(data, "bbb");
  // if (data.checkedmember) {
  var select = "form_no,form_dt, member_id,form_status,memb_name",
    table_name = "td_stp_ins",
    whr = `(form_no = '${data.form_no}' OR memb_name = '${data.form_no}') 
    AND form_status IN('P','R','T')`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  console.log(res_dt, "kiki");
  res.send(res_dt);
});

super_policyRouter.post("/reject_super_topup", async (req, res) => {
  var data = req.body;
  // console.log(data,'reject');
  var res_dt = await reject_dt(data);
  res.send(res_dt);
});

super_policyRouter.post("/approve_super", async (req, res) => {
  var data = req.body;
  console.log(data, "suiper");
  var res_dt = await approve_dt(data);
  res.send(res_dt);
});

super_policyRouter.post("/approve_stp_data", async (req, res) => {
  var data = req.body;
  // console.log(data, "suiper");
  var res_dt = await approve_dt_stp(data);
  res.send(res_dt);
});

super_policyRouter.get("/get_data", async (req, res) => {
  var data = req.query;
  // console.log(data, "bbb");
  var select =
      "a.form_no,a.form_dt,a.form_status,a.member_id,a.memb_name, a.phone_no",
    table_name = "td_stp_ins a",
    whr = `a.form_status = 'T'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "kiki");
  res.send(res_dt);
});

super_policyRouter.get("/get_stp_ins_dt", async (req, res) => {
  var data = req.query;
  var select = "member_id",
    table_name = "td_stp_ins",
    where = `form_no = '${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, where, order);
  res.send(res_dt);
});

super_policyRouter.get("/get_member_policy_print_super", async (req, res) => {
  var data = req.query,
    res_dt;
  console.log(data, "hhhh");
  // if (data.checkedmember) {
  var select = "policy_holder_type",
    table_name = "td_stp_ins",
    where = `member_id = '${data.member_id}'`,
    order = null;
  var chk_dt = await db_Select(select, table_name, where, order);
  console.log(chk_dt, "chk_dt");
  if (chk_dt.suc > 0 && chk_dt.msg.length > 0) {
    if (chk_dt.msg[0].policy_holder_type == "M") {
      var select =
          // "a.form_no,a.form_dt,a.member_id,a.mem_dt,a.mem_type,a.memb_oprn,a.memb_name,a.unit_id,a.gurdian_name,a.gender,a.marital_status,a.dob,a.pers_no,a.min_no,a.memb_address,a.phone_no,b.dependent_dt,b.dependent_name,b.gurdian_name spou_guard,b.relation,b.min_no spou_min,b.dob spou_db,b.phone_no spou_phone,b.memb_address spou_address",
          "a.form_no,a.form_dt,a.fin_yr,a.association,a.memb_type mem_type,a.member_id,a.memb_oprn,a.memb_name,a.mem_address,a.phone_no,a.min_no,a.personel_no,a.dob,a.dependent_name,a.spou_min_no,a.spou_dob,a.spou_phone,a.spou_address,a.resolution_no,a.resolution_dt,a.form_status,b.unit_name",
        table_name = "td_stp_ins a, md_unit b",
        whr = `a.association = b.unit_id
      AND a.member_id ='${data.member_id}'`,
        order = null;
      res_dt = await db_Select(select, table_name, whr, order);
    } else {
      var select =
          "a.form_no,a.form_dt,a.fin_yr,a.association,a.memb_type mem_type,a.member_id,a.memb_oprn,a.memb_name,a.mem_address,a.phone_no,a.min_no,a.personel_no,a.dob,a.dependent_name,a.spou_min_no,a.spou_dob,a.spou_phone,a.spou_address,a.resolution_no,a.resolution_dt,a.form_status,b.unit_name",
        table_name = "td_stp_ins a, md_unit b",
        whr = `a.association = b.unit_id
      AND a.member_id ='${data.member_id}'`,
        order = null;
      res_dt = await db_Select(select, table_name, whr, order);
    }
  }

  console.log(res_dt, "kiki");
  res.send(res_dt);
});

module.exports = { super_policyRouter };
