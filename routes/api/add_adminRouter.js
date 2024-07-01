const express = require("express");
const dateFormat = require("dateformat");
const bcrypt = require("bcrypt");
const add_adminRouter = express.Router();

add_adminRouter.post("/add_admin_data", async (req, res) => {
  var data = req.body;
  console.log(data, "1111");
  var res_dt = await admin_dt(data);
  res.send(res_dt);
});

module.exports = { add_adminRouter };
