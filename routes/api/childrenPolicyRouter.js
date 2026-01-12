const express = require("express");
const dateFormat = require("dateformat");
const { db_Select } = require("../../modules/MasterModule");
const { children_form_save, save_cp_data, reject_dt } = require("../../modules/children_policyModule");
const childrenPolicyRouter = express.Router();

childrenPolicyRouter.post("/fetch_member_dtls_bspwa", async (req, res) => {
 try{
   var data = req.body;
//    console.log(data,'data_cp');

     //CHECK IF MEMBER EXISTS IN CHILD POLICY

      var check_member = await db_Select(
      "member_id",
      "td_child_policy",
      `member_id='${data.member_id}'`,
      null
    );

     if (check_member.suc > 0 && check_member.msg.length > 0) {
      return res.send({
        suc: 0,
        msg: "Member already exists"
      });
    }

   // Fetch MEMBER details
   var select = "member_id,memb_name,gurdian_name,gender,marital_status,DATE_FORMAT(dob, '%Y-%m-%d') dob,IFNULL(TIMESTAMPDIFF(YEAR, dob, CURDATE()), 0) AS age,memb_address,phone_no",
   table_name = "md_member",
   whr = `member_id = '${data.member_id}'`,
   order = null;
   var res_data = await db_Select(select,table_name,whr,order);

    // Fetch DEPENDENTS (optional)
    var select = "dependent_name,relation,DATE_FORMAT(dob, '%Y-%m-%d') dob,IFNULL(TIMESTAMPDIFF(YEAR, dob, CURDATE()), 0) AS age",
    table_name = "md_dependent",
    whr = `member_id = '${data.member_id}'`,
    order = null;
    var res_dependent_data = await db_Select(select,table_name,whr,order);

    // GENDER MAPPING
    const femaleList = [2, 3, 4, 6, 9, 10, 14];

    let dependents = [];
    if (res_dependent_data.suc > 0) {
      dependents = res_dependent_data.msg.map(d => {
        let gender = "";

        if (d.relation == 0) {
          gender = "";
        } 
        else if (femaleList.includes(Number(d.relation))) {
          gender = "Female";
        } 
        else if ([1, 5, 7, 8, 12, 13].includes(Number(d.relation))) {
          gender = "Male";
        } 
        else {
          gender = "Transgender";
        }

        return {
          ...d,
          gender: gender
        };
      });
    }

    return res.send({
      suc: 1,
      member: res_data.suc > 0 ? res_data.msg : [],
      dependents: dependents // return empty array when no dependents
    });

 }catch(error){
 console.log(error);
    return res.send({
      suc: 0,
      msg: "Something went wrong"
    });
 }
});

// submit children policy data
childrenPolicyRouter.post("/save_children_policy", async (req, res) => {
    var data = req.body,res_dt;
    console.log(data,'datacp');

    children_form_save(data).then(data => {
      res_dt = data
    }).catch(err => {
        res_dt = err
    }).finally (() => {
        res.send(res_dt)
    })
});

childrenPolicyRouter.get("/frm_list_child_policy", async (req, res) => {
  var data = req.query;
  
  var select = "form_no,form_dt,member_id,member_name,phone_no,approval_status",
    table_name = "td_child_policy",
    whr = `approval_status IN('P','R','A')`;
    order = `ORDER BY form_no desc`;
  var res_dt_1 = await db_Select(select, table_name, whr, order);
  res.send(res_dt_1);
});

