const express = require("express");
const bcrypt = require("bcrypt");
const dateFormat = require("dateformat");
const {
  admin_login_data,
  member_login_data,
  superadmin_login_data,
  stp_member_login_data,
  user_data,
  stp_login_data,
} = require("../../modules/LoginModule");
const { db_Insert, db_Select } = require("../../modules/MasterModule");
const { createToken } = require("../../utils/jwt.util");
const LoginRouter = express.Router();

LoginRouter.post("/login", async (req, res) => {
  var data = req.body;
  data.pas = new Buffer.from(data.pas, "base64").toString();
  const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var log_dt = await admin_login_data(data);
  // console.log(log_dt, "123");
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

// LoginRouter.post("/member_login", async (req, res) => {
//   var data = req.body,response_data ={};
//   // data.pas = new Buffer.from(data.pas, "base64").toString();
//   const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
//   // 1. fetch data from md_user table
//   // 2. then check password
//   // 3. if password true then check which type of member (own_member y/n)
//   // 4. if own_member then fetch data from md_member and md_user and store in member_details json
//   // 5. if stp_user_status = 'A' fetch data from md_stp_ins and store in stp_details json
//   // 6. if children_user_status = 'A' fetch data from td_child_policy and store in cp_details json
//   // 7. last insert into md_user
//   var log_dt = await member_login_data(data);
//   // console.log(log_dt, "123");
//   if (log_dt.suc > 0) {
//     if (log_dt.msg.length > 0) {
//       if (await bcrypt.compare(data.pas, log_dt.msg[0].password)) {
//         try {
//           await db_Insert(
//             "md_user",
//             `last_log="${datetime}"`,
//             null,
//             `user_id='${log_dt.msg[0].uname}'`,
//             1
//           );
//         } catch (err) {
//           console.log(err);
//         }
//         let data = {
//           time: new Date(),
//           userdata: log_dt.msg,
//         };
//         const token = createToken(data);
//         res.send({ suc: 1, msg: data, token: token });
//       } else {
//         res.send({
//           suc: 0,
//           msg: "Please check your userid or password",
//           token: "",
//         });
//       }
//     } else {
//       res.send({
//         suc: 0,
//         msg: "Please check your userid or password",
//         token: "",
//       });
//     }
//   } else {
//     res.send({
//       suc: 0,
//       msg: "Please check your userid or password",
//       token: "",
//     });
//   }
// });

LoginRouter.post("/member_login", async (req, res) => {
  try {
  var data = req.body,response_data ={};
  // console.log(data,'datatatat');
  
  const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

  //FETCH USER DATA
  var log_dt  = await user_data(data);
  // console.log(log_dt,'log');
  
  if (log_dt .suc > 0 && log_dt .msg.length > 0) {
    // CHECK PASSWORD
      if (await bcrypt.compare(data.pas, log_dt.msg[0].password)) {

       const user = log_dt.msg[0];
      //  console.log(user,user);

       // FINAL RESPONSE FORMAT
      response_data = {
        userdata: [],
        stp_details: [],
        // cp_details: [],
        ismember: "N",
        hasstp: "N",
        time: new Date(),
        // hascp: "N"
      };

       //CHECK MEMBER TYPE
        if (user.user_type === "M") {
        response_data.ismember = "M";

         // FETCH MEMBER DETAILS
        let memb_dt = await member_login_data(data.username);
        // console.log(memb_dt,'mem');
        if (memb_dt.suc > 0) response_data.userdata = memb_dt.msg;
        }        

         // CHECK STP DETAILS
         if(user.stp_user_status === "A"){
           response_data.hasstp = "Y";

          let stp_dt = await stp_login_data(data.username);
        // console.log(stp_dt,'stp');

          if (stp_dt.suc > 0) response_data.stp_details = stp_dt.msg;
         }
       
         // CREATE TOKEN
        const token = createToken(data);
         res.send({
         suc: 1,
         msg: response_data,
         token: token
         });
        // res.send({ suc: 1, msg: data, token: token });
      } else {
        res.send({
          suc: 0,
          msg: "Password not match",
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
    } catch (error) {
    console.error("Member login error:", error);
    return res.send({
      suc: 0,
      msg: "Server error",
      token: ""
    });
  }
});

LoginRouter.post("/superadmin_login", async (req, res) => {
  var data = req.body;
  data.pas = new Buffer.from(data.pas, "base64").toString();
  const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var log_dt = await superadmin_login_data(data);
  // console.log(log_dt, "123");
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

LoginRouter.post("/stp_member_login", async (req, res) => {
  var data = req.body;
  console.log(data,'data_stp');
  
  const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var stp_log_dt = await stp_member_login_data(data);

  if (stp_log_dt.suc > 0) {
    if (stp_log_dt.msg.length > 0) {
      if (await bcrypt.compare(data.password, stp_log_dt.msg[0].password)) {
        try {
          await db_Insert(
            "md_stp_login",
            `last_log="${datetime}"`,
            null,
            `min_no='${stp_log_dt.msg[0].min_no}'`,
            1
          );
        } catch (err) {
          console.log(err);
        }
        let data = {
          time: new Date(),
          userdata: stp_log_dt.msg,
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

LoginRouter.get("/encrypt_member_passwords",async (req, res) => {
  try{
    const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

    // Select member details from the table
    var select = "form_no,policy_holder_type,member_id,min_no,memb_name,phone_no",
    table_name = "td_stp_ins",
    whr = null,
    order = null;
    var member_details = await db_Select(select,table_name,whr,order);

    if(member_details.suc > 0 && member_details.msg.length > 0){
      // Loop through each member's data
      for (let member of member_details.msg) {
      const form_no = member.form_no;
      const policy_holder_type = member.policy_holder_type;
      const member_id = member.member_id;
      const min_no = member.min_no;
      const memb_name = member.memb_name;
      const phone_no = member.phone_no;

       // Encrypt the min_no (as password)
      const encrypted_pwd = bcrypt.hashSync(min_no.toString(), 10);
      
       // Prepare the insert statement for the new table
       var table_name = "md_stp_login",
        fields = `(policy_holder_type,min_no,form_no,stp_memb_name,stp_memb_phone,password,stp_user_status,created_by,created_at)`,
        values = `('${policy_holder_type}','${member_id}','${form_no}','${memb_name}','${phone_no}','${encrypted_pwd}','A','Migration','${datetime}')`,
        whr = null,
        flag = 0;
      var res_dt = await db_Insert(table_name, fields, values, whr, flag); 
      }

        res.send({
        success: true,
        message: "Passwords encrypted and inserted successfully.",
      });
    } else {
      res.send({
        success: false,
        message: "No member records found.",
      });
    }
  }catch(error){
    console.error("❌ Error:", error);
    res.send({
      error: "Something went wrong while encrypting passwords",
    });
  }
});

module.exports = { LoginRouter };
