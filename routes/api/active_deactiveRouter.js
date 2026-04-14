const express = require('express');
const dateFormat = require('dateformat');
const { db_Select, db_Insert } = require('../../modules/MasterModule');
const { sendSms } = require('../../modules/smsModule');
const active_deactiveRouter = express.Router();

active_deactiveRouter.post("/fetch_active_deactive_memb_dtls", async (req, res) => {
    try {
   var data = req.body;

   const page = parseInt(data.page) || 1;
   const limit = parseInt(data.limit) || 10;
   const offset = (page - 1) * limit;

   // Total Count
    const countRes = await db_Select(
      "COUNT(*) total",
      "md_member",
      `memb_status = '${data.status}'`,
      null
    );
    const totalRecords = countRes && countRes.msg && countRes.msg.length > 0 ? countRes.msg[0].total
    : 0;

     // Paginated Data
   var select = "member_id,memb_name,phone_no,memb_status",
   table_name = "md_member",
   whr = `memb_status = '${data.status}'`,
   order = `ORDER BY form_dt DESC LIMIT ${limit} OFFSET ${offset}`;
   var status_details = await db_Select(select,table_name,whr,order);
   res.send({
      suc: 1,
      msg: status_details.msg || [],
      total: totalRecords
    });
     } catch (err) {
    console.error(err);
    res.send({ suc: 0, msg: [] });
  }
});

active_deactiveRouter.post("/view_member_dtls", async (req, res) => {
  try{
    var data = req.body;

    var select = "a.form_no,a.member_id,a.memb_name,a.mem_type,a.memb_oprn,a.phone_no,a.unit_id,a.gender,a.memb_status,b.unit_name",
    table_name = "md_member a LEFT JOIN md_unit b ON a.unit_id = b.unit_id",
    whr = `a.member_id = '${data.member_id}'`,
    order = null;
    var view_mem_details = await db_Select(select,table_name,whr,order);
    res.send({
      suc: 1,
      msg: view_mem_details.msg || [],
    });
  }catch(error){
    console.error(error);
    res.send({ suc: 0, msg: [] });
  }
});

active_deactiveRouter.post("/change_status", async (req, res) => {
  try{
    var data = req.body;
    // console.log(data,'ftft');
    
    let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
    
    var table_name = "md_member",
    fields = `memb_status = '${data.memb_status}', active_deactive_by = '${data.user_id}', active_deactive_at = '${datetime}'`,
    values = null,
    whr = `form_no = '${data.form_no}' AND member_id = '${data.member_id}'`,
    flag = 1;
    var change_status = await db_Insert(table_name,fields,values,whr,flag);
    
    // No DB update
    if (!change_status || change_status.lastId.affectedRows === 0) {
      return res.send({
        suc: 0,
        msg: 'No record updated'
      });
    }

    // DB updated successfully — send SMS
    try {
      if (data.phone_no) {
        // await sendSms(
        //   data.phone_no,
        //   "NEW_SUBSCRIPTION_FORM_APPROVED",
        //   [
        //     data.member_id
        //   ]
        // );
      }
    } catch (smsErr) {
      console.error("SMS sending failed:", smsErr);
    }

    // FINAL SUCCESS RESPONSE
    return res.send({
      suc: 1,
      msg: 'Status updated successfully'
    });
  }catch(error){
     console.error(error);
    res.send({ suc: 0, msg: [] });
  }
});

module.exports = {active_deactiveRouter}