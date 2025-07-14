const express = require("express");
const dateFormat = require("dateformat");
const { db_Select } = require("../../modules/MasterModule");
const reportRouter = express.Router();

reportRouter.get("/member_list_report", async (req, res) => {
  var data = req.query;
  // console.log(data, "bbb");
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
  // console.log(res_dt, "kiki");
  res.send(res_dt);
});

reportRouter.get("/stp_member_register_report", async (req, res) => {
 var data = req.query;
// console.log(data);

 var select = "a.form_no,a.form_dt,a.policy_holder_type holder_id,a.member_id,a.association,a.memb_type,a.memb_oprn,a.memb_name,a.gender,a.dob,a.mem_address,a.phone_no,a.min_no,a.personel_no,a.dependent_name,a.spou_min_no,a.spou_dob,a.spou_phone,a.spou_gender,a.spou_address,a.premium_type,b.policy_holder_type,c.unit_name",
 table_name = "td_stp_ins a LEFT JOIN md_policy_holder_type b ON a.policy_holder_type = policy_holder_type_id LEFT JOIN md_unit c ON a.association = c.unit_id",
 whr = `a.form_dt between '${data.from_dt}' AND '${data.to_dt}' AND a.memb_oprn = '${data.memb_oprn}'`,
 order = `ORDER BY a.form_no asc`;
 var stp_memb_register = await db_Select(select,table_name,whr,order);
 res.send(stp_memb_register);
});

reportRouter.get("/member_trans_report", async (req, res) => {
  var data = req.query;
  // console.log(data, "bbb");
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
  // console.log(data, "bbb");
  var select = `a.member_id,b.mem_type,b.memb_name,CONCAT(MONTHNAME(max(a.subscription_upto)),", ", YEAR(max(a.subscription_upto))) as cleared_upto,default_amt((b.mem_dt) <= now(),a.member_id)"default_amt"`,
    table_name = "td_memb_subscription a,md_member b",
    whr = `a.member_id = b.member_id
               AND date(b.mem_dt) <= now()
               AND b.mem_type = '${data.member_type}'`,
    order = `group by a.member_id,b.mem_type,b.memb_name;`;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "mimi");
  res.send(res_dt);
});


reportRouter.get("/stp_status_report", async (req, res) => {
  var data = req.query;
  // console.log(data, "bbb");
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

reportRouter.get("/gmp_status_report", async (req, res) => {
  var data = req.query;
  // console.log(data, "bbb");
  var select =
    "a.form_no,a.member_id,a.association,a.memb_type,a.memb_name,a.phone,a.father_husband_name,a.dob,a.memb_img,a.doc_img,c.unit_name";
  (table_name = "td_gen_ins a JOIN  md_unit c ON a.association = c.unit_id"),
    (whr = `DATE(a.form_dt) between '${data.from_dt}' and '${data.to_dt}' ${
      data.status != "S" ? `AND a.form_status = '${data.status}'` : ""
    }`),
    (order = null);
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "mimi");
  res.send(res_dt);
});

reportRouter.get("/gmp_trans_report", async (req, res) => {
  var data = req.query;
  // console.log(data, "bbb");
  var select =
    "a.member_id,a.memb_name,a.association,a.sex,a.dob,b.dept_name,c.premium_dt,c.premium_id,c.premium_amt,c.premium_amt2,c.prm_flag2,c.premium_amt3,c.prm_flag3,d.trn_dt,d.trn_id,e.family_type, f.unit_name";
  table_name = " td_gen_ins a, td_gen_ins_depend b, td_premium_dtls c, td_transactions d, md_premium_type e, md_unit f",
    whr = `DATE(a.form_dt) between '${data.from_dt}' and '${data.to_dt}'
           AND  a.form_no = b.form_no
           AND a.member_id = b.member_id
           AND a.form_no = c.form_no
           AND a.form_no = d.form_no
           AND c.premium_id = e.family_type_id
           AND a.association = f.unit_id`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "mimi");
  res.send(res_dt);
});

// reportRouter.get("/member_stp_trans_report", async (req, res) => {
//   const data = req.query;
//   console.log(data,'data');
  

//   let select = `a.trn_dt, a.trn_id, a.premium_amt, a.pay_mode, a.tot_amt, a.approval_status,
//     b.min_no, b.memb_name, b.dob,b.memb_oprn`;
  
//   if (data.memb_oprn === 'D' || data.memb_oprn === 'A') {
//     select += `, b.spou_min_no, b.spou_dob, b.dependent_name`;
//   }

//   const table_name = "td_transactions a LEFT JOIN td_stp_ins b ON a.form_no = b.form_no";
//   const whr = `
//     DATE(a.trn_dt) BETWEEN '${data.from_dt}' AND '${data.to_dt}'
//     AND a.approval_status = 'A'
//     AND a.pay_mode = 'O'
//     ${
//                data.memb_oprn != "A" && data.memb_oprn != ""
//                  ? `AND b.memb_oprn='${data.memb_oprn}'`
//                  : ""
//              }`;
//   const order = `ORDER BY a.trn_dt, a.trn_id`;

//   const res_dt = await db_Select(select, table_name, whr, order);
//   res.send(res_dt);
// });

reportRouter.get("/member_stp_trans_report", async (req, res) => {
  const data = req.query;
  // console.log(data, 'data');

  let select = `a.trn_dt, a.trn_id, a.premium_amt, a.pay_mode, a.tot_amt, a.approval_status,
    b.min_no, b.memb_name, b.gender, b.dob, b.memb_oprn`;

  // Include spouse/dependent fields if D or A
  if (data.memb_oprn === 'D' || data.memb_oprn === 'A') {
    select += `, b.spou_min_no, b.spou_dob, b.spou_gender, b.dependent_name`;
  }

  const table_name = "td_transactions a LEFT JOIN td_stp_ins b ON a.form_no = b.form_no";

  // Base condition
  let whr = `
    DATE(a.trn_dt) BETWEEN '${data.from_dt}' AND '${data.to_dt}'
    AND a.approval_status = 'A'
    AND a.pay_mode = 'O'
  `;

  // memb_oprn logic
  if (data.memb_oprn === 'S') {
    whr += ` AND b.memb_oprn = 'S'`;
  } else if (data.memb_oprn === 'D') {
    whr += ` AND b.memb_oprn = 'D'`;
  } else if (data.memb_oprn === 'A') {
    whr += ` AND b.memb_oprn IN ('S', 'D')`;
  }

  const order = `ORDER BY a.trn_dt, a.trn_id`;

  try {
    const res_dt = await db_Select(select, table_name, whr, order);
    res.send(res_dt);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});


reportRouter.get("/get_pg_approve_mem", async (req, res) => {
  var data = req.query;
  // console.log(data, 'data');

  var select = "DISTINCT udf3,udf4";
  table_name = "td_pg_transaction",
  whr =   `udf5 = 'A'`,
  order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "mimi");
  res.send(res_dt);
})


reportRouter.get("/get_pg_approve_dtls", async (req, res) => {
  var data = req.query;
  // console.log(data, 'data');

  var select = "*";
  table_name = "td_pg_transaction",
  whr =`udf4 = '${data.member_id}'`,
  order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "mimi");
  res.send(res_dt);
})

module.exports = { reportRouter };
