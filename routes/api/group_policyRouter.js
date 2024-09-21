const express = require("express");
const dateFormat = require("dateformat");
const { db_Select } = require("../../modules/MasterModule");
const {
  group_policy_form_save,
  group_policy_form_save_child,
  reject_dt_group,
  accept_dt_cash,
  accept_dt_cheque,
  approve_dt,
  save_gmp_data,
  saveFiles,
  savegenFiles,
} = require("../../modules/group_policyModule");
const { saveFile } = require("../../modules/associate_formModule");

const group_policyRouter = express.Router();

group_policyRouter.get("/get_member_policy", async (req, res) => {
  var data = req.query,
    res_dt;
  // console.log(data, "hhhh");
  var select = "member_id",
  table_name = "td_gen_ins",
  whr = `member_id = '${data.member_id}' AND policy_holder_type = 'M'`,
  order = null;
 var gmp_exists_dt = await db_Select(select, table_name, whr, order);

 if(gmp_exists_dt.suc > 0 && gmp_exists_dt.msg.length == 0){
  var select = "member_id",
  table_name = "td_stp_ins",
  whr = `member_id = '${data.member_id}' AND policy_holder_type = 'M'`,
  order = null;
var exists_dt = await db_Select(select, table_name, whr, order);
// if (data.checkedmember) {
if(exists_dt.suc > 0 && exists_dt.msg.length == 0){
  var select =
  "a.form_no,a.form_dt,a.mem_type,a.memb_name,a.phone_no,a.memb_oprn,a.gurdian_name,a.gender,a.marital_status,a.dob,a.unit_id",
  table_name = "md_member a",
whr = `a.member_id ='${data.member_id}'`,
order = null;
res_dt = await db_Select(select, table_name, whr, order);

if (res_dt.suc > 0 && res_dt.msg.length > 0) {
  var select =
      "family_catg, family_type, family_type_id, premium1, premium1_flag,premium2,premium2_flag,premium3,premium3_flag",
    table_name = "md_premium_type",
    whr =
      res_dt.msg[0].mem_type != "AI"
        ? `family_catg ='${res_dt.msg[0].memb_oprn}'`
        : null,
    order = null;
  var pre_dt = await db_Select(select, table_name, whr, order);
  res_dt.msg[0]["pre_dt"] = pre_dt.suc > 0 ? (pre_dt.msg.length > 0 ? pre_dt.msg : []) : [];
  res.send(res_dt);
}else{
  res.send({ suc: 0, msg: "Member details not found" });
}
} else {
  res.send({ suc: 2, msg: "Member already has an Insurance in STP policy" });
}
 }else {
  res.send({ suc: 3, msg: "Member already has an Insurance in GMP policy" })
 }

  
  // console.log(res_dt, "kiki");
  //
});

