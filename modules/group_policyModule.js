var dateFormat = require("dateformat"),
  path = require("path"),
  fs = require("fs");
const {
  db_Select,
  db_Insert,
  formStatus,
  drVoucher_gmp,
  getCurrFinYear,
  FIN_YEAR_MASTER,
  BRANCH_MASTER,
  TRANSFER_TYPE_MASTER,
  VOUCHER_MODE_MASTER,
  shortenURL,
} = require("./MasterModule");
const { sendWappMsg, sendWappMediaMsg } = require("./whatsappModule");
const { dynamicFileUpload } = require("./associate_formModule");

const getMaxFormNo = (flag) => {
  return new Promise(async (resolve, reject) => {
    var select =
        "IF(MAX(SUBSTRING(form_no, -6)) > 0, LPAD(MAX(SUBSTRING(form_no, -6))+1, 6, '0'), '000001') max_form",
      table_name = "td_gen_ins",
      whr = `SUBSTRING(form_no, 1, ${flag.length}) = '${flag}'`,
      order = null;
    var res_dt = await db_Select(select, table_name, whr, order);
    resolve(res_dt);
  });
};

const getMaxSlNo = (form_no) => {
  return new Promise(async (resolve, reject) => {
    var select = "IF(COUNT(sl_no) > 0, MAX(sl_no)+1, 1) sl_no",
      table_name = "td_gen_ins_depend",
      whr = `form_no = '${form_no}'`,
      order = null;
    var res_dt = await db_Select(select, table_name, whr, order);
    // console.log(res_dt, "sl_no");
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

const savegenFiles= (file, fileType, form_no) => {
  return new Promise(async (resolve, reject) => {
    var filePath = '';
    if (file) {
      var dir = "assets";
      var subDir = `uploads/${form_no}`;
      if (!fs.existsSync(path.join(dir, subDir))) {
        fs.mkdirSync(path.join(dir, subDir));
      }

      if (file) {
        var nowTime = new Date().getTime();
        var fileName = form_no + "_" + fileType + "_" + nowTime + "_" + file.name;
        var file_upload = await dynamicFileUpload(
          path.join("assets", `uploads/${form_no}`, fileName),
          fileName,
          file
        );
        filePath = file_upload.suc > 0 ? `${form_no}/${fileName}` : '';
      }

      resolve({suc: 1, msg: filePath});
    } else {
      resolve({ suc: 0, msg: "No file found" });
    }
  });
}

module.exports = {
 
  group_policy_form_save: (data, ownDocFile, ownAadFile, depDocFile, depAadFile) => {
    // console.log(data,'gdata');
    return new Promise(async (resolve, reject) => {
      var depDocFileName = [];
      var depAddFileName = [];

      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy"), ownDocFilePath = '', ownAddFilePath = '', depDocFilePath = '', depAddFilePath = '' ;;

      const no = await getMaxFormNo(data.flag);
      let form_no = `${data.flag}${year}${no.msg[0].max_form}`;
      // console.log(form_no, "pppp");

      let sl_no = await getMaxSlNo(form_no);
      sl_no = sl_no.suc > 0 ? sl_no.msg[0].sl_no : 1;
      // console.log(sl_no,'sl');

      const tr_id = await getMaxTrnId();
      let trn_id =
        data.trn_id > 0 ? data.trn_id : `${year}${tr_id.msg[0].max_trn_id}`;
      // console.log(trn_id, "pppp");

      var tot_amt = Number(data.pre_amont) + Number(data.sup_top_up);
      // console.log(tot_amt,'amt');

      if(ownDocFile){
        var fileRes = await savegenFiles(ownDocFile, 'OWN', form_no)
        ownDocFilePath = fileRes.suc > 0 ? fileRes.msg : ''
      }

      if(ownAadFile){
        var fileRes = await savegenFiles(ownAadFile, 'OWN_AADH', form_no)
        ownAddFilePath = fileRes.suc > 0 ? fileRes.msg : ''
      }

      if(depDocFile){
        if(Array.isArray(depAadFile)){
          for(let dt of depAadFile){
            var fileRes = await savegenFiles(dt, 'DEP', form_no)
            depDocFilePath = fileRes.suc > 0 ? fileRes.msg : ''
            depDocFileName.push({fileName: depDocFilePath})
          }
        }else{
          var fileRes = await savegenFiles(depDocFile, 'DEP', form_no)
          depDocFilePath = fileRes.suc > 0 ? fileRes.msg : ''
          depDocFileName.push({fileName: depDocFilePath})
        }
      }

      if (depAadFile) {
    if (Array.isArray(depDocFile)) {
        for (let dt of depDocFile) {
            var fileRes = await savegenFiles(dt, 'DEP_AADH', form_no);
            depAddFilePath = fileRes.suc > 0 ? fileRes.msg : '';
            depAddFileName.push({fileName: depAddFilePath});
        }
    } else {
        var fileRes = await savegenFiles(depDocFile, 'DEP_AADH', form_no);
        depAddFilePath = fileRes.suc > 0 ? fileRes.msg : '';
        depAddFileName.push({fileName: depAddFilePath});
    }
}
      // if(depAadFile){
      //   var fileRes = await savegenFiles(depAadFile, 'DEP_AADH', form_no)
      //   depAddFilePath = fileRes.suc > 0 ? fileRes.msg : ''
      // }

      fields = `(form_no,premium_dt,premium_id,premium_amt ${
        data.sup_top_flag == "p2"
          ? `,premium_amt2,prm_flag2`
          : data.sup_top_flag == "p3"
          ? ",premium_amt3,prm_flag3"
          : ""
      },created_by,created_at)`;
      values = `('${form_no}','${datetime}','${data.grp_name}','${data.pre_amont}' ${
        data.sup_top_flag == "p2" || data.sup_top_flag == "p3"
          ? `,${data.sup_top_up},'Y'`
          : ""
      },'${data.member}','${datetime}')`;
      table_name = "td_premium_dtls";
      whr = null;
      order = null;
      var policy_data = await db_Insert(table_name, fields, values, whr, order);

      // if (data.checkedmember) {
        fields = `(form_no,form_dt,policy_holder_type,member_id,association,memb_type,memb_oprn,memb_name,phone,father_husband_name, sex, marital_status, dob ${ownDocFilePath != '' ? ', memb_img' : ''} ${ownAddFilePath != '' ? ', doc_img' : ''}, form_type,form_status,disease_flag,disease_type,created_by,created_at)`;
        values = `('${form_no}','${data.form_dt}','${data.checkedmember == 'false' ? "N" : "M"}','${data.member_id}','${data.unit}','${data.member_type}','${data.memb_oprn}','${data.member}','${data.phone}','${data.gurdian}','${data.gen}','${data.marital_status}','${data.gen_dob}' ${ownDocFilePath != '' ? `, '${ownDocFilePath}'` : ''} ${ownAddFilePath != '' ? `, '${ownAddFilePath}'` : ''},'GP','P',${data.type_diseases ? `'${data.type_diseases}'` : `'N'`},'${data.name_diseases}','${data.member}','${datetime}')`;
        table_name = "td_gen_ins";
        whr = null;
        order = null;
      // } else {
      //   fields = `(form_no,form_dt, policy_holder_type,member_id,association,memb_type, memb_oprn, memb_name,phone,father_husband_name, sex, marital_status, dob ${ownDocFilePath != '' ? ', memb_img' : ''} ${ownAddFilePath != '' ? ', doc_img' : ''}, form_type,form_status,disease_flag,disease_type,created_by,created_at)`;
      //   values = `('${form_no}','${data.form_dt}','N','${data.member_id}','${data.unit}','${data.member_type}','${data.memb_oprn}','${data.member}','${data.phone}','${data.gurdian}','${data.gen}','${data.marital_status}','${data.gen_dob}' ${ownDocFilePath != '' ? `, '${ownDocFilePath}'` : ''} ${ownAddFilePath != '' ? `, '${ownAddFilePath}'` : ''},'GP','p','${data.type_diseases}','${data.name_diseases}','${data.member}','${datetime}')`;
      //   table_name = "td_gen_ins";
      //   whr = null;
      //   order = null;
      // }
      var policy_dt = await db_Insert(table_name, fields, values, whr, order);

      if (policy_dt.suc > 0) {
        // if (data.checkedmember) {
          var i = 0
          for (let dt of JSON.parse(data.dependent_dt)) {
            fields = `(form_no,sl_no,member_id,dept_name,relation,disease_flag,disease_type,dob ${depDocFilePath != '' ? ', dep_img' : ''} ${depAddFilePath != '' ? ', dep_doc' : ''},created_by,created_at)`;
            values = `('${form_no}','${dt.sl_no}','${data.member_id}','${dt.dependent_name}','${dt.relation}','${dt.type_diseases}','${dt.name_diseases}','${dt.dob}' ${depDocFileName.length > i && depDocFileName[i].fileName ? `, '${depDocFileName[i].fileName}'` : ''} ${depAddFileName.length > i && depAddFileName[i].fileName ? `, '${depAddFileName[i].fileName}'` : ''},'${data.member}','${datetime}')`;
            table_name = "td_gen_ins_depend";
            whr = null;
            order = null;
            var policy_dependent_dt = await db_Insert(
              table_name,
              fields,
              values,
              whr,
              order
            );
            policy_dt["form_no"] = form_no;
            policy_dt["policy_holder_type"] = `${data.checkedmember}`

            i++
          }
          var table_name = "td_transactions",
          fields =`(form_no,trn_dt,trn_id,sub_amt,onetime_amt,adm_fee,donation,premium_amt,tot_amt,created_by,created_at)`,
          values = `('${form_no}','${datetime}','${trn_id}','0','0','0','0','${tot_amt}','${
            tot_amt
          }','${data.user}','${datetime}')`,
          where = null,
          flag = 0;
        var res_dt = await db_Insert(table_name, fields, values, where, flag);
        // } else {
        //   for (let dt of data.dependent_dt) {
        //     fields = `(form_no,sl_no,member_id,dept_name,relation,disease_flag,disease_type,dob ${depDocFilePath != '' ? ', dep_img' : ''} ${depAddFilePath != '' ? ', dep_doc' : ''},created_by,created_at)`;
        //     values = `('${form_no}','${dt.sl_no}','${data.member_id}','${dt.dependent_name}','${dt.relation}','${dt.type_diseases}','${dt.name_diseases}','${dt.dob}' ${depDocFilePath != '' ? `, '${depDocFilePath}'` : ''} ${depAddFilePath != '' ? `, '${depAddFilePath}'` : ''},'${data.member}','${datetime}')`;
        //     table_name = "td_gen_ins_depend";
        //     whr = null;
        //     order = null;
        //     var policy_dependent_dt = await db_Insert(
        //       table_name,
        //       fields,
        //       values,
        //       whr,
        //       order
        //     );
        //     policy_dependent_dt["form_no"] = form_no;
        //   }
        // }
      }
        // policy_dependent_dt["form_no"] = form_no;
      // console.log(policy_dependent_dt, "gggg");

      // if(policy_dependent_dt && policy_dependent_dt.suc > 0){
       
      // }

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
            `${domain}/#/home/print_group_policy/${encodeURIComponent(
              new Buffer.from(form_no).toString("base64")
            )}`
          );
        var wpRes = await sendWappMsg(data.phone, wpMsg);
      } catch (err) {
        console.log(err);
      }
      // END //

      resolve(policy_dt);
    });
  },

  group_policy_form_save_child: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxFormNo();
      let form_no = `C${year}${no.msg[0].max_form}`;
      // console.log(form_no, "pppp");

      let sl_no = await getMaxSlNo(data.form_no);
      sl_no = sl_no.suc > 0 ? sl_no.msg[0].sl_no : 1;

      fields = `(form_no,form_dt,member_id,form_type,form_status,disease_flag,disease_type,created_by,created_at)`;
      values = `('${form_no}','${datetime}','${data.member_id}','C','P','${data.type_diseases}','${data.name_diseases}','${data.member}','${datetime}')`;
      table_name = "td_gen_ins";
      whr = null;
      order = null;
      var policy_dt = await db_Insert(table_name, fields, values, whr, order);
      policy_dt["form_no"] = form_no;

      if (policy_dt.suc > 0) {
        for (let dt of data.dependent_dt) {
          fields = `(form_no,sl_no,member_id,disease_flag,disease_type,dob,created_by,created_at)`;
          values = `('${form_no}','${dt.sl_no}','${data.member_id}','${dt.type_diseases}','${dt.name_diseases}','${dt.dob}','${data.member}','${datetime}')`;
          table_name = "td_gen_ins_depend";
          whr = null;
          order = null;
          var policy_dependent_dt = await db_Insert(
            table_name,
            fields,
            values,
            whr,
            order
          );
        }
      }
      //   policy_dependent_dt["form_no"] = form_no;
      // console.log(policy_dependent_dt, "gggg");
      resolve(policy_dependent_dt);
    });
  },

  reject_dt_group: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      var fields = `form_status = '${data.status}',resolution_no ='${data.resolution_no}',resolution_dt = '${data.resolution_dt}',remarks = '${data.reject}',rejected_by = '${data.user}',rejected_dt = '${datetime}',modified_by = '${data.user}',modified_at = '${datetime}'`,
        table_name = "td_gen_ins",
        values = null,
        whr = `form_no = '${data.formNo}'`,
        flag = 1;
      var mem_dt = await db_Insert(table_name, fields, values, whr, flag);

      // WHATSAPP MESSAGE //
      try {
        var select = "msg, domain",
          table_name = "md_whatsapp_msg",
          whr = `msg_for = 'Reject'`,
          order = null;
        var msg_dt = await db_Select(select, table_name, whr, order);
        var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
          domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
        wpMsg = wpMsg
          .replace("{user_name}", data.member)
          .replace("{form_no}", data.formNo)
          .replace("{status}", formStatus[data.status])
          .replace("{remarks}", data.reject);
        var wpRes = await sendWappMsg(data.phone_no, wpMsg);
      } catch (err) {
        console.log(err);
      }
      // END //

      resolve(mem_dt);
    });
  },

  accept_dt_cash: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxTrnId();
      let trn_id = `${year}${no.msg[0].max_trn_id}`;
      // console.log(trn_id, "pppp");

      // var table_name = "td_gen_ins",
      //   fields = `(ins_period,created_by,created_at)`,
      //   values = `('${data.ins_period}','${data.user}','${datetime}')`,
      //   where = null,
      //   flag = 0;
      // var res_dt = await db_Insert(table_name, fields, values, where, flag);

      // var table_name = "td_premium_dtls",
      //   fields = `(form_no,premium_dt,premium_amt,order_id,trn_dt,created_by,created_at)`,
      //   values = `('${data.formNo}','${data.pre_dt}','${data.pre_amt}','0','${datetime}','${data.user}','${datetime}')`,
      //   where = null,
      //   flag = 0;
      // var res_dt = await db_Insert(table_name, fields, values, where, flag);

      var table_name = "td_transactions",
        fields = `(form_no,trn_dt,trn_id,premium_amt,tot_amt,pay_mode,created_by,created_at)`,
        values = `('${data.formNo}','${datetime}','${trn_id}','${data.pre_amt}','${data.pre_amt}','${data.payment}','${data.user}','${datetime}')`,
        where = null,
        flag = 0;
      var res_dt = await db_Insert(table_name, fields, values, where, flag);

      if (res_dt.suc > 0) {
        var table_name1 = "td_gen_ins",
          fields1 = `ins_period = 'Y',form_status = 'T',resolution_no ='${data.resolution_no}',resolution_dt = '${data.resolution_dt}',modified_by = '${data.user}',modified_at = '${datetime}'`,
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

        // var fields = `premium_dt = '${data.pre_dt}',modified_by = '${data.user}',modified_at = '${datetime}'`,
        //   table_name = "td_premium_dtls",
        //   values = null,
        //   whr = `form_no = '${data.formNo}'`,
        //   flag = 1;
        // var mem_dt = await db_Insert(table_name, fields, values, whr, flag);
      }

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
          .replace("{status}", formStatus[data.status])
          .replace("{remarks}", data.reject);
        var wpRes = await sendWappMsg(data.phone_no, wpMsg);
      } catch (err) {
        console.log(err);
      }
      // END //

      resolve(accept_dt);
    });
  },

  accept_dt_cheque: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxTrnId();
      let trn_id = `${year}${no.msg[0].max_trn_id}`;
      // console.log(trn_id, "pppp");

      // var table_name = "td_premium_dtls",
      //   fields = `(form_no,premium_dt,premium_amt,order_id,trn_dt,created_by,created_at)`,
      //   values = `('${data.formNo}','${data.pre_dt}','${data.pre_amt}','0','${datetime}','${data.user}','${datetime}')`,
      //   where = null,
      //   flag = 0;
      // var res_dt = await db_Insert(table_name, fields, values, where, flag);

      var table_name = "td_transactions",
        fields = `(form_no,trn_dt,trn_id,premium_amt,tot_amt,pay_mode,chq_no,chq_dt,chq_bank,created_by,created_at)`,
        values = `('${data.formNo}','${datetime}','${trn_id}','${data.pre_amt}','${data.pre_amt}','${data.payment}','${data.cheque_no}','${data.cheque_dt}','${data.bank_name}','${data.user}','${datetime}')`,
        where = null,
        flag = 0;
      var res_dt = await db_Insert(table_name, fields, values, where, flag);

      if (res_dt.suc > 0) {
        var table_name1 = "td_gen_ins",
          fields1 = `ins_period = 'Y',form_status = 'T',resolution_no ='${data.resolution_no}',resolution_dt = '${data.resolution_dt}',approve_by = '${data.user}',approve_at = '${datetime}',modified_by = '${data.user}',modified_at = '${datetime}'`,
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

        // var fields = `premium_dt = '${data.pre_dt}',modified_by = '${data.user}',modified_at = '${datetime}'`,
        //   table_name = "td_premium_dtls",
        //   values = null,
        //   whr = `form_no = '${data.formNo}'`,
        //   flag = 1;
        // var mem_dt = await db_Insert(table_name, fields, values, whr, flag);
      }
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
          .replace("{status}", formStatus[data.status])
          .replace("{remarks}", data.reject);
        var wpRes = await sendWappMsg(data.phone_no, wpMsg);
      } catch (err) {
        console.log(err);
      }
      // END //

      resolve(accept_dt);
    });
  },

  save_gmp_data: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxTrnId();
      let trn_id = `${year}${no.msg[0].max_trn_id}`;
      // console.log(trn_id, "pppp");

      // var table_name = "td_premium_dtls",
      //   fields = `(form_no,premium_dt,premium_id,premium_amt,created_by,created_at)`,
      //   values = `('${data.formNo}','${data.pre_dt}','0','${data.pre_amt}','${data.user}','${datetime}')`,
      //   where = null,
      //   flag = 0;
      // var res_dt = await db_Insert(table_name, fields, values, where, flag);

      if(data.payment != 'O'){
        var table_name = "td_transactions",
          fields =
            data.trn_id > 0
              ? `trn_dt = '${data.form_dt}',premium_amt = '${data.pre_amt}', tot_amt = '${data.pre_amt}', pay_mode = '${data.payment}',receipt_no = '${data.receipt_no}',chq_no = '${data.cheque_no}',chq_dt = '${data.cheque_dt}',chq_bank = '${data.bank_name}',modified_by = '${data.user}',modified_at = '${datetime}'`
              : `(form_no,trn_dt,trn_id,premium_amt,tot_amt,pay_mode,receipt_no,chq_no,chq_dt,chq_bank,approval_status,created_by,created_at)`,
          values = `('${data.formNo}','${data.form_dt}','${trn_id}','${data.pre_amt}','${data.pre_amt}','${data.payment}','${data.receipt_no}','${data.cheque_no}','${data.cheque_dt}','${data.bank_name}','U','${data.user}','${datetime}')`,
          where = data.trn_id > 0 ? `trn_id = ${data.trn_id}` : null,
          flag = data.trn_id > 0 ? 1 : 0;
        var trn_data = await db_Insert(table_name, fields, values, where, flag);
  
        if (trn_data.suc > 0) {
          var table_name1 = "td_gen_ins",
            fields1 = `ins_period = 'Y',form_status = '${data.status}',resolution_no ='${data.resolution_no}',resolution_dt = '${data.resolution_dt}',modified_by = '${data.user}',modified_at = '${datetime}'`,
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
          trn_data["trn_id"] = trn_id;
        }
  
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
              .replace("{status}", formStatus[data.status])
              .replace("{remarks}", data.reject);
            var wpRes = await sendWappMsg(data.phone_no, wpMsg);
          } else {
            var select = "msg, domain",
              table_name = "md_whatsapp_msg",
              whr = `msg_for = 'Member Premium accept online'`,
              order = null;
            var msg_dt = await db_Select(select, table_name, whr, order);
            var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
              domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
            wpMsg = wpMsg
              .replace("{user_name}", data.member)
              .replace("{form_no}", data.form_no);
            // var wpRes = await sendWappMediaMsg(
            //   data.phone_no,
            //   wpMsg,
            //   domain,
            //   "BOKAROWELFARE.jpg"
            // );
          }
        } catch (err) {
          console.log(err);
        }
        // END //
  
        resolve(trn_data);
      }else{
        var table_name1 = "td_gen_ins",
          fields1 = `ins_period = 'Y',form_status = '${data.status}',resolution_no ='${data.resolution_no}',resolution_dt = '${data.resolution_dt}',modified_by = '${data.user}',modified_at = '${datetime}'`,
          values1 = null,
          whr1 = `form_no = '${data.formNo}'`,
          flag1 = 1;
        var trn_data = await db_Insert(
          table_name1,
          fields1,
          values1,
          whr1,
          flag1
        );
        trn_data["trn_id"] = trn_id;
        try {
          if (data.payment == "O") {
            const encDtgen = encodeURIComponent(data.payEncDataGen);
            console.log(encDtgen,'uuu');

            var select = "msg, domain",
              table_name = "md_whatsapp_msg",
              whr = `msg_for = 'Member accept online'`,
              order = null;
            var msg_dt = await db_Select(select, table_name, whr, order);
            var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
              domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";

            const longUrl = `${process.env.CLIENT_URL}/auth/payment_preview_page?enc_dt=${encDtgen}`;
            console.log(longUrl, '----------------------');
            

            // Shorten the URL
            const shortUrl = await shortenURL(longUrl);

            wpMsg = wpMsg
              .replace("{user_name}", data.member)
              .replace("{form_no}", data.formNo)
              .replace("{pay_link}", shortUrl);
            var wpRes = await sendWappMsg(data.phone_no, wpMsg);
            // console.log(wpRes,'message');
          }
        } catch (error) {
          console.log(error);
        }
        resolve(trn_data)
      }
    });
  },

  approve_dt: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let now = new Date();

      let nextYear = new Date(datetime);
      nextYear.setFullYear(now.getFullYear() + 1);
      let nextYearDate = dateFormat(nextYear, "yyyy-mm-dd HH:MM:ss");

      var finres = await getCurrFinYear();
      var curr_fin_year = finres.curr_fin_year;

      var voucher_res = await drVoucher_gmp(
        FIN_YEAR_MASTER[curr_fin_year],
        curr_fin_year,
        1,
        BRANCH_MASTER[1],
        data.trn_id,
        dateFormat(new Date(data.trn_dt), "yyyy-mm-dd"),
        TRANSFER_TYPE_MASTER[data.pay_mode],
        VOUCHER_MODE_MASTER[data.pay_mode],
        data.acc_code,
        4,
        "DR",
        data.pre_amt,
        data.pre_amt,
        data.chq_no,
        data.chq_dt && new Date(data.chq_dt) != "Invalid Date"
          ? dateFormat(new Date(data.chq_dt), "yyyy-mm-dd")
          : "",
        `Amount deposited for premium of - ${data.user_name}`,
        "A",
        data.user,
        datetime,
        data.user,
        datetime
      );

      if (voucher_res.suc > 0) {
        if (voucher_res.msg > 0) {
          var table_name = "td_premium_dtls",
            fields = `(form_no,premium_amt,created_by,created_at)`,
            values = `('${data.formNo}','${data.pre_amt}','${data.user}','${datetime}')`,
            where = null,
            flag = 0;
          var res_dt = await db_Insert(table_name, fields, values, where, flag);

          // fields = `(form_no,premium_dt,premium_id,premium_amt ${
          //   data.sup_top_flag == "p2"
          //     ? `,premium_amt2,prm_flag2`
          //     : data.sup_top_flag == "p3"
          //     ? ",premium_amt3,prm_flag3"
          //     : ""
          // },created_by,created_at)`;
          // values = `('${form_no}','${nextYearDate}','${data.grp_name}','${
          //   data.pre_amont
          // }' ${
          //   data.sup_top_flag == "p2" || data.sup_top_flag == "p3"
          //     ? `,${data.sup_top_up},'Y'`
          //     : ""
          // },'${data.member}','${datetime}')`;
          // table_name = "td_premium_dtls";
          // whr = null;
          // order = null;
          // var policy_dt = await db_Insert(table_name, fields, values, whr, order);

          // var table_name = "td_premium_dtls",
          //   fields = `approve_status = 'A',modified_by = '${data.user}',modified_at = '${datetime}'`,
          //   values = null,
          //   whr = `form_no = '${data.formNo}'`,
          //   flag = 1;
          // var premium_dt = await db_Insert(table_name, fields, values, whr, flag);

          if (res_dt.suc > 0) {
            var table_name = "td_gen_ins",
              fields = `form_status = 'A',approve_by = '${data.user}',approve_at = '${datetime}',modified_by = '${data.user}',modified_at = '${datetime}'`,
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

            var table_name = "td_transactions",
              fields = `approval_status = 'A', approved_by = '${data.user}',approved_dt = '${datetime}'`,
              values = null,
              whr = `form_no = '${data.formNo}'`,
              flag = 1;
            var approval_dt_st = await db_Insert(
              table_name,
              fields,
              values,
              whr,
              flag
            );

            // WHATSAPP MESSAGE //
            //comment on 20.09.2024 
            // try {
            //   var select = "msg, domain",
            //     table_name = "md_whatsapp_msg",
            //     whr = `msg_for = 'Accept'`,
            //     order = null;
            //   var msg_dt = await db_Select(select, table_name, whr, order);
            //   var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
            //     domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
            //   wpMsg = wpMsg
            //     .replace("{user_name}", data.member)
            //     .replace("{form_no}", data.formNo)
            //     .replace("{status}", formStatus[data.status])
            //     .replace("{remarks}", data.reject);
            //   var wpRes = await sendWappMsg(data.phone_no, wpMsg);
            // } catch (err) {
            //   console.log(err);
            // }
            // END //

            resolve(approval_dt_st);
          } else {
            resolve({ suc: 0, msg: "Voucher Not Saved" });
          }
        } else {
          resolve(voucher_res);
        }
      }
    });
  },
};
