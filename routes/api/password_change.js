const express = require("express");
const dateFormat = require("dateformat");
const { db_Select, db_Insert } = require("../../modules/MasterModule");
const bcrypt = require("bcrypt");
const password_change = express.Router();

password_change.post("/update_pass", async (req, res) => {
  var data = req.body,
    result;
  //   data = Buffer.from(data.data, "base64").toString();
  //   data = JSON.parse(data);
  // console.log(data);
  var select = "user_id,user_type,password",
    table_name = "md_user",
    whr = `user_id = '${data.user_email}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  if (res_dt.suc > 0) {
    if (res_dt.msg.length > 0) {
      if (await bcrypt.compare(data.old_pass, res_dt.msg[0].password)) {
        var pass = bcrypt.hashSync(data.new_pass, 10);
        var table_name = `md_user`,
          fields = `password = '${pass}'`,
          whr = `user_id = '${data.user_email}'`,
          flag = 1;
        var forget_pass = await db_Insert(table_name, fields, null, whr, flag);
        result = forget_pass;
      } else {
        result = {
          suc: 0,
          msg: "Please provide your correct old password",
          user_data: null,
        };
      }
    } else {
      result = { suc: 0, msg: "No data found", user_data: null };
    }
  } else {
    result = { suc: 0, msg: res_dt.msg };
  }
  res.send(result);
});

module.exports = { password_change };