group_policyRouter.get("/get_member_policy_print", async (req, res) => {
  var data = req.query,
    res_dt;
  // console.log(data, "hhhh");
  // if (data.checkedmember) {
  var select = "policy_holder_type",
    table_name = "td_gen_ins",
    where = `member_id = '${data.member_id}' AND form_no = '${data.form_no}'`,
    order = null;
  var chk_dt = await db_Select(select, table_name, where, order);
  // console.log(chk_dt, "chk_dt");
  if (chk_dt.suc > 0 && chk_dt.msg.length > 0) {
    if (chk_dt.msg[0].policy_holder_type == "M") {
      var select =
        // "a.form_no,a.form_dt,a.memb_type mem_type,a.memb_name,a.memb_oprn,a.gurdian_name,a.gender,a.marital_status,a.dob,a.unit_id",
        "a.form_no,a.form_dt,a.association,a.memb_type mem_type,a.memb_oprn,a.memb_name,a.phone,a.father_husband_name gurdian_name,a.sex gender,a.marital_status,a.dob,a.memb_img,a.doc_img,a.disease_flag,a.disease_type,b.unit_name";
      (table_name = "td_gen_ins a, md_unit b"),
        (whr = `a.association = b.unit_id
        AND a.member_id ='${data.member_id}'
        AND a.form_no = '${data.form_no}'`),
        (order = null);
      res_dt = await db_Select(select, table_name, whr, order);
    } else {
      var select =
          "a.form_no,a.form_dt,a.association,a.memb_type mem_type,a.memb_oprn,a.memb_name,a.phone,a.father_husband_name gurdian_name,a.sex gender,a.marital_status,a.dob,a.memb_img,a.doc_img,b.unit_name",
        table_name = "td_gen_ins a, md_unit b",
        whr = `a.association = b.unit_id
        AND a.member_id ='${data.member_id}'
        AND a.form_no = '${data.form_no}'`,
        order = null;
      res_dt = await db_Select(select, table_name, whr, order);
    }
  }

  if (res_dt > 0 && res_dt.msg.length > 0) {
    var select =
        "family_catg, family_type, family_type_id, premium1, premium1_flag,premium2,premium2_flag,premium3,premium3_flag",
      table_name = "md_premium_type",
      whr =
        res_dt.msg[0].mem_type != "AI"
          ? `family_catg ='${res_dt.msg[0].memb_oprn}'`
          : null,
      order = null;
    var pre_dt = await db_Select(select, table_name, whr, order);
    res_dt.msg[0]["pre_dt"] = pre_dt.suc > 0 ? pre_dt.msg : [];
  }

  console.log(res_dt, "kiki");
  res.send(res_dt);
});

group_policyRouter.get("/get_member_policy_dependent", async (req, res) => {
  var data = req.query;
  // console.log(data, "jjj");
  var select =
      "a.sl_no,a.dependent_name,a.relation,a.dob,a.member_id,b.relation_name",
    table_name = "md_dependent a, md_relationship b",
    whr = `a.relation = b.id
      AND a.member_id ='${data.member_id}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "mimi");
  res.send(res_dt);
});

group_policyRouter.get(
  "/get_member_policy_dependent_print",
  async (req, res) => {
    var data = req.query;
    // console.log(data, "jjj");
    var select =
        "a.sl_no,a.dept_name dependent_name,a.relation,a.dob,a.disease_flag,a.disease_type,a.dep_img,a.dep_doc,a.member_id,b.relation_name,c.policy_holder_type",
      table_name = "td_gen_ins_depend a JOIN md_relationship b ON a.relation = b.id LEFT JOIN td_gen_ins c ON a.member_id = c.member_id AND a.form_no = c.form_no",
      whr = `a.member_id = '${data.member_id}' AND a.form_no = '${data.form_no}'`,
      order = null;
    var res_dt = await db_Select(select, table_name, whr, order);
    // console.log(res_dt, "mimi");
    res.send(res_dt);
  }
);

group_policyRouter.post("/save_group_policy_form", async (req, res) => {
  var data = req.body;
  var data1 = req.files;

  // console.log(data1, "bbb");
  var save_gen = await group_policy_form_save(data, req.files ? (req.files.own_file ? req.files.own_file : null) : null, req.files ? (req.files.spouse_file ? req.files.spouse_file : null) : null, req.files ? (req.files.own_files ? req.files.own_files : null) : null, req.files ? (req.files.spouse_files ? req.files.spouse_files : null) : null);
  // console.log(save_gen, "log");
  res.send(save_gen);
});

group_policyRouter.post("/save_child_group_policy_form", async (req, res) => {
  var data = req.body;
  // console.log(data, "bbb");
  var save_gen = await group_policy_form_save_child(data);
  // console.log(save_gen, "aaa");
  res.send(save_gen);
});

group_policyRouter.get("/frm_list_policy_group", async (req, res) => {
  var data = req.query;
  // console.log(data, "bbb");
  // if (data.checkedmember) {
  var select = "a.form_no,a.form_dt, a.member_id,a.memb_name,a.form_status",
    table_name = "td_gen_ins a",
    whr = `a.form_status IN('P','R','T')`;
  // AND a.form_no = '${data.form_no}' OR b.memb_name = '${data.form_no}'`,
  order = `ORDER BY a.form_no desc`;
  //   var res_dt = await db_Select(select, table_name, whr, order);
  // } else {
  //   var select = "form_no,form_dt,member_id,memb_name",
  //     table_name = "td_gen_ins",
  //     whr = `form_status = 'P'
  //   AND form_no = '${data.form_no}' OR memb_name = '${data.form_no}'`,
  //     order = null;
  // }
  var res_dt_1 = await db_Select(select, table_name, whr, order);
  // console.log(res_dt_1, "kiki");
  res.send(res_dt_1);
});

