const dateFormat = require("dateformat");
const { db_Insert, db_Select } = require("./MasterModule");
const bcrypt = require("bcrypt");

module.exports = {
  admin_dt: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      var password = bcrypt.hashSync(data.pass.toString(), 10);

      var select = "user_id",
        table_name = "md_user",
        whr = `user_type = 'A' and user_id = '${data.user_id}'`,
        order = null;
      var chk_dt = await db_Select(select, table_name, whr, order);

      var table_name = "md_user",
        fields =
          chk_dt.suc > 0 && chk_dt.msg.length > 0
            ? `password='${password}',user_name='${data.u_name}',user_phone='${data.u_phone}'`
            : "(user_id,user_type,password,user_name,user_email,user_phone,user_status,created_by,created_at)",
        values = `('${data.user_id}','A','${password}','${data.u_name}','${data.user_id}','${data.u_phone}','A','${data.user}','${datetime}')`,
        where =
          chk_dt.suc > 0 && chk_dt.msg.length > 0
            ? `user_id='${data.user_id}'`
            : "",
        flag = chk_dt.suc > 0 && chk_dt.msg.length > 0 ? 1 : 0;
      var res_dt = await db_Insert(table_name, fields, values, where, flag);
      resolve(res_dt);
    });
  },
};
