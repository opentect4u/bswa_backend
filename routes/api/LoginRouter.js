const express = require("express");
const bcrypt = require("bcrypt");
const dateFormat = require("dateformat");
const {
  admin_login_data,
  member_login_data,
  superadmin_login_data,
} = require("../../modules/LoginModule");
const { db_Insert } = require("../../modules/MasterModule");
const { createToken } = require("../../utils/jwt.util");
const LoginRouter = express.Router();

LoginRouter.post("/login", async (req, res) => {
  var data = req.body;
  data.pas = new Buffer.from(data.pas, "base64").toString();
  const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var log_dt = await admin_login_data(data);
  console.log(log_dt, "123");
  // let year = new Date().getFullYear();
  // const serialNumber = 1;
  // const paddedSerialNumber = serialNumber.toString().padStart(5, '0');
  // let form_no = `G${year}${paddedSerialNumber}`;
  // console.log(form_no, "pppp");
  if (log_dt.suc > 0) {
    if (log_dt.msg.length > 0) {
      if (await bcrypt.compare(data.pas, log_dt.msg[0].password)) {
        try {
          await db_Insert(
            "md_user",
            `last_log="${datetime}"`,
            null,
            `user_email='${log_dt.msg[0].uname}'`,
            1
          );
        } catch (err) {
          console.log(err);
        }
        let data = {
          time: new Date(),
          userdata: log_dt.msg,
        };
        const token = createToken(data);
        res.send({ suc: 1, msg: data, token: token });
      } else {
        res.send({
          suc: 0,
          msg: "Please check your userid or password",
          token: "",
        });
      }
    } else {
      res.send({
        suc: 0,
        msg: "Please check your userid or password",
        token: "",
      });
    }
  } else {
    res.send({
      suc: 0,
      msg: "Please check your userid or password",
      token: "",
    });
  }
});

LoginRouter.post("/member_login", async (req, res) => {
  var data = req.body;
  // data.pas = new Buffer.from(data.pas, "base64").toString();
  const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var log_dt = await member_login_data(data);
  console.log(log_dt, "123");
  if (log_dt.suc > 0) {
    if (log_dt.msg.length > 0) {
      if (await bcrypt.compare(data.pas, log_dt.msg[0].password)) {
        try {
          await db_Insert(
            "md_user",
            `last_log="${datetime}"`,
            null,
            `user_id='${log_dt.msg[0].uname}'`,
            1
          );
        } catch (err) {
          console.log(err);
        }
        let data = {
          time: new Date(),
          userdata: log_dt.msg,
        };
        const token = createToken(data);
        res.send({ suc: 1, msg: data, token: token });
      } else {
        res.send({
          suc: 0,
          msg: "Please check your userid or password",
          token: "",
        });
      }
    } else {
      res.send({
        suc: 0,
        msg: "Please check your userid or password",
        token: "",
      });
    }
  } else {
    res.send({
      suc: 0,
      msg: "Please check your userid or password",
      token: "",
    });
  }
});

LoginRouter.post("/superadmin_login", async (req, res) => {
  var data = req.body;
  data.pas = new Buffer.from(data.pas, "base64").toString();
  const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var log_dt = await superadmin_login_data(data);
  console.log(log_dt, "123");
  if (log_dt.suc > 0) {
    if (log_dt.msg.length > 0) {
      if (await bcrypt.compare(data.pas, log_dt.msg[0].password)) {
        try {
          await db_Insert(
            "md_user",
            `last_log="${datetime}"`,
            null,
            `user_email='${log_dt.msg[0].uname}'`,
            1
          );
        } catch (err) {
          console.log(err);
        }
        let data = {
          time: new Date(),
          userdata: log_dt.msg,
        };
        const token = createToken(data);
        res.send({ suc: 1, msg: data, token: token });
      } else {
        res.send({
          suc: 0,
          msg: "Please check your userid or password",
          token: "",
        });
      }
    } else {
      res.send({
        suc: 0,
        msg: "Please check your userid or password",
        token: "",
      });
    }
  } else {
    res.send({
      suc: 0,
      msg: "Please check your userid or password",
      token: "",
    });
  }
});
module.exports = { LoginRouter };
