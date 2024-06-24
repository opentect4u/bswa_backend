var dateFormat = require("dateformat"),
  path = require("path"),
  fs = require("fs");
const { db_Select, db_Insert } = require("./MasterModule");

const getMaxFormNo = (flag) => {
  return new Promise(async (resolve, reject) => {
    var select =
        "IF(MAX(SUBSTRING(form_no, -6)) > 0, LPAD(MAX(SUBSTRING(form_no, -6))+1, 6, '0'), '000001') max_form",
      table_name = "td_stp_ins",
      whr = `SUBSTRING(form_no, 1, ${flag.length}) = '${flag}'`,
      order = null;
    var res_dt = await db_Select(select, table_name, whr, order);
    resolve(res_dt);
  });
};

module.exports = {
  super_form_save: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxFormNo(data.flag);
      let form_no = `${data.flag}${year}${no.msg[0].max_form}`;
      console.log(form_no, "pppp");

      if (data.checkedmember) {
        fields = `(form_no,form_dt,fin_yr,member_id,form_status,created_by,created_at)`;
        values = `('${form_no}','${datetime}','${data.fin_yr}','${data.member_id}','T','${data.member}','${datetime}')`;
        table_name = "td_stp_ins";
        whr = null;
        order = null;
      } else {
        fields = `(form_no,form_dt,fin_yr,policy_holder_type,member_id,association,memb_type,memb_oprn, memb_name,dob,phone_no,min_no,personel_no,mem_address,dependent_name,spou_min_no,spou_dob,spou_phone,spou_address,form_status,created_by,created_at)`;
        values = `('${form_no}','${datetime}','${data.fin_yr}','N','${data.member_id}','${data.unit}','${data.member_type}','${data.memb_oprn}','${data.member}','${data.gen_dob}','${data.phone_no}','${data.min_no}','${data.personal_no}','${data.mem}','${data.spouse}','${data.spouse_min_no}','${data.spou_dob}','${data.spou_mobile}','${data.spou_mem}','T','${data.member}','${datetime}')`;
        table_name = "td_stp_ins";
        whr = null;
        order = null;
      }
      var stp_dt = await db_Insert(table_name, fields, values, whr, order);

      if (stp_dt.suc > 0) {
        for (let dt of data.dependent_dt) {
          fields = `(form_no,ind_type,fin_year,particulars,amount,treatment_dtls,created_by,created_at)`;
          values = `('${form_no}','${dt.ind_type}','${dt.fin_year}','${dt.particulars}','${dt.amount}','${dt.treatment_dtls}','${data.member}','${datetime}')`;
          table_name = "td_stp_dtls";
          whr = null;
          order = null;
          var super_dt = await db_Insert(
            table_name,
            fields,
            values,
            whr,
            order
          );
          super_dt["form_no"] = form_no;
        }
      }
      console.log(super_dt, "gggg");
      resolve(super_dt);
    });
  },

  reject_dt: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      var fields = `form_status = '${data.status}',resolution_no ='${data.resolution_no}',resolution_dt = '${data.resolution_dt}',remarks = '${data.reject}',rejected_by = '${data.user}',rejected_dt = '${datetime}',modified_by = '${data.user}',modified_at = '${datetime}'`,
        table_name = "td_stp_ins",
        values = null,
        whr = `form_no = '${data.formNo}'`,
        flag = 1;
      var mem_dt = await db_Insert(table_name, fields, values, whr, flag);
      resolve(mem_dt);
    });
  },

  approve_dt: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

      var table_name = "td_transactions",
        fields = `(form_no,premium_amt,tot_amt,pay_mode,created_by,created_at)`,
        values = `('${data.formNo}','${data.pre_amt}','${data.pre_amt}','O','${data.user}','${datetime}')`;
      (whr = null), (flag = 0);
      var res_dt = await db_Insert(table_name, fields, values, whr, flag);

      if (res_dt.suc > 0) {
        var table_name = "td_stp_ins",
          fields = `form_status = 'A',resolution_no = '${data.resolution_no}',resolution_dt = '${data.resolution_dt}',approve_by = '${data.user}',approve_at = '${datetime}', modified_by = '${data.user}',modified_at = '${datetime}'`,
          values = null,
          whr = `form_no = '${data.formNo}'`,
          flag = 1;
        var depend_dt = await db_Insert(table_name, fields, values, whr, flag);
        resolve(depend_dt);
      }
    });
  },
};
