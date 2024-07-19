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
  getCurrFinYear,
  drVoucher,
  FIN_YEAR_MASTER,
  BRANCH_MASTER,
  TRANSFER_TYPE_MASTER,
  VOUCHER_MODE_MASTER,
  CR_ACC_MASTER,
} = require("./MasterModule");
const { sendWappMsg, sendWappMediaMsg } = require("./whatsappModule");

const getMaxFormNo = (flag) => {
  return new Promise(async (resolve, reject) => {
    // var select =
    //     "IF(MAX(SUBSTRING(form_no, -6)) > 0, LPAD(MAX(SUBSTRING(form_no, -6))+1, 6, '0'), '000001') max_form",
    var select =
        flag != "AI"
          ? "IF(MAX(cast(SUBSTRING(form_no, -6) as unsigned)) > 0, LPAD(MAX(cast(SUBSTRING(form_no, -6) as unsigned))+1, 6, '0'), '000001') max_form"
          : "IF(MAX(cast(SUBSTRING(form_no, -7) as unsigned)) > 0, LPAD(MAX(cast(SUBSTRING(form_no, -7) as unsigned))+1, 6, '0'), '000001') max_form",
      table_name = "md_member",
      // whr = `SUBSTRING(form_no, 1, 1) = '${flag}'`,
      whr =
        flag != "AI"
          ? `SUBSTRING(form_no, 1, 1) = '${flag}'`
          : `SUBSTRING(form_no, 1, 2) = '${flag}'`,
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

// const getMember = (flag) => {
//   return new Promise(async (resolve, reject) => {
//     var select =
//         "IF(MAX(SUBSTRING(member_id, 3)) > 0, MAX(SUBSTRING(member_id, 3))+1, '1') member_id",
//       table_name = "md_member",
//       whr = `SUBSTRING(member_id, 1, 1) = '${flag}'`,
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
    var select =
        "IF(MAX(SUBSTRING(trn_id, -6)) > 0, LPAD(MAX(SUBSTRING(trn_id, -6))+1, 6, '0'), '000001') max_trn_id",
      table_name = "td_transactions",
      whr = `SUBSTRING(trn_id, 1, 1)`,
      order = null;
    var res_dt = await db_Select(select, table_name, whr, order);
    resolve(res_dt);
  });
};

