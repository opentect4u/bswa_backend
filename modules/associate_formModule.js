var dateFormat = require("dateformat"),
  path = require("path"),
  fs = require("fs"),
  bcrypt = require("bcrypt");
const {
  db_Select,
  db_Insert,
  generateDBValue,
  GenPassword,
  formStatus,
} = require("./MasterModule");
const { sendWappMsg } = require("./whatsappModule");

const getMaxFormNo = (flag) => {
  return new Promise(async (resolve, reject) => {
    var select =
      flag != "AI"
        ? "IF(MAX(SUBSTRING(form_no, -6)) > 0, LPAD(MAX(cast(SUBSTRING(form_no, -6) as unsigned))+1, 6, '0'), '000001') max_form"
        : // : "IF(MAX(SUBSTRING(form_no, -7)) > 0, LPAD(MAX(SUBSTRING(form_no, -7))+1, 6, '0'), '000001') max_form",
          "IF(MAX(SUBSTRING(form_no, -6)) > 0, LPAD(MAX(cast(SUBSTRING(form_no, -6) as unsigned))+1, 6, '0'), '000001') max_form";
    (table_name = "md_member"),
      (whr =
        flag != "AI"
          ? `SUBSTRING(form_no, 1, 1) = '${flag}'`
          : `SUBSTRING(form_no, 1, 2) = '${flag}'`),
      (order = null);
    var res_dt = await db_Select(select, table_name, whr, order);
    resolve(res_dt);
  });
};

// const getMember = (flag) => {
//   return new Promise(async (resolve, reject) => {
//     var select =
//         flag != "AI"
//           ? "IF(MAX(SUBSTRING(member_id, 3)) > 0, MAX(SUBSTRING(member_id, 3))+1, '1') member_id"
//           : "IF(MAX(SUBSTRING(member_id, 4)) > 0, MAX(SUBSTRING(member_id, 4))+1, '1') member_id",
//       table_name = "md_member",
//       whr =
//         flag != "AI"
//           ? `SUBSTRING(member_id, 1, 1) = '${flag}'`
//           : `SUBSTRING(member_id, 1, 2) = '${flag}'`,
//       order = null;
//     var res_dt = await db_Select(select, table_name, whr, order);
//     resolve(res_dt);
//   });
// };

const getMember = (flag) => {
  return new Promise(async (resolve, reject) => {
    var select =
        flag != "AI"
          ? "IF(MAX(SUBSTRING(member_id, 3)) > 0, MAX(cast(SUBSTRING(member_id, 3) as unsigned))+1, '1') member_id"
          : "IF(MAX(SUBSTRING(member_id, 4)) > 0, MAX(cast(SUBSTRING(member_id, 4) as unsigned))+1, '1') member_id",
      table_name = "md_member",
      whr =
        flag != "AI"
          ? `SUBSTRING(member_id, 1, 1) = '${flag}'`
          : `SUBSTRING(member_id, 1, 2) = '${flag}'`,
      order = null;
    var res_dt = await db_Select(select, table_name, whr, order);
    resolve(res_dt);
  });
};

const getMaxTrnId = () => {
  return new Promise(async (resolve, reject) => {
    var now_year = dateFormat(new Date(), "yyyy");
    var select =
        "IF(MAX(SUBSTRING(trn_id, -6)) > 0, LPAD(MAX(SUBSTRING(trn_id, -6))+1, 6, '0'), '000001') max_trn_id",
      table_name = "td_transactions",
      whr = `SUBSTRING(trn_id, 1, 4) = ${now_year}`,
      order = null;
    var res_dt = await db_Select(select, table_name, whr, order);
    resolve(res_dt);
  });
};

const getMaxSlNo = (form_no) => {
  return new Promise(async (resolve, reject) => {
    var select = "IF(COUNT(sl_no) > 0, MAX(sl_no)+1, 1) sl_no",
      table_name = "md_dependent",
      whr = `form_no = '${form_no}'`,
      order = null;
    var res_dt = await db_Select(select, table_name, whr, order);
    resolve(res_dt);
  });
};

const dynamicFileUpload = (filePath, fileName, file) => {
  return new Promise((resolve, reject) => {
    var res_dt,
      nowTime = new Date().getTime();
    if (file) {
      file.mv(filePath, async (err) => {
        if (err) {
          console.log(`${fileName} not uploaded`);
          res_dt = { suc: 0, msg: err };
        } else {
          res_dt = { suc: 1, msg: `${fileName} uploaded successfully.` };
        }
        resolve(res_dt);
      });
    } else {
      resolve({ suc: 0, msg: "No file found" });
    }
  });
};

