const express = require("express");
const dateFormat = require("dateformat");
const bcrypt = require("bcrypt");
const { db_Select } = require("../../modules/MasterModule");
const { admin_dt } = require("../../modules/add_adminModule");
const add_adminRouter = express.Router();

add_adminRouter.get("/get_add_admin_data", async (req, res) => {
  var data = req.query;
  var select = "*",
    table_name = "md_user",
    where = `user_type = 'A' ${
      data.user_id ? `and user_id='${data.user_id}'` : ""
    }`;
  order = null;
  var res_dt = await db_Select(select, table_name, where, order);
  res.send(res_dt);
});

add_adminRouter.post("/add_admin_data", async (req, res) => {
  var data = req.body;
  console.log(data, "1111");
  var res_dt = await admin_dt(data);
  res.send(res_dt);
});

module.exports = { add_adminRouter };
