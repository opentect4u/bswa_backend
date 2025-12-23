const express = require('express');
const dateFormat = require('dateformat');
const { db_Select } = require('../../modules/MasterModule');
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

module.exports = {active_deactiveRouter}