module.exports = {
  associate_form_save: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxFormNo(data.flag);
      let form_no = `${data.flag}${year}${no.msg[0].max_form}`;
      console.log(form_no, "pppp");

      fields = `(form_no,form_dt,mem_type,memb_name,gurdian_name,gender,marital_status,dob,caste,memb_address,ps,city_town_dist,pin_no,phone_no,email_id,memb_status,created_by,created_at)`;
      values = `('${form_no}','${datetime}','${data.flag}','${data.member}','${data.gurdian}','${data.gen}','${data.marital_status}','${data.gen_dob}','${data.caste}','${data.mem}','${data.police_st}','${data.city}','${data.pin}','${data.phone}','${data.email_id}','P','${data.member}','${datetime}')`;
      table_name = "md_member";
      whr = null;
      order = null;
      var mem_dt = await db_Insert(table_name, fields, values, whr, order);
      mem_dt["form_no"] = form_no;
      mem_dt["mem_type"] = data.flag;
      mem_dt["form_no"] = form_no;

      // WHATSAPP MESSAGE //
      try {
        var select = "msg, domain",
          table_name = "md_whatsapp_msg",
          whr = `msg_for = 'Submit'`,
          order = null;
        var msg_dt = await db_Select(select, table_name, whr, order);
        var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
          domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
        wpMsg = wpMsg
          .replace("{user_name}", data.member)
          .replace("{form_id}", form_no)
          .replace(
            "{url}",
            `${domain}/#/home/associate_form_print/${encodeURIComponent(
              new Buffer.from(form_no).toString("base64")
            )}`
          );
        var wpRes = await sendWappMsg(data.phone, wpMsg);
      } catch (err) {
        console.log(err);
      }
      // END //

      // console.log(mem_dt, "gggg");
      resolve(mem_dt);
    });
  },

  spose_depend_form_save: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let sl_no = await getMaxSlNo(data.form_no);

      data["sl_no"] = sl_no.suc > 0 ? sl_no.msg[0].sl_no : 1;
      data["created_at"] = datetime;

      var db_field_value = await generateDBValue({ data, flag: 0 });

      var table_name = "md_dependent",
        fields = `(${db_field_value.fields})`,
        values = `(${db_field_value.values})`,
        whr = null,
        flag = 0;
      var res_dt = await db_Insert(table_name, fields, values, whr, flag);
      resolve(res_dt);
    });
  },

  saveDependForm: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      var res_dt;

      if (Array.isArray(data.di_data)) {
        if (data.di_data.length > 0) {
          for (let dt of data.di_data) {
            var sl_no = await getMaxSlNo(data.form_no);

            dt["sl_no"] = sl_no.suc > 0 ? sl_no.msg[0].sl_no : 1;
            dt["created_at"] = datetime;
            dt["mem_type"] = data.mem_type;
            dt["created_by"] = data.created_by;
            dt["form_no"] = data.form_no;

            var db_field_value = await generateDBValue({ data: dt, flag: 0 });

            var table_name = "md_dependent",
              fields = `(${db_field_value.fields})`,
              values = `(${db_field_value.values})`,
              whr = null,
              flag = 0;
            res_dt = await db_Insert(table_name, fields, values, whr, flag);
          }
        } else {
          res_dt = { suc: 0, msg: "No data found" };
        }
      } else {
        res_dt = { suc: 0, msg: "No data found" };
      }
      resolve(res_dt);
    });
  },

  saveFile: (ownFile, spuseFile, data) => {
    return new Promise(async (resolve, reject) => {
      var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
        res_dt;
      if (ownFile || spuseFile) {
        var dir = "assets";
        var subDir = `uploads/${data.form_no}`;
        if (!fs.existsSync(path.join(dir, subDir))) {
          fs.mkdirSync(path.join(dir, subDir));
        }

        if (ownFile) {
          var nowTime = new Date().getTime();
          var ownFile_name = data.form_no + "_" + nowTime + "_" + ownFile.name;
          var file_upload = await dynamicFileUpload(
            path.join("assets", `uploads/${data.form_no}`, ownFile_name),
            ownFile_name,
            ownFile
          );
          if (file_upload.suc > 0) {
            res_dt = await db_Insert(
              "md_member",
              `memb_pic = 'uploads/${data.form_no}/${ownFile_name}', modified_by = '${data.created_by}', modified_at = '${datetime}'`,
              null,
              `form_no = '${data.form_no}' AND mem_type = '${data.mem_type}'`,
              1
            );
          } else {
            res_dt = file_upload;
          }
        }

        if (spuseFile) {
          var nowTime = new Date().getTime();
          var spuseFile_name =
            data.form_no + "_" + nowTime + "_" + spuseFile.name;
          var file_upload = await dynamicFileUpload(
            path.join("assets", `uploads/${data.form_no}`, spuseFile_name),
            spuseFile_name,
            spuseFile
          );
          if (file_upload.suc > 0) {
            res_dt = await db_Insert(
              "md_dependent",
              `memb_pic = 'uploads/${data.form_no}/${spuseFile_name}', modified_by = '${data.created_by}', modified_at = '${datetime}'`,
              null,
              `form_no = '${data.form_no}' AND relation = '${data.relation}'`,
              1
            );
          } else {
            res_dt = file_upload;
          }
        }

        resolve(res_dt);
      } else {
        resolve({ suc: 0, msg: "No file found" });
      }
    });
  },

  accept_dt_cash: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxTrnId();
      let trn_id = `${year}${no.msg[0].max_trn_id}`;
      console.log(trn_id, "pppp");
      // var tot_amt =
      //   data.admissionFee_associate +
      //   data.donationFee_associate +
      //   data.subscriptionFee_associate +
      //   data.subscriptionFee_associate_one;

      var table_name = "td_transactions",
        fields = `(form_no,trn_dt,trn_id,sub_amt,onetime_amt,adm_fee,donation,premium_amt,tot_amt,pay_mode,receipt_no,created_by,created_at)`,
        values = `('${data.formNo}','${datetime}','${trn_id}','${data.subscriptionFee_associate}','${data.subscriptionFee_associate_one}','${data.admissionFee_associate}','${data.donationFee_associate}','0','${data.totalAmount_associate}','${data.payment}','${data.receipt_no}','${data.user}','${datetime}')`,
        where = null,
        flag = 0;
      var res_dt = await db_Insert(table_name, fields, values, where, flag);

      if (res_dt.suc > 0) {
        var table_name1 = "md_member",
          fields1 = `memb_status = '${data.status}',resolution_no ='${data.resolution_no}',resolution_dt = '${data.resolution_dt}',approve_by = '${data.user}',approve_at = '${datetime}',modified_by = '${data.user}',modified_at = '${datetime}'`,
          values1 = null,
          whr1 = `form_no = '${data.formNo}'`,
          flag1 = 1;
        var accept_dt = await db_Insert(
          table_name1,
          fields1,
          values1,
          whr1,
          flag1
        );

        // WHATSAPP MESSAGE //
        try {
          var select = "msg, domain",
            table_name = "md_whatsapp_msg",
            whr = `msg_for = 'Accept'`,
            order = null;
          var msg_dt = await db_Select(select, table_name, whr, order);
          var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
            domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
          wpMsg = wpMsg
            .replace("{user_name}", data.member)
            .replace("{form_no}", data.formNo)
            .replace("{status}", formStatus[data.status]);
          var wpRes = await sendWappMsg(data.phone_no, wpMsg);
        } catch (err) {
          console.log(err);
        }
        // END //

        resolve(accept_dt);
      }
    });
  },

  accept_dt_cheque: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxTrnId();
      let trn_id = `${year}${no.msg[0].max_trn_id}`;
      console.log(trn_id, "pppp");
      // var tot_amt =
      //   data.admissionFee_associate +
      //   data.donationFee_associate +
      //   data.subscriptionFee_associate +
      //   data.subscriptionFee_associate_one;

      var table_name = "td_transactions",
        fields = `(form_no,trn_dt,trn_id,sub_amt,onetime_amt,adm_fee,donation,premium_amt,tot_amt,pay_mode,chq_no,chq_dt,chq_bank,created_by,created_at)`,
        values = `('${data.formNo}','${datetime}','${trn_id}','${data.subscriptionFee_associate}','${data.subscriptionFee_associate_one}','${data.admissionFee_associate}','${data.donationFee_associate}','0','${data.totalAmount_associate}','${data.payment}','${data.cheque_no}','${data.cheque_dt}','${data.bank_name}','${data.user}','${datetime}')`,
        where = null,
        flag = 0;
      var res_dt = await db_Insert(table_name, fields, values, where, flag);

      if (res_dt.suc > 0) {
        var table_name1 = "md_member",
          fields1 = `memb_status = '${data.status}',resolution_no ='${data.resolution_no}',resolution_dt = '${data.resolution_dt}',approve_by = '${data.user}',approve_at = '${datetime}',modified_by = '${data.user}',modified_at = '${datetime}'`,
          values1 = null,
          whr1 = `form_no = '${data.formNo}'`,
          flag1 = 1;
        var accept_dt = await db_Insert(
          table_name1,
          fields1,
          values1,
          whr1,
          flag1
        );

        // WHATSAPP MESSAGE //
        try {
          var select = "msg, domain",
            table_name = "md_whatsapp_msg",
            whr = `msg_for = 'Accept'`,
            order = null;
          var msg_dt = await db_Select(select, table_name, whr, order);
          var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
            domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
          wpMsg = wpMsg
            .replace("{user_name}", data.member)
            .replace("{form_no}", data.formNo)
            .replace("{status}", formStatus[data.status]);
          var wpRes = await sendWappMsg(data.phone_no, wpMsg);
        } catch (err) {
          console.log(err);
        }
        // END //

        resolve(accept_dt);
      }
    });
  },
  approve_dt: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

      const no = await getMember(data.flag);
      let member_id = `${data.flag}-${no.msg[0].member_id}`;
      console.log(member_id);
      // pwd = `$2b$10$xkkGaJkZcSzuGhVyirp2zOQ3QWs9gtxfEJ/sGJbRAkYHyNKclin0.`;
      var pwd = await GenPassword();
      var pass = bcrypt.hashSync(pwd.toString(), 10);

      var select = "memb_name,phone_no,email_id",
        table_name = "md_member",
        whr = `form_no = '${data.formNo}'`,
        order = null;
      var res_dt = await db_Select(select, table_name, whr, order);

      var select = "trn_id",
        table_name = "td_transactions",
        whr = `form_no = '${data.formNo}'`,
        order = null;
      var trn_dt = await db_Select(select, table_name, whr, order);

      var table_name = "md_user",
        fields = `(user_id,user_type,password,user_name,user_email,user_phone,user_status,created_by,created_at)`,
        values = `('${member_id}','M','${pass}','${res_dt.msg[0].memb_name}','${res_dt.msg[0].email_id}','${res_dt.msg[0].phone_no}','A','${data.user}','${datetime}')`,
        whr = null,
        flag = 0;
      var res_dt = await db_Insert(table_name, fields, values, whr, flag);

      if (res_dt.suc > 0) {
        // var select = "subscription_1",
        //   table_name = "md_member_fees",
        //   whr = `memb_type = '${data.flag}'`,
        //   order = `ORDER BY effective_dt DESC LIMIT 1`;
        // var sub_mas_dt = await db_Select(select, table_name, whr, order);
        // var tot_sub_amt =
        //   sub_mas_dt.suc > 0 && sub_mas_dt.msg.length > 0
        //     ? sub_mas_dt.msg[0].subscription_1
        //     : 0;
        // var tot_tenure = tot_sub_amt > 0 ? data.sub_amt / tot_sub_amt : 0;
        var sub_upto = new Date(data.trn_dt);
        sub_upto.setFullYear(sub_upto.getFullYear() + 1);
        var table_name = "td_memb_subscription",
          fields = `(member_id,sub_dt,amount,subscription_upto,created_by,created_at)`,
          values = `('${member_id}','${data.trn_dt}','${
            data.tot_asso_amt
          }','${dateFormat(sub_upto, "yyyy-mm-dd HH:MM:ss")}','${
            data.user
          }','${datetime}')`;
        (whr = null), (flag = 0);
        var res_dt = await db_Insert(table_name, fields, values, whr, flag);

        var table_name = "md_member",
          fields = `memb_status = 'A', member_id = '${member_id}', mem_dt = '${datetime}',approve_by = '${data.user}',approve_at = '${datetime}',modified_by = '${data.user}',modified_at = '${datetime}'`,
          values = null,
          whr = `form_no = '${data.formNo}'`,
          flag = 1;
        var approve_dt = await db_Insert(table_name, fields, values, whr, flag);

        var table_name = "md_dependent",
          fields = `member_id = '${member_id}', modified_by = '${data.user}',modified_at = '${datetime}'`,
          values = null,
          whr = `form_no = '${data.formNo}'`,
          flag = 1;
        var depend_dt = await db_Insert(table_name, fields, values, whr, flag);

        var table_name = "td_transactions",
          fields = `approval_status = 'A', approved_by = '${data.user}',approved_dt = '${datetime}'`,
          values = null,
          whr = `form_no = '${data.formNo}'`,
          flag = 1;
        var approval_dt = await db_Insert(
          table_name,
          fields,
          values,
          whr,
          flag
        );
        approval_dt["trn_id"] = trn_dt.suc > 0 ? trn_dt.msg[0].trn_id : 0;
        approval_dt["mem_id"] = member_id;

        // WHATSAPP MESSAGE //
        try {
          var select = "msg, domain",
            table_name = "md_whatsapp_msg",
            whr = `msg_for = 'Approve'`,
            order = null;
          var msg_dt = await db_Select(select, table_name, whr, order);
          var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
            domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
          wpMsg = wpMsg
            .replace("{user_name}", data.member)
            .replace("{form_no}", data.formNo)
            .replace("{url}", `${domain}/#/auth/member_login`)
            .replace("{user_id}", member_id)
            .replace("{password}", pwd);
          var wpRes = await sendWappMsg(data.phone_no, wpMsg);
        } catch (err) {
          console.log(err);
        }
        // END //

        resolve(approval_dt);
      }
    });
  },
};
