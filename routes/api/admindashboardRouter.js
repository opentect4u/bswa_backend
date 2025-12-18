const express = require('express');
const { checkedToken } = require('../../middleware/ApiAuthChecked.middleware');
const { db_Select, db_Insert } = require('../../modules/MasterModule');
const admindashboardRouter = express.Router();

// admindashboardRouter.get("/get_admin_dashboard_data", async (req, res) => {
//   var data = req.query;
//   var select = `CASE 
//       WHEN mem_type = 'G' THEN 'General'
//       WHEN mem_type = 'AI' THEN 'Associate'
//       WHEN mem_type = 'L' THEN 'Life'
//       ELSE mem_type
//     END AS mem_type, COUNT(*) AS total`,
//   table_name = "md_member",
//   whr = `mem_type IN ('G', 'AI', 'L')`;
//   order = `GROUP BY mem_type
//            ORDER BY mem_type ASC`;
//   var res_dt = await db_Select(select, table_name, whr, order);
//   res.send(res_dt);
// });

admindashboardRouter.get("/get_admin_dashboard_data", async (req, res) => {
  var data = req.query;
  var select = `a.*`,
  table_name = `(
            SELECT 'Total' AS mem_type, COUNT(*) AS total
            FROM md_member
            WHERE mem_type IN ('G', 'AI', 'L')
            UNION ALL
            SELECT 
            CASE 
            WHEN mem_type = 'G'  THEN 'General'
            WHEN mem_type = 'AI' THEN 'Associate'
            WHEN mem_type = 'L'  THEN 'Life'
            END AS mem_type,
            COUNT(*) AS total
            FROM md_member
            WHERE mem_type IN ('G', 'AI', 'L')
            GROUP BY mem_type
            ) a`,
  whr = "";
  order = "";
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

admindashboardRouter.get("/get_pending_data", async (req, res) =>{
    var data = req.query;
    var select = `
                  (SELECT  COUNT(*) FROM md_member WHERE memb_status = 'P') AS member_pending,
                  (SELECT  COUNT(*) FROM td_child_policy WHERE approval_status = 'U') AS children_pending,
                  (SELECT  COUNT(*) FROM td_gen_ins WHERE form_status = 'P') AS existing_group_pending,
                  (SELECT  COUNT(*) FROM td_stp_ins WHERE form_status = 'P') AS stp_pending`,
    table_name = "dual",
    whr = "",
    order = "";
    var res_dtls = await db_Select(select,table_name,whr,order);
    res.send(res_dtls);
});

admindashboardRouter.post("/get_tot_user", async (req, res) => {
 var data = req.body;
//  console.log(data,'datatata');
 
  var select = "COUNT(*) tot_dt",
    table_name = "md_user a LEFT JOIN md_member b ON a.user_id = b.member_id",
    whr = `b.unit_id = ${data.unit_id} AND user_status='A'`;
  order = null;
  var active_resData = await db_Select(select, table_name, whr, order);

  var select = "COUNT(*) tot_dt",
    table_name = "md_user a LEFT JOIN md_member b ON a.user_id = b.member_id",
    whr = `b.unit_id = ${data.unit_id} AND user_status='D'`;
  order = null;
  var inactive_resData = await db_Select(select, table_name, whr, order);
  var final_res = {
    suc: 1,
    msg: {
      act_dt:
        active_resData.suc > 0 && active_resData.msg.length > 0
          ? active_resData.msg[0].tot_dt
          : 0,
      deact_dt:
        inactive_resData.suc > 0 && inactive_resData.msg.length > 0
          ? inactive_resData.msg[0].tot_dt
          : 0,
    },
  };
  res.send(final_res)
});

admindashboardRouter.post("/fetch_profile_details", async (req, res) => {
 var data = req.body;

 var select = "user_id,user_type,user_name,user_email,user_phone,user_status",
 table_name = "md_user",
 whr = `user_id = '${data.user_id}'`,
 order = null;
 var fetch_profile_details = await db_Select(select,table_name,whr,order);
 res.send(fetch_profile_details);
});

admindashboardRouter.post("/save_admin_profile_details", async (req, res) => {
  var data = req.body;
  let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

  var table_name = "md_user",
  fields = `user_name = '${data.user_name}', user_email = '${data.user_email}', user_phone = '${data.user_phone}', modified_by = '${data.user_id}', modified_at = '${datetime}'`,
  values = null,
  whr = `user_id = '${data.user_id}'`,
  flag = 1;
  var data_save = await db_Insert(table_name,fields,values,whr,flag);
  res.send(data_save);
});

module.exports = {admindashboardRouter}