group_policyRouter.get("/frm_list_policy_group_2", async (req, res) => {
  var data = req.query;
  // console.log(data, "bbb");
  // if (data.checkedmember) {
  var select = "a.form_no,a.form_dt, a.member_id,a.memb_name,a.form_status",
    table_name = "td_gen_ins a",
    whr = `(a.form_no = '${data.form_no}' OR a.memb_name = '${data.form_no}') AND a.form_status IN('P','R','T')`,
    order = null;
  //   var res_dt = await db_Select(select, table_name, whr, order);
  // } else {
  //   var select = "form_no,form_dt,member_id,memb_name",
  //     table_name = "td_gen_ins",
  //     whr = `form_status = 'P'
  //   AND form_no = '${data.form_no}' OR memb_name = '${data.form_no}'`,
  //     order = null;
  // }
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "kiki");
  res.send(res_dt);
});

group_policyRouter.post("/reject_group_policy", async (req, res) => {
  var data = req.body;
  // console.log(data,'reject');
  var res_dt = await reject_dt_group(data);
  res.send(res_dt);
});

group_policyRouter.post("/payment_accept_group", async (req, res) => {
  var data = req.body;
  // console.log(data, "accept");
  var res_dt = await accept_dt_cash(data);
  res.send(res_dt);
});

group_policyRouter.post("/payment_accept_cheque_group", async (req, res) => {
  var data = req.body;
  // console.log(data, "accept_cheque");
  var res_dt = await accept_dt_cheque(data);
  res.send(res_dt);
});

group_policyRouter.post("/save_trn_data_gmp", async (req, res) => {
  var data = req.body;
  // console.log(data, "trn_data");
  var res_dt = await save_gmp_data(data);
  res.send(res_dt);
});

group_policyRouter.get("/transaction_dt_group", async (req, res) => {
  var data = req.query;
  // console.log(data);
  var select =
      "a.form_no,a.trn_dt,a.trn_id,a.premium_amt,a.tot_amt,a.pay_mode,a.chq_no,a.chq_dt,a.chq_bank,b.ins_period,b.association,b.memb_name,b.member_id,b.resolution_no,b.resolution_dt",
    // table_name =
    //   "td_transactions a, td_gen_ins b, td_premium_dtls c, md_unit d",
    table_name = "td_transactions a, td_gen_ins b",
    whr = `a.form_no = b.form_no
    AND b.form_status = 'T'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "mini");
  res.send(res_dt);
});

group_policyRouter.get("/view_grp_trn_dt", async (req, res) => {
  var data = req.query;
  // console.log(data);
  var select =
      "a.form_no,a.trn_dt,a.trn_id,a.premium_amt,a.tot_amt,a.pay_mode,a.chq_no,a.chq_dt,a.chq_bank,b.policy_holder_type,b.member_id,b.association,b.memb_type,b.memb_oprn,b.memb_name,b.phone,b.sex,b.dob,b.ins_period,b.form_status,b.remarks,b.resolution_no,b.resolution_dt,c.unit_name",
    table_name =
      "td_transactions a JOIN td_gen_ins b ON a.form_no = b.form_no LEFT JOIN md_unit c ON b.association = c.unit_id",
    whr = `b.form_status = 'T'
    ${data.form_no ? `AND a.form_no = '${data.form_no}'` : ""}`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "mini");
  res.send(res_dt);
});

group_policyRouter.post("/approve_group", async (req, res) => {
  var data = req.body;
  // console.log(data, "1111");
  var res_dt = await approve_dt(data);
  res.send(res_dt);
});

group_policyRouter.get("/group_name_list", async (req, res) => {
  var data = req.query;
  var select = "a.*,b.memb_oprn,b.mem_type",
    table_name = "md_premium_type a, md_member",
    whr = data.unit_id > 0 ? `unit_id = ${unit_id}` : null,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

group_policyRouter.get("/premium_dtls", async (req, res) => {
  var data = req.query;
  // console.log(data, "bbb");
  var select =
      "a.form_no,a.premium_amt,a.premium_amt2,a.prm_flag2,a.premium_amt3,a.prm_flag3,b.family_type",
    table_name = "td_premium_dtls a, md_premium_type b",
    whr = `a.premium_id = b.family_type_id
          AND a.form_no = '${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "kiki");
  res.send(res_dt);
});

