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

masterRouter.get("/relationship_list", async (req, res) => {
  var data = req.query;
  var select = "id, relation_name",
    table_name = "md_relationship",
    whr = data.id > 0 ? `id = ${id}` : null,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
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
  console.log(res_dt, "iiii");
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
  console.log(res_dt, "iiii");
  res.send(res_dt);
});

module.exports = { masterRouter };
