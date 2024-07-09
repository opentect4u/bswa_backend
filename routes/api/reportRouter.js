const express = require("express");
const dateFormat = require("dateformat");
const { db_Select } = require("../../modules/MasterModule");
const reportRouter = express.Router();

reportRouter.get("/member_list_report", async (req, res) => {
  var data = req.query;
  console.log(data, "bbb");
  var select =
      "a.member_id,a.memb_name,a.min_no,a.memb_address,a.ps,a.city_town_dist,a.pin_no,a.phone_no,a.email_id,a.resolution_no,a.resolution_dt, b.unit_name",
    table_name = "md_member a LEFT JOIN md_unit b ON a.unit_id = b.unit_id",
    // whr = `mem_dt <= now()
    //        and  mem_type = '${data.member_type}'
    //        and  memb_status = 'A'`;
    whr = `(DATE(a.form_dt) <= '${dateFormat(
      new Date(data.period),
      "yyyy-mm-dd"
    )}' OR DATE(a.mem_dt) <= '${dateFormat(
      new Date(data.period),
      "yyyy-mm-dd"
    )}')
           and  a.mem_type = '${data.member_type}' and  a.memb_status = 'A'`;
  order = "order by cast(substr(a.member_id,3) as unsigned)";
  var res_dt = await db_Select(select, table_name, whr, order);
  console.log(res_dt, "kiki");
  res.send(res_dt);
});

reportRouter.get("/member_trans_report", async (req, res) => {
  var data = req.query;
  console.log(data, "bbb");
  var select =
      "date(a.trn_dt)trn_dt,a.trn_id,b.memb_name,b.member_id,a.sub_amt,a.onetime_amt,a.adm_fee,a.donation,a.pay_mode,a.receipt_no,a.chq_no,date(a.chq_dt)chq_dt, a.premium_amt,if(a.sub_amt+a.onetime_amt+a.adm_fee+a.donation>0,'O','R')trans_mode",
    table_name = "td_transactions a,md_member b",
    whr = `a.form_no = b.form_no
             AND a.approval_status = 'A' ${
               data.pay_mode != "A" && data.pay_mode != ""
                 ? `AND a.pay_mode='${data.pay_mode}'`
                 : ""
             }
             AND DATE(a.trn_dt) between '${data.from_dt}' and '${data.to_dt}'`,
    order = `Order By a.trn_dt, a.trn_id`;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "mimi");
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

reportRouter.get("/stp_status_report", async (req, res) => {
  var data = req.query;
  console.log(data, "bbb");
  var select =
    "DISTINCT a.form_no,a.fin_year,b.member_id,b.association,b.memb_name,b.dob,b.min_no,c.unit_name";
  (table_name =
    "td_stp_ins b JOIN td_stp_dtls a ON a.form_no = b.form_no LEFT JOIN md_unit c ON b.association = c.unit_id"),
    (whr = `DATE(b.form_dt) between '${data.from_dt}' and '${data.to_dt}' ${
      data.status != "S" ? `AND b.form_status = '${data.status}'` : ""
    }`),
    (order = `Order By a.form_no`);
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "mimi");
  res.send(res_dt);
});

// reportRouter.get("/gmp_status_report", async (req, res) => {
//   var data = req.query;
//   console.log(data, "bbb");
//   var select = "";
//   (table_name = ""),
//     // whr = `DATE(b.form_dt) between '${data.from_dt}' and '${data.to_dt}' ${
//     //   data.status != "S" ? `AND b.form_status = '${data.status}'` : ""
//     // }`,
//     (order = null);
//   var res_dt = await db_Select(select, table_name, whr, order);
//   // console.log(res_dt, "mimi");
//   res.send(res_dt);
// });

module.exports = { reportRouter };