module.exports = {
  life_form_save: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxFormNo(data.flag);
      let form_no = `${data.flag}${year}${no.msg[0].max_form}`;
      console.log(form_no, "pppp");

      fields = `(form_no,form_dt,mem_type,memb_oprn,memb_name,unit_id,gurdian_name,gender,marital_status,dob,blood_grp,caste,staff_nos,pers_no,min_no,memb_address,ps,city_town_dist,pin_no,phone_no,email_id,memb_status,created_by,created_at)`;
      values = `('${form_no}','${data.form_dt}','${data.flag}','${data.member_opt}','${data.member}','${data.unit_nm}','${data.gurdian}','${data.gen}','${data.marital_status}','${data.gen_dob}','${data.blood}','${data.caste}','${data.staff}','${data.personal}','${data.min}','${data.mem}','${data.police_st}','${data.city}','${data.pin}','${data.phone}','${data.email_id}','P','${data.member}','${datetime}')`;
      table_name = "md_member";
      whr = null;
      order = null;
      var mem_dt = await db_Insert(table_name, fields, values, whr, order);
      mem_dt["form_no"] = form_no;
      mem_dt["mem_type"] = data.flag;
      // console.log(mem_dt, "gggg");

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
            `${domain}/#/home/life_form_print/${encodeURIComponent(
              new Buffer.from(form_no).toString("base64")
            )}`
          );
        var wpRes = await sendWappMsg(data.phone, wpMsg);
      } catch (err) {
        console.log(err);
      }
      // END //

      resolve(mem_dt);
    });
  },

  spose_depend_form: (data) => {
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

  saveDepForm: (data) => {
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
      let trn_id =
        data.trn_id > 0 ? data.trn_id : `${year}${no.msg[0].max_trn_id}`;
      console.log(trn_id, "pppp");
      // var tot_amt =
      //   data.admissionFee_life +
      //   data.donationFee_life +
      //   data.subscriptionFee_2 +
      //   data.subscriptionFee_1;

      var table_name = "td_transactions",
        fields =
          data.trn_id > 0
            ? `trn_dt = '${data.form_dt}', sub_amt = '${
                data.subscriptionFee_1
              }',onetime_amt = '${data.subscriptionFee_2}',adm_fee = '${
                data.admissionFee_life
              }',donation = '${data.donationFee_life}',tot_amt = '${
                data.totalAmount_life
              }',receipt_no = '${
                data.receipt_no
              }',chq_no = null, chq_dt = null, chq_bank = ${
                data.payment == "C" ? "73" : "75"
              } , modified_by = '${data.user}',modified_at = '${datetime}'`
            : `(form_no,trn_dt,trn_id,sub_amt,onetime_amt,adm_fee,donation,premium_amt,tot_amt,pay_mode,receipt_no,chq_no,chq_dt,chq_bank,created_by,created_at)`,
        values = `('${data.formNo}','${data.form_dt}','${trn_id}','${
          data.subscriptionFee_1
        }','${data.subscriptionFee_2}','${data.admissionFee_life}','${
          data.donationFee_life
        }','0','${data.totalAmount_life}','${data.payment}','${
          data.receipt_no
        }','0','0',${data.payment == "C" ? "73" : "75"},'${
          data.user
        }','${datetime}')`,
        where = data.trn_id > 0 ? `trn_id = ${data.trn_id}` : null,
        flag = data.trn_id > 0 ? 1 : 0;
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
        res_dt["trn_id"] = trn_id;

        // WHATSAPP MESSAGE //
        try {
          if (data.pay_mode == "C") {
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
          } else {
            var select = "msg, domain",
              table_name = "md_whatsapp_msg",
              whr = `msg_for = 'Member accept online'`,
              order = null;
            var msg_dt = await db_Select(select, table_name, whr, order);
            var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
              domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
            wpMsg = wpMsg
              .replace("{user_name}", data.member)
              .replace("{form_no}", data.form_no);
            var wpRes = await sendWappMediaMsg(
              data.phone_no,
              wpMsg,
              domain,
              "BOKAROWELFARE.jpg"
            );
          }
        } catch (err) {
          console.log(err);
        }
        // END //

        resolve(res_dt);
      }
    });
  },

  accept_dt_cheque: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxTrnId();
      let trn_id =
        data.trn_id > 0 ? data.trn_id : `${year}${no.msg[0].max_trn_id}`;
      console.log(trn_id, "pppp");
      var tot_amt =
        data.admissionFee_life +
        data.donationFee_life +
        data.subscriptionFee_2 +
        data.subscriptionFee_1;

      var table_name = "td_transactions",
        fields =
          data.trn_id > 0
            ? `trn_dt = '${data.form_dt}', sub_amt = '${data.subscriptionFee_1}',onetime_amt = '${data.subscriptionFee_2}',adm_fee = '${data.admissionFee}',donation = '${data.donationFee}',tot_amt = '${data.totalAmount_life}', pay_mode = '${data.payment}',chq_no = '${data.cheque_no}',chq_dt = '${data.cheque_dt}',chq_bank = '${data.bank_name}',modified_by = '${data.user}',modified_at = '${datetime}'`
            : `(form_no,trn_dt,trn_id,sub_amt,onetime_amt,adm_fee,donation,premium_amt,tot_amt,pay_mode,chq_no,chq_dt,chq_bank,created_by,created_at)`,
        values = `('${data.formNo}','${data.form_dt}','${trn_id}','${data.subscriptionFee_1}','${data.subscriptionFee_2}','${data.admissionFee}','${data.donationFee}','0','${data.totalAmount_life}','${data.payment}','${data.cheque_no}','${data.cheque_dt}','${data.bank_name}','${data.user}','${datetime}')`,
        where = data.trn_id > 0 ? `trn_id = ${data.trn_id}` : null,
        flag = data.trn_id > 0 ? 1 : 0;
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
        res_dt["trn_id"] = trn_id;

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

        resolve(res_dt);
      }
    });
  },

  approve_dt: (data) => {
    console.log("From Life");
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

      const no = await getMember(data.flag);
      let member_id = `${data.flag}-${no.msg[0].member_id}`;
      console.log(member_id);
      console.log("jlksdlakjsdlkjsdlkl");
      console.log(data.chq_dt, "date");
      // pwd = `$2b$10$xkkGaJkZcSzuGhVyirp2zOQ3QWs9gtxfEJ/sGJbRAkYHyNKclin0.`;
      var pwd = await GenPassword();
      var pass = bcrypt.hashSync(pwd.toString(), 10);

      var finres = await getCurrFinYear();
      var curr_fin_year = finres.curr_fin_year;
      var voucher_res = await drVoucher(
        FIN_YEAR_MASTER[curr_fin_year],
        curr_fin_year,
        2,
        BRANCH_MASTER[2],
        data.trn_id,
        dateFormat(new Date(data.trn_dt), "yyyy-mm-dd"),
        TRANSFER_TYPE_MASTER[data.pay_mode],
        VOUCHER_MODE_MASTER[data.pay_mode],
        data.acc_code,
        CR_ACC_MASTER[data.memb_type],
        "DR",
        data.admission_acc_id,
        data.donation_acc_id,
        data.memb_type,
        data.memb_type != "G" ? data.onetime_amt : data.donation_amt,
        data.admission_amt,
        data.tot_amt,
        data.memb_type != "L"
          ? data.memb_type == "G"
            ? data.sub_amt
            : data.memb_type == "AI"
            ? data.onetime_amt
            : 0
          : data.tot_amt,
        data.chq_no,
        data.chq_dt && new Date(data.chq_dt) != "Invalid Date"
          ? dateFormat(new Date(data.chq_dt), "yyyy-mm-dd")
          : "",
        `Amount deposited for opening of member for member no ${member_id}`,
        // REMARKS_MASTER[member_id],
        "A",
        data.user,
        datetime,
        data.user,
        datetime
      );

      if (voucher_res.suc > 0) {
        if (voucher_res.msg > 0) {
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
            // var select = "a.subscription_1,a.subscription_2",
            //   table_name = "md_member_fees a",
            //   whr = `a.memb_type = '${data.flag}' AND a.effective_dt = (SELECT MAX(b.effective_dt) FROM md_member_fees b WHERE a.memb_type=b.memb_type AND b.effective_dt <= NOW())`,
            //   order = null;
            // var sub_mas_dt = await db_Select(select, table_name, whr, order);
            // var tot_sub_amt =
            //   sub_mas_dt.suc > 0 && sub_mas_dt.msg.length > 0
            //     ? sub_mas_dt.msg[0].subscription_1
            //     : 0;
            // var tot_sub_amt_2 =
            //   sub_mas_dt.suc > 0 && sub_mas_dt.msg.length > 0
            //     ? sub_mas_dt.msg[0].subscription_2
            //     : 0;
            // var tot_tenure = tot_sub_amt > 0 ? data.tot_amt / tot_sub_amt : 0;
            var sub_upto = new Date(data.trn_dt);
            sub_upto.setFullYear(sub_upto.getFullYear() - 1);
            console.log(sub_upto, "oooo");
            var table_name = "td_memb_subscription",
              fields = `(member_id,sub_dt,amount,subscription_upto, calc_amt, calc_upto, trans_id,created_by,created_at)`,
              values = `('${member_id}','${data.trn_dt}','${
                data.tot_amt
              }','${dateFormat(
                sub_upto,
                "yyyy-mm-dd HH:MM:ss"
              )}', 0, '${dateFormat(sub_upto, "yyyy-mm-dd HH:MM:ss")}', '${
                data.trn_id
              }','${data.user}','${datetime}')`;
            (whr = null), (flag = 0);
            var res_dt = await db_Insert(table_name, fields, values, whr, flag);

            var table_name = "md_member",
              fields = `memb_status = 'A', member_id = '${member_id}', mem_dt = '${datetime}',approve_by = '${data.user}',approve_at = '${datetime}',modified_by = '${data.user}',modified_at = '${datetime}'`,
              values = null,
              whr = `form_no = '${data.formNo}'`,
              flag = 1;
            var approve_dt = await db_Insert(
              table_name,
              fields,
              values,
              whr,
              flag
            );

            var table_name = "md_dependent",
              fields = `member_id = '${member_id}', modified_by = '${data.user}',modified_at = '${datetime}'`,
              values = null,
              whr = `form_no = '${data.formNo}'`,
              flag = 1;
            var depend_dt = await db_Insert(
              table_name,
              fields,
              values,
              whr,
              flag
            );

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
          } else {
            res.send({ suc: 0, msg: "Voucher Not Saved" });
          }
        } else {
          res.send(voucher_res);
        }
      }
    });
  },
};