childrenPolicyRouter.post("/search_form_child", async (req, res) => {
var data = req.body;

  var select = "form_no,form_dt,member_id,member_name,approval_status",
    table_name = "td_child_policy",
    whr = `(form_no like '%${data.form_no}%' OR member_name like '%${data.form_no}%') 
    AND approval_status IN('P','R','A')`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

childrenPolicyRouter.post("/fetch_member_details_fr_cp_policy_app", async (req, res) => {
  try {
    const data = req.body;

    // Fetch member details
    const select = "a.form_no,a.flag,a.member_id,a.member_name,a.dob,a.gender,a.marital_status,a.status,a.age,a.phone_no,a.member_address,a.gurdian_name,a.policy_amount,a.premium_amount,b.cp_user_status";
    const table_name = "td_child_policy a LEFT JOIN md_user b ON a.form_no = b.cp_form_no AND a.member_id = b.user_id";
    const whr = `a.form_no = '${data.form_no}'
                 AND b.user_status = 'A'
                 AND b.cp_user_status = 'A'`;
    const order = null;
    const cp_memb_dtls = await db_Select(select, table_name, whr, order);
    // console.log("stp_memb_dtls:", stp_memb_dtls);
    res.send(cp_memb_dtls);

  } catch (err) {
    console.error("Error in fetch_member_details_fr_cp_policy:", err);
    res.send({ error: "Internal Server Error" });
  }
});

childrenPolicyRouter.post("/fetch_cp_trans_dtls", async (req, res) => {
 try{
   var data = req.body;

   var select = "form_no,trn_dt,trn_id,premium_amt,tot_amt,pay_mode,receipt_no,approval_status",
   table_name = "td_transactions",
   whr = `form_no = '${data.form_no}'`,
   order = null;
   var fetch_cp_transaction = await db_Select(select,table_name,whr,order);
   res.send(fetch_cp_transaction)
  //  console.log(fetch_cp_transaction,'fetch');
  }catch(error){
    console.error('Error:', error);
    res.send(error);
  }
});

childrenPolicyRouter.get("/get_member_policy_print_cp", async (req, res) => {
  var data = req.query,
    res_dt;
      var select =
          "form_no,form_dt,flag,member_id,member_name,dob,gender,marital_status,status,age,phone_no,member_address,gurdian_name,policy_amount,premium_amount,approval_status,trns_type,effective_date,resolution_no,remarks,created_by,created_at,modified_by,modified_at,approved_by,approved_at,rejected_by,rejected_at",
        table_name = "td_child_policy",
        whr = `member_id ='${data.member_id}'
         AND form_no = '${data.form_no}'`,
        order = null;
      res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

childrenPolicyRouter.get("/get_cp_transaction", async (req, res) => {
  var data = req.query;
  // console.log(data, "hhhh");
  var select =
      "form_no,form_dt,member_id,remarks,approval_status,resolution_no,effective_date",
    table_name = "td_child_policy",
    whr = `form_no ='${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "kiki");
  res.send(res_dt);
});

childrenPolicyRouter.get("/get_cp_transaction_reject", async (req, res) => {
  var data = req.query;
  // console.log(data, "hhhh");
  var select =
      "a.form_no,a.form_dt,a.member_id,a.remarks,a.approval_status,a.resolution_no,a.effective_date,a.rejected_by,a.rejected_at",
    table_name = "td_child_policy a",
    whr = `a.form_no ='${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "kiki");
  res.send(res_dt);
});

childrenPolicyRouter.post("/reject_cp_topup", async (req, res) => {
  var data = req.body;
  // console.log(data,'reject');
  var res_dt = await reject_dt(data);
  res.send(res_dt);
});

childrenPolicyRouter.post("/save_trn_data_cp", async (req, res) => {
  var data = req.body;
  // console.log(data, "trn_data_stp");
  var res_dt = await save_cp_data(data);
  res.send(res_dt);
});

childrenPolicyRouter.get("/fetch_dependent_details_cp", async (req, res) => {
  var data = req.query;

  var select = "form_no,member_id,dependent_name,dob,gender,status,age,active_flag,treatment_flag,treatment_dtls",
  table_name = "td_child_policy_dependent",
  whr = `member_id ='${data.member_id}'
         AND form_no = '${data.form_no}'`,
  order = null;
  var dependent_data = await db_Select(select,table_name,whr,order);
  res.send(dependent_data);
})

module.exports = {childrenPolicyRouter}