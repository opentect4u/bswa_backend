const express = require("express");
const dateFormat = require("dateformat");
const path = require('path');
const fs = require('fs');
const {
  db_Select,
  getCurrFinYear,
  WIFE_ID,
  db_Insert,
} = require("../../modules/MasterModule");
const {
  super_form_save,
  reject_dt,
  approve_dt,
  approve_dt_stp,
  save_stp_data,
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

// super_policyRouter.get("/get_member_policy_super", async (req, res) => {
//   var data = req.query;
//   // var select =
//   //     "a.form_no,a.form_dt,a.member_id,a.mem_dt,a.mem_type,a.memb_oprn,a.memb_name,a.unit_id,a.gurdian_name,a.gender,a.marital_status,a.dob,a.pers_no,a.min_no,a.memb_address,a.phone_no,b.dependent_dt,b.dependent_name,b.gurdian_name spou_guard,b.relation,b.min_no spou_min,b.dob spou_db,b.phone_no spou_phone,b.memb_address spou_address",
//   //   table_name =
//   //     "md_member a LEFT JOIN md_dependent b ON a.form_no = b.form_no AND a.member_id = b.member_id AND a.mem_type = b.mem_type",
//   //   whr = `a.member_id ='${data.member_id}'`,
//   //   order = null;
//   // var res_dt = await db_Select(select, table_name, whr, order);

//   // var select = "mem_type",
//   //   table_name = "md_member",
//   //   whr = `member_type = 'AI'`,
//   //   order = null;
//   // var member_type = await db_Select(select, table_name, whr, order);

//   // if (member_type.suc.length > 0) {
//   //   res.send({ suc: 3, msg: "AI members are not allowed" });
//   // } else {
//   var select = "member_id",
//     table_name = "td_stp_ins",
//     whr = `member_id = '${data.member_id}' AND policy_holder_type = 'M'`,
//     order = null;
//   var dt = await db_Select(select, table_name, whr, order);

//   if (dt.suc > 0 && dt.msg.length == 0) {

//     var select = "member_id",
//     table_name = "td_gen_ins",
//     whr = `member_id = '${data.member_id}' AND policy_holder_type = 'M'`,
//     order = null;
//     var existsgmp_dt = await db_Select(select, table_name, whr, order);

//     if (existsgmp_dt.suc > 0 && existsgmp_dt.msg.length == 0) {
//       var select =
//       "a.form_no,a.form_dt,a.member_id,a.mem_dt,a.mem_type,a.memb_oprn,a.memb_name,a.unit_id,a.gurdian_name,a.gender,a.marital_status,a.dob,a.pers_no,a.min_no,a.memb_address,a.phone_no",
//     table_name = "md_member a",
//     whr = `a.member_id = '${data.member_id}'`,
//     order = null;
//   var res_dt = await db_Select(select, table_name, whr, order);

//   if (res_dt.suc > 0 && res_dt.msg.length > 0) {
//     var select =
//         "b.dependent_name,b.gurdian_name spou_guard,b.relation,b.min_no spou_min,b.dob spou_db,b.phone_no spou_phone,b.memb_address spou_address",
//       table_name = "md_dependent b",
//       whr = `b.member_id = '${data.member_id}' AND b.relation IN (${WIFE_ID})`,
//       order = null;
//     var spou_dt = await db_Select(select, table_name, whr, order);
//     res_dt.msg[0]["spou_dt"] =
//       spou_dt.suc > 0 ? (spou_dt.msg.length > 0 ? spou_dt.msg : []) : [];

//     res.send(res_dt);
//   } else {
//     res.send({ suc: 0, msg: "Member details not found" });
//   }
// } else {
//   res.send({ suc: 2, msg: "Member already has an Insurance in GMP policy" });
// }
// } else {
//   res.send({ suc: 3, msg: "Member already has an Insurance in STP policy" });
// }
//   // }
// });

super_policyRouter.get("/get_member_policy_super", async (req, res) => {
  var data = req.query;

  var select ="a.form_no,a.form_dt,a.member_id,a.mem_dt,a.mem_type,a.memb_oprn,a.memb_name,a.unit_id,a.gurdian_name,a.gender,a.marital_status,a.dob,a.pers_no,a.min_no,a.memb_address,a.phone_no",
  table_name = "md_member a",
  whr = `a.min_no = '${data.min_no}'`,
  order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
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

super_policyRouter.post("/get_stp_premium_dtls", async (req, res) => {
 var data = req.body;
//  console.log(data,'ft');
 
  var select = "premium_type,premium_amt",
  table_name = "md_stp_premium_type",
  whr = `premium_type = '${data.type}'`,
  order = null;
  var stp_prm_dt = await db_Select(select, table_name, whr, order);
  res.send(stp_prm_dt);
});

super_policyRouter.get("/get_super_mediclaim", async (req, res) => {
  var data = req.query;
  // console.log(data, "hhhh");
  var select =
      "form_no,sl_no,ind_type,fin_year,particulars,amount,treatment_dtls,treatment_flag",
    table_name = "td_stp_dtls",
    whr = `form_no ='${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "kiki");
  res.send(res_dt);
});

super_policyRouter.get("/get_super_transaction", async (req, res) => {
  var data = req.query;
  // console.log(data, "hhhh");
  var select =
      "form_no,form_dt,member_id,remarks,form_status,resolution_no,resolution_dt",
    table_name = "td_stp_ins",
    whr = `form_no ='${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "kiki");
  res.send(res_dt);
});

super_policyRouter.get("/get_super_transaction_reject", async (req, res) => {
  var data = req.query;
  // console.log(data, "hhhh");
  var select =
      "a.form_no,a.form_dt,a.member_id,a.remarks,a.form_status,a.resolution_no,a.resolution_dt",
    table_name = "td_stp_ins a",
    whr = `a.form_no ='${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "kiki");
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
  // console.log(data, "mm");
  var save_super = await super_form_save(data);
  // console.log(save_super, "aaa");
  res.send(save_super);
});

super_policyRouter.get("/check_member_id", async (req, res) => {
  var data = req.query;
  // console.log(data);
  var select = "member_id",
    table_name = "td_stp_ins",
    where = `member_id = '${data.member_id}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, where, order);
  res.send(res_dt);
});

super_policyRouter.get("/frm_list_policy", async (req, res) => {
  var data = req.query;
  // console.log(data, "mimi");
  // if (data.checkedmember) {
  var select = "form_no,form_dt,member_id,form_status,memb_name, phone_no",
    table_name = "td_stp_ins",
    whr = `form_status IN('P','R','A')`;
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
  // console.log(res_dt_1, "mistu");
  res.send(res_dt_1);
});

super_policyRouter.get("/frm_list_policy_2", async (req, res) => {
  var data = req.query;
  // console.log(data, "bbb");
  // if (data.checkedmember) {
  var select = "form_no,form_dt, member_id,form_status,memb_name",
    table_name = "td_stp_ins",
    whr = `(form_no = '${data.form_no}' OR memb_name = '${data.form_no}') 
    AND form_status IN('P','R','T')`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "kiki");
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
  // console.log(data, "suiper");
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
  // console.log(data, "hhhh");
  // if (data.checkedmember) {
  var select = "policy_holder_type",
    table_name = "td_stp_ins",
    where = `member_id = '${data.member_id}' AND form_no = '${data.form_no}'`,
    order = null;
  var chk_dt = await db_Select(select, table_name, where, order);
  // console.log(chk_dt, "chk_dt");
  if (chk_dt.suc > 0 && chk_dt.msg.length > 0) {
    // if (chk_dt.msg[0].policy_holder_type == "M") {
      var select =
          // "a.form_no,a.form_dt,a.member_id,a.mem_dt,a.mem_type,a.memb_oprn,a.memb_name,a.unit_id,a.gurdian_name,a.gender,a.marital_status,a.dob,a.pers_no,a.min_no,a.memb_address,a.phone_no,b.dependent_dt,b.dependent_name,b.gurdian_name spou_guard,b.relation,b.min_no spou_min,b.dob spou_db,b.phone_no spou_phone,b.memb_address spou_address",
          "a.form_no,a.form_dt,a.policy_holder_type,a.member_id,a.association,a.memb_type mem_type,a.memb_oprn,a.memb_name,a.gender,a.dob,a.mem_address,a.phone_no,a.min_no,a.personel_no,a.memb_flag,a.dependent_name,a.spou_min_no,a.spou_dob,a.spou_phone,a.spou_gender,a.spou_address,a.dependent_flag,a.premium_type,a.form_status,a.resolution_no,a.resolution_dt,a.approve_by,a.approve_at,a.rejected_by,a.rejected_dt,a.remarks,b.unit_name,c.policy_holder_type",
        table_name = "td_stp_ins a LEFT JOIN md_unit b ON a.association = b.unit_id LEFT JOIN md_policy_holder_type c a.policy_holder_type = c.policy_holder_type_id",
        whr = `a.member_id ='${data.member_id}'
         AND a.form_no = '${data.form_no}'`,
        order = null;
      res_dt = await db_Select(select, table_name, whr, order);
    // } 
    // else {
    //   var select =
    //       "a.form_no,a.form_dt,a.policy_holder_type,a.fin_yr,a.association,a.memb_type mem_type,a.member_id,a.memb_oprn,a.memb_name,a.mem_address,a.phone_no,a.min_no,a.personel_no,a.dob,a.dependent_name,a.spou_min_no,a.spou_dob,a.spou_phone,a.spou_address,a.resolution_no,a.resolution_dt,a.form_status,b.unit_name",
    //     table_name = "td_stp_ins a, md_unit b",
    //     whr = `a.association = b.unit_id
    //   AND a.member_id ='${data.member_id}' AND a.form_no = '${data.form_no}'`,
    //     order = null;
    //   res_dt = await db_Select(select, table_name, whr, order);
    // }
  }
  res.send(res_dt);
});

// super_policyRouter.post("/fetch_member_details_fr_stp_policy", async (req, res) => {
//    try {
//   var data = req.body;

//   var select = "a.form_no,a.form_dt,a.policy_holder_type,a.member_id,a.association,a.memb_type,a.memb_oprn,a.memb_name,a.gender,a.dob,a.mem_address,a.phone_no,a.min_no,a.personel_no,a.memb_flag,a.dependent_name,a.spou_min_no,a.spou_dob,a.spou_phone,a.spou_gender,a.spou_address,a.dependent_flag,a.premium_type,b.unit_name,c.policy_holder_type,c.policy_holder_type_id",
//   table_name = "td_stp_ins a LEFT JOIN md_unit b ON a.association = b.unit_id LEFT JOIN md_policy_holder_type c ON a.policy_holder_type = c.policy_holder_type_id",
//   whr = `a.min_no = '${data.min_no}' AND a.member_id = '${data.member_id}' AND a.form_no = '${data.form_no}'`,
//   order = null;
//   var stp_memb_dtls = await db_Select(select,table_name,whr,order);
//    console.log("stp_memb_dtls:", stp_memb_dtls);

//     let premium_amt = null;

//     if (stp_memb_dtls?.length > 0 && stp_memb_dtls[0].premium_type) {
//       const premium_type = stp_memb_dtls[0].premium_type;
//        console.log("premium_type:", premium_type);

//        const maxYearQuery = `
//        SELECT MAX(financial_year) AS max_year 
//        FROM md_stp_premium_type 
//        WHERE premium_type = '${premium_type}'`;
//        const maxYearResult = await db.raw(maxYearQuery);
//         console.log("Max Year Result:", maxYearResult);

//         const maxFinancialYear = maxYearResult?.[0]?.max_year;
//          console.log("Max finYear Result:", maxFinancialYear);

        
//        if (maxFinancialYear) {
//        const select2 = `premium_amt`;
//        const table_name2 = `md_stp_premium_type`;
//        const where2 = `financial_year = '${maxFinancialYear}' AND premium_type = '${premium_type}'`;

//        const premiumResult = await db_Select(select2, table_name2, where2, null);
//         console.log("Premium Result:", premiumResult);

//         // premium_amt = premiumResult?.length > 0 ? premiumResult[0].premium_amt : null;
//        }
//        }
//   //        if (stp_memb_dtls?.length > 0) {
//   //   stp_memb_dtls[0].premium_amt = premium_amt;
//   // }
//      res.send(premiumResult);
//       } catch (err) {
//     console.error("Error in fetch_member_details_fr_stp_policy:", err);
//     res.send({ error: "Internal Server Error" });
//   }
// });

super_policyRouter.post("/fetch_member_details_fr_stp_policy", async (req, res) => {
  try {
    const data = req.body;

    // Fetch member details
    const select = "a.form_no,a.form_dt,a.policy_holder_type,a.member_id,a.association,a.memb_type,a.memb_oprn,a.memb_name,a.gender,a.dob,a.mem_address,a.phone_no,a.min_no,a.personel_no,a.memb_flag,a.dependent_name,a.spou_min_no,a.spou_dob,a.spou_phone,a.spou_gender,a.spou_address,a.dependent_flag,a.premium_type,b.unit_name,c.policy_holder_type,c.policy_holder_type_id";
    const table_name = "td_stp_ins a LEFT JOIN md_unit b ON a.association = b.unit_id LEFT JOIN md_policy_holder_type c ON a.policy_holder_type = c.policy_holder_type_id";
    const whr = `a.min_no = '${data.min_no}' AND a.member_id = '${data.member_id}' AND a.form_no = '${data.form_no}'`;
    const order = null;
    const stp_memb_dtls = await db_Select(select, table_name, whr, order);
    // console.log("stp_memb_dtls:", stp_memb_dtls);
    res.send(stp_memb_dtls);

  } catch (err) {
    console.error("Error in fetch_member_details_fr_stp_policy:", err);
    res.send({ error: "Internal Server Error" });
  }
});

// super_policyRouter.post("/fetch_max_premium_amt", async (req, res) => {
//   try{
//     const data = req.body;
//     const premium_type = data.premium_type;
//     // console.log(premium_type);
    

    
//     if (!premium_type) {
//       return res.send({ error: "Missing premium_type in request body." });
//     }

//       const maxYearResult = await db_Select(
//        "MAX(financial_year) AS max_year",
//       "md_stp_premium_type",
//       `premium_type = '${premium_type}'`,
//       null);
//    console.log(maxYearResult);
   
//         const maxFinancialYear = maxYearResult?.msg?.[0]?.max_year;
//       // console.log("Max finYear Result:", maxFinancialYear);

//       let premium_amt = null;

//       if (maxFinancialYear) {
//         const premiumResult = await db_Select(
//           "premium_amt",
//           "md_stp_premium_type",
//           `financial_year = '${maxFinancialYear}' AND premium_type = '${premium_type}'`,
//           null
//         );
//         // console.log("Premium Result:", premiumResult);

//         premium_amt = premiumResult?.msg?.[0]?.premium_amt;
//       }
//         res.send({
//       premium_type,
//       financial_year: maxFinancialYear,
//       premium_amt
//     });
//   }catch (err) {
//     console.error("Error in fetch premium amount:", err);
//     res.send({ error: "Internal Server Error" });
//   }
// })

super_policyRouter.post("/fetch_max_premium_amt", async (req, res) => {
  try {
    const data = req.body;
    const premium_type = data.premium_type;

    if (!premium_type) {
      return res.send({ error: "Missing premium_type in request body." });
    }

    const maxYearResult = await db_Select(
      "MAX(financial_year) AS max_year",
      "md_stp_premium_type",
      `premium_type = '${premium_type}'`,
      null
    );

    const maxFinancialYear =
      maxYearResult &&
      maxYearResult.msg &&
      maxYearResult.msg[0] &&
      maxYearResult.msg[0].max_year;

    let premium_amt = null;

    if (maxFinancialYear) {
      const premiumResult = await db_Select(
        "premium_amt",
        "md_stp_premium_type",
        `financial_year = '${maxFinancialYear}' AND premium_type = '${premium_type}'`,
        null
      );

      if (
        premiumResult &&
        premiumResult.msg &&
        premiumResult.msg[0] &&
        premiumResult.msg[0].premium_amt
      ) {
        premium_amt = premiumResult.msg[0].premium_amt;
      }
    }

    res.send({
      premium_type,
      financial_year: maxFinancialYear,
      premium_amt,
    });
  } catch (err) {
    console.error("Error in fetch premium amount:", err);
    res.send({ error: "Internal Server Error" });
  }
});


super_policyRouter.post("/edit_stp_member_details", async (req, res) => {
 try{
  var data = req.body;
  console.log(data,'mem_data');
  
 let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
 const spouMobile = data.spou_mobile ? String(data.spou_mobile).trim() : '';


var fields = `policy_holder_type = ${data.policy_holder_type ? `'${data.policy_holder_type}'` : 'NULL'},association =${data.unit_name ? `'${data.unit_name}'` : 'NULL'},memb_type = ${data.member_type ? `'${data.member_type}'` : 'NULL'},memb_oprn = ${data.memb_oprn ? `'${data.memb_oprn}'` : 'NULL'},memb_name =${data.memb_name ? `'${data.memb_name}'` : 'NULL'},gender = ${data.gender ? `'${data.gender}'` : 'NULL'},dob =  ${(data.dob && data.dob !== 'N/A' && data.dob !== 'undefined' && data.dob.trim() !== '') 
  ? `'${data.dob.split('T')[0]}'` : 'NULL'},mem_address = '${data.memb_addr.split("'").join("\\'")}',phone_no = ${data.phone_no ? `'${data.phone_no}'` : 'NULL'},personel_no = ${data.personel_no ? `'${data.personel_no}'` : 'NULL'},memb_flag = '${data.memb_flag}',dependent_name = ${data.spou_name ? `'${data.spou_name}'` : 'NULL'},spou_min_no = ${data.spou_min ? `'${data.spou_min}'` : 'NULL'},spou_dob = ${(data.spou_dob && data.spou_dob !== 'N/A' && data.spou_dob !== 'undefined' && data.spou_dob.trim() !== '') ? `'${data.spou_dob}'` : 'NULL'},spou_phone = ${
  spouMobile !== '' && /^\d+$/.test(spouMobile)
    ? spouMobile
    : 'NULL'
},spou_gender = ${data.spou_gender ? `'${data.spou_gender}'` : 'NULL'},spou_address = '${data.spou_addr.split("'").join("\\'")}', dependent_flag = '${data.dependent_flag}',premium_type = ${data.premium_type ? `'${data.premium_type}'` : 'NULL'},modified_by = '${data.user_name}',modified_at = '${datetime}'`,
table_name = "td_stp_ins",
values = null,
whr = `form_no = '${data.form_no}' AND member_id = '${data.member_id}' AND min_no = '${data.min_no}'`,
flag = 1;
var mem_dt = await db_Insert(table_name, fields, values, whr, flag);
res.send(mem_dt)
 }catch(error){
  console.log(error);
 }
});

// super_policyRouter.post("/fetch_premium_details_fr_stp_policy", async (req, res) => {
//   var data = req.body;

//   var select = "a.sl_no,a.min_no,a.ind_type,a.fin_year,a.particulars,a.amount,a.treatment_dtls,a.treatment_flag",
//   table_name = "td_stp_dtls a LEFT JOIN td_stp_ins b ON a.min_no = b.min_no",
//   whr = `a.min_no IN (
//         '${data.min_no}',
//         (SELECT spou_min_no FROM td_stp_ins WHERE min_no = '${data.min_no}')
//          )`,
//   order = `ORDER BY a.sl_no`;
//   var stp_premium_dtls = await db_Select(select,table_name,whr,order);
//   res.send(stp_premium_dtls);
// });

super_policyRouter.post("/fetch_premium_details_fr_stp_policy", async (req, res) => {
  var data = req.body;

  var select = "a.sl_no,a.min_no,a.ind_type,a.fin_year,a.particulars,a.amount,a.treatment_dtls,a.treatment_flag",
  table_name = "td_stp_dtls a LEFT JOIN td_stp_ins b ON a.min_no = b.min_no",
  whr = `a.min_no IN (
         SELECT DISTINCT min_no FROM (
         SELECT '${data.min_no}' AS min_no
         UNION
         SELECT spou_min_no 
         FROM td_stp_ins 
         WHERE min_no = '${data.min_no}' 
         AND spou_min_no IS NOT NULL AND spou_min_no != ''
        LIMIT 1
      ) AS min_list
      WHERE min_no IS NOT NULL
    )`,
  order = `ORDER BY a.sl_no`;
  var stp_premium_dtls = await db_Select(select,table_name,whr,order);
  res.send(stp_premium_dtls);
});

// super_policyRouter.post("/fetch_premium_details_fr_stp_policy", async (req, res) => {
//   var data = req.body;

//   var select = "a.sl_no,a.min_no,a.ind_type,a.fin_year,a.particulars,a.amount,a.treatment_dtls,a.treatment_flag",
//   table_name = "td_stp_dtls a LEFT JOIN td_stp_ins b ON a.min_no COLLATE utf8mb4_general_ci = b.min_no COLLATE utf8mb4_general_ci",
//   whr = `a.min_no COLLATE utf8mb4_general_ci IN (
//         '${data.min_no}' COLLATE utf8mb4_general_ci,
//         (SELECT spou_min_no COLLATE utf8mb4_general_ci FROM td_stp_ins WHERE min_no COLLATE utf8mb4_general_ci = '${data.min_no}' COLLATE utf8mb4_general_ci)
//          )`,
//   order = `ORDER BY a.sl_no`;
//   var stp_premium_dtls = await db_Select(select,table_name,whr,order);
//   res.send(stp_premium_dtls);
// });

super_policyRouter.post("/fetch_stp_trans_dtls", async (req, res) => {
 try{
   var data = req.body;

   var select = "form_no,trn_dt,trn_id,premium_amt,tot_amt,pay_mode,approval_status",
   table_name = "td_transactions",
   whr = `form_no = '${data.form_no}'`,
   order = null;
   var fetch_stp_transaction = await db_Select(select,table_name,whr,order);
   res.send(fetch_stp_transaction)
   console.log(fetch_stp_transaction,'fetch');
   
  }catch(error){
    console.error('Error:', error);
    res.send(error);
  }
});

super_policyRouter.post("/fetch_fr_view_stp_trans_dtls", async (req, res) => {
  try{
   var data = req.body;

   var select = "a.form_no,a.trn_dt,a.trn_id,a.premium_amt,a.tot_amt,a.pay_mode,a.approval_status,b.memb_name,b.min_no,b.premium_type",
   table_name = "td_transactions a LEFT JOIN td_stp_ins b ON a.form_no = b.form_no",
  //  table_name = "td_transactions a LEFT JOIN td_stp_ins b ON a.form_no COLLATE utf8mb4_general_ci = b.form_no COLLATE utf8mb4_general_ci",
   whr = `a.form_no = '${data.form_no}' AND a.trn_id = '${data.trn_id}'`,
   order = null;
   var fetch_stp_view_transaction = await db_Select(select,table_name,whr,order);
   res.send(fetch_stp_view_transaction)
   console.log(fetch_stp_view_transaction,'fetch');
   
  }catch(error){
    console.error('Error:', error);
    res.send(error);
  }
});

super_policyRouter.get('/download_super_mediclaim_pdf', async (req, res) => {
  try {
    const { form_no } = req.query;  

    if (!form_no) {
       return res.send('form_no is required');
    }

    const filePath = path.resolve('pdfs', `${form_no}.pdf`);
    console.log('Looking for file at:', filePath);

    if (!fs.existsSync(filePath)) {
      return res.send('PDF not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${form_no}.pdf`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.send('Internal Server Error');
  }
});

super_policyRouter.post("/save_trn_data_stp", async (req, res) => {
  var data = req.body;
  console.log(data, "trn_data_stp");
  var res_dt = await save_stp_data(data);
  res.send(res_dt);
});

module.exports = { super_policyRouter };
