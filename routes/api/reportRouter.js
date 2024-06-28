const express = require("express");
const dateFormat = require("dateformat");
const { db_Select } = require("../../modules/MasterModule");
const reportRouter = express.Router();

reportRouter.get("/member_list_report", async (req, res) => {
  var data = req.query;
  console.log(data, "bbb");
  var select =
      "member_id,memb_name,min_no,memb_address,ps,city_town_dist,pin_no,phone_no,email_id,resolution_no,resolution_dt",
    table_name = "md_member",
    whr = `mem_dt <= now()
           and  mem_type = '${data.member_type}'
           and  memb_status = 'A';`;
  order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  console.log(res_dt, "kiki");
  res.send(res_dt);
});

reportRouter.get("/member_trans_report", async (req, res) => {
  var data = req.query;
  console.log(data, "bbb");
  var select =
      "date(a.trn_dt)trn_dt,a.trn_id,b.memb_name,b.member_id,a.sub_amt,a.onetime_amt,a.adm_fee,a.donation,a.pay_mode,a.receipt_no,a.chq_no,date(a.chq_dt)chq_dt,if(a.sub_amt+a.onetime_amt+a.adm_fee+a.donation>0,'O','R')trans_mode",
    table_name = "td_transactions a,md_member b",
    whr = `a.form_no = b.form_no
             AND a.approval_status = 'A'
             AND DATE(a.trn_dt) between '${data.from_dt}' and '${data.to_dt}'`,
    order = `Order By trn_dt, trn_id`;
  var res_dt = await db_Select(select, table_name, whr, order);
  console.log(res_dt, "mimi");
  res.send(res_dt);
});

reportRouter.get("/clearupto_list_report", async (req, res) => {
  var data = req.query;
  console.log(data, "bbb");
  var select = `a.member_id,b.mem_type,b.memb_name,CONCAT(MONTHNAME(max(a.subscription_upto)),", ", YEAR(max(a.subscription_upto))) as cleared_upto,default_amt((b.mem_dt) <= now(),a.member_id)"default_amt"`,
    table_name = "td_memb_subscription a,md_member b",
    whr = `a.member_id = b.member_id
               AND date(b.mem_dt) <= now()
               AND b.mem_type = '${data.member_type}'`,
    order = `group by a.member_id,b.mem_type,b.memb_name;`;
  var res_dt = await db_Select(select, table_name, whr, order);
  console.log(res_dt, "mimi");
  res.send(res_dt);
});

module.exports = { reportRouter };
