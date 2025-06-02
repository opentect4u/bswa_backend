const { db_Insert, db_Select } = require("../../modules/MasterModule");

const express = require("express");
const dateFormat = require("dateformat");
const multer = require("multer");
const csv = require('csv-parser');
const fs = require("fs");

const upload_child_policyRouter = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: "uploads/" });

const getMaxFormNo = (flag) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!flag || typeof flag !== 'string') {
        return reject(new Error("Invalid or missing 'flag' parameter."));
      }

      const prefixLength = flag.length;
      const select = `
        MAX(CAST(SUBSTRING(form_no, ${prefixLength + 1}) AS UNSIGNED)) AS max_form
      `;
      const table_name = "td_child_policy";
      const whr = `SUBSTRING(form_no, 1, ${prefixLength}) = '${flag}'`;
      const order = null;

      const res_dt = await db_Select(select, table_name, whr, order);

      // const maxFormRaw = res_dt[0]?.max_form || 0;
      const maxFormRaw = (res_dt[0] && res_dt[0].max_form) ? res_dt[0].max_form : 0;
      resolve(parseInt(maxFormRaw, 10)); // Return as number (not padded string)
    } catch (error) {
      reject(error);
    }
  });
};

upload_child_policyRouter.post('/upload_child_policy', async (req, res) => {
  const data = req.body.data;
  // console.log(data);

  const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  const year = dateFormat(new Date(), "yyyy");
  const created_by = 'Sail';

  if (!Array.isArray(data) || data.length === 0) {
    return res.json({ message: 'No data received' });
  }

  function quote(val, isDate = false) {
    if (val === null || val === undefined || val === '') return 'NULL';
    if (isDate) return `'${val}'`;
    if (typeof val === 'number') return val;
    return `'${String(val).replace(/'/g, "''")}'`;
  }

  function cleanDate(dateStr) {
    if (!dateStr) return null;
    const d = dateStr.toString().trim().replace(/\//g, '-');
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    return null;
  }

  try {
    const prefix = 'CP' + `${year}`;
    const formNoMap = {}; // Stores numeric max form number
    const td_child_policy_values = [];
    const td_child_policy_dependent_values = [];

    // Fetch and store the current max form number (as integer)
    if (!formNoMap[prefix]) {
      const maxFormRaw = await getMaxFormNo(prefix); // Returns number
      formNoMap[prefix] = maxFormRaw; // e.g., 124
    }

    const memberMap = new Map();

    // Group data by memberNo
    for (const row of data) {
      if (!memberMap.has(row.memberNo)) {
        memberMap.set(row.memberNo, []);
      }
      memberMap.get(row.memberNo).push(row);
    }

    // Process each member and their dependents
    for (const [memberNo, rows] of memberMap.entries()) {
      const datetimeNow = `'${datetime}'`;
      formNoMap[prefix] += 1; // Increment ONCE per member group
      const paddedNum = formNoMap[prefix].toString().padStart(6, '0');
      const form_no = `${prefix}${paddedNum}`;

      for (const row of rows) {
        const dobClean = cleanDate(row.dob);
        const effDateClean = cleanDate(row.effectiveDate);

        // Validate age
        const ageVal = Number(row.age);
        if (isNaN(ageVal)) {
          console.warn(`Skipping row due to invalid age (memberNo: ${row.memberNo}):`, row.age);
          continue;
        }

        if (row.status === 'SELF') {
          td_child_policy_values.push(`(
            '${form_no}',
            ${datetimeNow},
            'CP',
            ${quote(row.memberNo)},
            ${quote(row.name)},
            ${quote(dobClean, true)},
            ${quote(row.gender)},
            ${quote(row.status)},
            ${ageVal},
            ${quote(effDateClean, true)},
            ${quote(row.policyAmount)},
            ${quote(row.premium)},
            'A',
            'Online',
            ${quote(created_by)},
            ${datetimeNow}
          )`);

          td_child_policy_dependent_values.push(`(
            '${form_no}',
            ${quote(row.memberNo)},
            ${quote(row.name)},
            ${quote(dobClean, true)},
            ${quote(row.gender)},
            ${quote(row.status)},
            ${ageVal},
            ${quote(created_by)},
            ${datetimeNow}
          )`);
        } else {
          td_child_policy_dependent_values.push(`(
            '${form_no}',
            ${quote(row.memberNo)},
            ${quote(row.dependname)},
            ${quote(dobClean, true)},
            ${quote(row.gender)},
            ${quote(row.status)},
            ${ageVal},
            ${quote(created_by)},
            ${datetimeNow}
          )`);
        }
      }
    }

    // Insert into td_child_policy
    const member_fields = '(form_no,form_dt,flag,member_id,member_name,dob,gender,status,age,effective_date,policy_amount,premium_amount,approval_status,trns_type,created_by,created_at)';
    const res_member = await db_Insert('td_child_policy', member_fields, td_child_policy_values, null, 0);

    // Insert into td_child_policy_dependent
    if (td_child_policy_dependent_values.length > 0) {
      const dep_fields = '(form_no,member_id,dependent_name,dob,gender,status,age,created_by,created_at)';
      await db_Insert('td_child_policy_dependent', dep_fields, td_child_policy_dependent_values, null, 0);
    }

    res.json({ message: 'Data inserted successfully', inserted: { members: res_member } });

  } catch (err) {
    console.error('DB Insert Error:', err);
    res.json({ message: 'Database insert failed', error: err });
  }
});

upload_child_policyRouter.post("/fetch_member_details_fr_child_policy", async (req, res) => {
  try{
   var data = req.body;
  //  console.log(data,'datac');
   
   var select = "a.form_no,a.form_dt,a.flag,a.member_id,a.member_name,a.dob,a.gender,a.status,a.age,a.effective_date,a.policy_amount,a.premium_amount,a.approval_status,a.trns_type,b.phone_no",
   table_name = "td_child_policy a LEFT JOIN md_member b ON a.member_id COLLATE utf8mb4_general_ci = b.member_id COLLATE utf8mb4_general_ci",
   whr = `a.member_id = '${data.memb_id}'`,
   order = null;
   var memb_dtls_child_pol = await db_Select(select,table_name,whr,order);
   res.send(memb_dtls_child_pol)
  }catch(error){
    console.error('Error:', error);
    res.send(error);
  }
});

upload_child_policyRouter.post("/fetch_member_depend_details_fr_child_policy", async (req, res) => {
  try{
   var data = req.body;
  //  console.log(data,'datac');
   
   var select = "form_no,member_id,dependent_name,dob,gender,status,age",
   table_name = "td_child_policy_dependent",
   whr = `member_id = '${data.memb_id}'`,
   order = null;
   var depend_dtls_child_pol = await db_Select(select,table_name,whr,order);
   res.send(depend_dtls_child_pol)
  }catch(error){
    console.error('Error:', error);
    res.send(error);
  }
});

upload_child_policyRouter.post("/fetch_trans_dtls", async (req, res) => {
  try{
   var data = req.body;
  //  console.log(data,'datac');
   
  //  var select = "*",
  //  table_name = "td_pg_transaction",
  //  whr = `SUBSTRING_INDEX(udf4, '||', 1) = '${data.member_id}'`,
  //  order = null;
  //  var fetch_transaction = await db_Select(select,table_name,whr,order);
  //  res.send(fetch_transaction)

   var select = "a.form_no,a.trn_dt,a.trn_id,a.premium_amt,a.tot_amt,a.pay_mode,a.receipt_no,a.approval_status,b.udf3",
   table_name = "td_transactions a LEFT JOIN td_pg_transaction b ON a.form_no = SUBSTRING_INDEX(SUBSTRING_INDEX(b.udf4, '||', 3), '||', -1) AND a.trn_id = b.mer_order_no AND DATE(a.trn_dt) = b.entry_dt",
   whr = `b.trns_status = 'SUCCESS' AND SUBSTRING_INDEX(b.udf4, '||', 1) = '${data.member_id}'`,
   order = null;
   var fetch_transaction = await db_Select(select,table_name,whr,order);
   res.send(fetch_transaction)
   console.log(fetch_transaction,'fetch');
   
  }catch(error){
    console.error('Error:', error);
    res.send(error);
  }
});

upload_child_policyRouter.post("/fetch_view_trans_dtls", async (req, res) => {
  try{
   var data = req.body;
   console.log(data,'datac');
   
   var select = "a.form_no,a.trn_dt,a.trn_id,a.premium_amt,a.tot_amt,a.pay_mode,a.receipt_no,a.approval_status,b.udf3",
   table_name = "td_transactions a LEFT JOIN td_pg_transaction b ON a.form_no = SUBSTRING_INDEX(SUBSTRING_INDEX(b.udf4, '||', 3), '||', -1) AND a.trn_id = b.mer_order_no AND DATE(a.trn_dt) = b.entry_dt",
   whr = `b.trns_status = 'SUCCESS' AND SUBSTRING_INDEX(b.udf4, '||', 1) = '${data.member_id}' AND a.trn_id = '${data.trn_id}'`,
   order = null;
   var fetch_transaction_view = await db_Select(select,table_name,whr,order);
   res.send(fetch_transaction_view)
  }catch(error){
    console.error('Error:', error);
    res.send(error);
  }
});

// upload_child_policyRouter.post('/upload_child_policy', async (req, res) => {
//   const data = req.body.data;
//   console.log(data);
  
//   let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
//   let year = dateFormat(new Date(), "yyyy");
//   let created_by = 'Sail'
//   // console.log(data);
  
//    const no = await getMaxFormNo('C');
//       let form_no = `C${year}${no.msg[0].max_form}`;

//   if (!Array.isArray(data) || data.length === 0) {
//     return res.json({ message: 'No data received' });
//   }

//  function quote(val, isDate = false) {
//   if (val === null || val === undefined || val === '') return 'NULL'; // MySQL accepts NULL for empty
//   if (isDate) {
//     // For dates, wrap with quotes
//     return `'${val}'`;
//   }
//   if (typeof val === 'number') return val;
//   return `'${String(val).replace(/'/g, "''")}'`;
// }

// function cleanDate(dateStr) {
//   if (!dateStr) return null; // null for empty or undefined
//   const d = dateStr.toString().trim().replace(/\//g, '-');
//   // Simple date validation (YYYY-MM-DD)
//   if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
//   return null; // invalid date
// }


//   try {
//     // if(row.userType == 'M'){
//      const formNoMap = {}; // cache form numbers per member prefix
// var table_name = 'td_child_policy',
//     fields = '(form_no,form_dt,member_id,member_name,dob,gender,status,effective_dt,policy_amount,premium_amount,created_by,created_at)',

//   values = data.map(row => {
//     const dobClean = cleanDate(row.dob);
//     const effDateClean = cleanDate(row.effectiveDate);
//   return `(
//       ${form_no},
//       '${datetime}',
//       ${quote(row.memberNo)},
//       ${quote(row.name)},
//       ${quote(dobClean, true)},
//       ${quote(row.gender)},
//       ${quote(row.status)},
//       ${quote(effDateClean, true)},
//       ${quote(row.policyAmount)},
//       ${quote(row.premium)},
//       ${created_by},
//       ${datetime}
//     )`;
//   });
//     whr = null;
//     flag = 0;
//     var res_dt = await db_Insert(table_name, fields, values, whr, flag);
//     // }
    
//     res.json({ message: 'Data inserted successfully', inserted: res_dt });

//   } catch (err) {
//     console.error('DB Insert Error:', err);
//     res.json({ message: 'Database insert failed', error: err });
//   }
// });



module.exports = {upload_child_policyRouter}