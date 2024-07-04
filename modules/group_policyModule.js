var dateFormat = require("dateformat"),
  path = require("path"),
  fs = require("fs");
const { db_Select, db_Insert } = require("./MasterModule");

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
    console.log(res_dt, "sl_no");
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

module.exports = {
  group_policy_form_save: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxFormNo(data.flag);
      let form_no = `${data.flag}${year}${no.msg[0].max_form}`;
      console.log(form_no, "pppp");

      let sl_no = await getMaxSlNo(form_no);
      sl_no = sl_no.suc > 0 ? sl_no.msg[0].sl_no : 1;

      fields = `(form_no,premium_id,premium_amt ${
        data.sup_top_flag == "p2"
          ? `,premium_amt2,prm_flag2`
          : data.sup_top_flag == "p3"
          ? ",premium_amt3,prm_flag3"
          : ""
      },created_by,created_at)`;
      values = `('${form_no}','${data.grp_name}','${data.pre_amont}' ${
        data.sup_top_flag == "p2" || data.sup_top_flag == "p3"
          ? `,${data.sup_top_up},'Y'`
          : ""
      },'${data.member}','${datetime}')`;
      table_name = "td_premium_dtls";
      whr = null;
      order = null;
      var policy_dt = await db_Insert(table_name, fields, values, whr, order);

      if (data.checkedmember) {
        fields = `(form_no,form_dt,policy_holder_type,member_id,association,memb_type,memb_oprn,memb_name,father_husband_name, sex, marital_status, dob,form_type,form_status,disease_flag,disease_type,created_by,created_at)`;
        values = `('${form_no}','${datetime}','M','${data.member_id}','${data.unit}','${data.member_type}','${data.memb_oprn}','${data.member}','${data.gurdian}','${data.gen}','${data.marital_status}','${data.gen_dob}','GP','P','${data.type_diseases}','${data.name_diseases}','${data.member}','${datetime}')`;
        table_name = "td_gen_ins";
        whr = null;
        order = null;
      } else {
        fields = `(form_no,form_dt, policy_holder_type,member_id,association,memb_type, memb_oprn, memb_name, father_husband_name, sex, marital_status, dob,form_type,form_status,disease_flag,disease_type,created_by,created_at)`;
        values = `('${form_no}','${datetime}','N','${data.member_id}','${data.unit}','${data.member_type}','${data.memb_oprn}','${data.member}','${data.gurdian}','${data.gen}','${data.marital_status}','${data.gen_dob}','GP','p','${data.type_diseases}','${data.name_diseases}','${data.member}','${datetime}')`;
        table_name = "td_gen_ins";
        whr = null;
        order = null;
      }
      var policy_dt = await db_Insert(table_name, fields, values, whr, order);

      if (policy_dt.suc > 0) {
        if (data.checkedmember) {
          for (let dt of data.dependent_dt) {
            fields = `(form_no,sl_no,member_id,dept_name,relation,disease_flag,disease_type,dob,created_by,created_at)`;
            values = `('${form_no}','${dt.sl_no}','${data.member_id}','${dt.dependent_name}','${dt.relation}','${dt.type_diseases}','${dt.name_diseases}','${dt.dob}','${data.member}','${datetime}')`;
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
            policy_dependent_dt["form_no"] = form_no;
          }
        } else {
          for (let dt of data.dependent_dt) {
            fields = `(form_no,sl_no,member_id,dept_name,relation,disease_flag,disease_type,dob,created_by,created_at)`;
            values = `('${form_no}','${dt.sl_no}','${data.member_id}','${dt.dependent_name}','${dt.relation}','${dt.type_diseases}','${dt.name_diseases}','${dt.dob}','${data.member}','${datetime}')`;
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
            policy_dependent_dt["form_no"] = form_no;
          }
        }
      }
      //   policy_dependent_dt["form_no"] = form_no;
      console.log(policy_dependent_dt, "gggg");
      resolve(policy_dependent_dt);
    });
  },

  group_policy_form_save_child: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxFormNo();
      let form_no = `C${year}${no.msg[0].max_form}`;
      console.log(form_no, "pppp");

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
      console.log(policy_dependent_dt, "gggg");
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
      resolve(mem_dt);
    });
  },

  accept_dt_cash: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxTrnId();
      let trn_id = `${year}${no.msg[0].max_trn_id}`;
      console.log(trn_id, "pppp");

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

        var fields = `premium_dt = '${data.pre_dt}',modified_by = '${data.user}',modified_at = '${datetime}'`,
          table_name = "td_premium_dtls",
          values = null,
          whr = `form_no = '${data.formNo}'`,
          flag = 1;
        var mem_dt = await db_Insert(table_name, fields, values, whr, flag);
      }
      resolve(mem_dt);
    });
  },

  accept_dt_cheque: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxTrnId();
      let trn_id = `${year}${no.msg[0].max_trn_id}`;
      console.log(trn_id, "pppp");

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

        var fields = `premium_dt = '${data.pre_dt}',modified_by = '${data.user}',modified_at = '${datetime}'`,
          table_name = "td_premium_dtls",
          values = null,
          whr = `form_no = '${data.formNo}'`,
          flag = 1;
        var mem_dt = await db_Insert(table_name, fields, values, whr, flag);
      }
      resolve(mem_dt);
    });
  },

  approve_dt: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let now = new Date();

      let nextYear = new Date(datetime);
      nextYear.setFullYear(now.getFullYear() + 1);
      let nextYearDate = dateFormat(nextYear, "yyyy-mm-dd HH:MM:ss");

      var table_name = "td_premium_dtls",
        fields = `(form_no,premium_dt,created_by,created_at)`,
        values = `('${data.formNo}','${nextYearDate}','${data.user}','${datetime}')`,
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

      if (res_dt.suc > 0) {
        var table_name = "td_gen_ins",
          fields = `form_status = 'A',approve_by = '${data.user}',approve_at = '${datetime}',modified_by = '${data.user}',modified_at = '${datetime}'`,
          values = null,
          whr = `form_no = '${data.formNo}'`,
          flag = 1;
        var approve_dt = await db_Insert(table_name, fields, values, whr, flag);
      }

      resolve(approve_dt);
    });
  },
};
