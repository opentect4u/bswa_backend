const express = require("express");
const dateFormat = require("dateformat");
const { db_Select } = require("../../modules/MasterModule");
const masterRouter = express.Router();

masterRouter.get("/unit_list", async (req, res) => {
  var data = req.query;
  var select = "unit_id, unit_name",
    table_name = "md_unit",
    whr = data.unit_id > 0 ? `unit_id = ${unit_id}` : null,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

masterRouter.get("/policy_holder_list", async (req, res) => {
  var data = req.query;
  var select = "policy_holder_type_id, policy_holder_type",
    table_name = "md_policy_holder_type",
    whr = null,
    order = null;
  var policy_res_dt = await db_Select(select, table_name, whr, order);
  res.send(policy_res_dt);
});

masterRouter.get("/relationship_list", async (req, res) => {
  var data = req.query;
  var select = "id, relation_name",
    table_name = "md_relationship",
    whr = data.id > 0 ? `id = ${id}` : null,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

masterRouter.get("/bank_name_list", async (req, res) => {
  var data = req.query;
  // console.log(data, "data");
  var select = "id, bank_name,acc_cd,org_flag",
    table_name = "md_bank",
    whr = `org_flag = '${data.org_flag}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt);
  res.send(res_dt);
});

masterRouter.get("/bank_name_list_trust", async (req, res) => {
  var data = req.query;
  // console.log(data, "data");
  var select = "id, bank_name,acc_cd,org_flag",
    table_name = "md_bank",
    whr = `org_flag = '${data.org_flag}'`,
    order = null;
  var res_dt_trust = await db_Select(select, table_name, whr, order);
  // console.log(res_dt_trust);
  res.send(res_dt_trust);
});

masterRouter.get("/fee_list", async (req, res) => {
  var data = req.query;
  var select =
      "a.adm_fee,a.donation,a.subscription_1,a.subscription_2,a.subs_type",
    table_name = "md_member_fees a",
    whr = `a.memb_type = '${data.memb_type}' AND date(a.effective_dt) = (SELECT max(date(b.effective_dt))
         FROM md_member_fees b
         WHERE a.memb_type = b.memb_type)`;
  order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

masterRouter.get("/subscription_fee_dynamic", async (req, res) => {
  var data = req.query;
  var select = "*",
    table_name = "md_member_fees",
    whr = `memb_type = '${data.memb_type}'
           AND effective_dt = (select max(effective_dt)
                      from md_member_fees
                      where memb_type = '${data.memb_type}'
                      AND  effective_dt <= now())`;
  order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "iiii");
  res.send(res_dt);
});

masterRouter.get("/subscription_fee_dynamic_life", async (req, res) => {
  var data = req.query;
  var select = "*",
    table_name = "md_member_fees",
    whr = `memb_type = '${data.memb_type}'
           AND effective_dt = (select max(effective_dt)
                      from md_member_fees
                      where memb_type = '${data.memb_type}'
                      AND  effective_dt <= now())`;
  order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "iiii");
  res.send(res_dt);
});

masterRouter.get("/get_tnx_info", async (req, res) => {
  var data = req.query;
  var select =
      "form_no, trn_dt, trn_id, sub_amt, onetime_amt, adm_fee, donation, premium_amt, tot_amt, pay_mode, receipt_no, chq_no, chq_dt, chq_bank, approval_status",
    table_name = "td_transactions",
    whr = `form_no = '${data.form_no}' AND approval_status = 'U'`;
  order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "iiii");
  res.send(res_dt);
});

module.exports = { masterRouter };