group_policyRouter.get("/get_non_premium_dtls", async (req, res) => {
  var data = req.query;
  var select =
      "family_catg, family_type, family_type_id, premium1, premium1_flag,premium2,premium2_flag,premium3,premium3_flag",
    table_name = "md_premium_type",
    whr = null,
    order = null;
  var pre_dt = await db_Select(select, table_name, whr, order);
  res.send(pre_dt);
});

group_policyRouter.get("/get_print_details", async (req, res) => {
  var data = req.query;
  // console.log(data, "hhhh");
  var select =
      "a.form_no,a.form_dt,a.mem_type,a.memb_name,a.memb_oprn,a.gurdian_name,a.gender,a.marital_status,a.dob,b.unit_name",
    table_name = "md_member a, md_unit b",
    whr = `a.unit_id = b.unit_id
    AND a.member_id ='${data.member_id}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
});

group_policyRouter.get("/get_gen_ins_dt", async (req, res) => {
  var data = req.query;
  var select = "member_id",
    table_name = "td_gen_ins",
    where = `form_no = '${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, where, order);
  res.send(res_dt);
});

group_policyRouter.get("/get_gmp_transaction", async (req, res) => {
  var data = req.query;
  // console.log(data, "hhhh");
  // var select =
  //     "a.form_no,a.form_dt,a.member_id,a.remarks,a.form_status,a.resolution_no,a.resolution_dt,b.premium_amt,b.pay_mode",
  var select =
      "a.form_no,a.form_dt,a.member_id,a.remarks,a.form_status,a.resolution_no,a.resolution_dt,b.trn_dt,b.premium_amt,b.pay_mode,b.receipt_no,b.chq_no,b.chq_dt,b.chq_bank, b.trn_id",
    table_name = "td_gen_ins a, td_transactions b",
    whr = `a.form_no = b.form_no 
    AND a.form_no ='${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "kiki");
  res.send(res_dt);
});

group_policyRouter.post("/accept_gmp_money_receipt", async (req, res) => {
  var data = req.body;
  var select =
      "a.form_no,a.trn_dt,a.trn_id,a.tot_amt,a.pay_mode,a.receipt_no,a.chq_no,a.chq_dt,a.chq_bank,a.approval_status,b.memb_name",
    table_name = "td_transactions a, td_gen_ins b",
    whr = `a.form_no = b.form_no AND a.form_no = '${data.form_no}' AND a.trn_id = '${data.trn_id}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "lo");
  res.send(res_dt);
});

group_policyRouter.post("/get_grn_ins_dtls_with_member_id", async (req, res) => {
  var data = req.body;
  var select = "member_id, form_no",
    table_name = "td_gen_ins",
    where = `member_id = '${data.memb_id}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, where, order);
  res.send(res_dt);
});

module.exports = { group_policyRouter };
