const { db_Select } = require("./MasterModule");
dateFormat = require("dateformat");

module.exports = {
  admin_login_data: (data) => {
    return new Promise(async (resolve, reject) => {
      var select = "*",
        table_name = "md_user",
        whr = `user_type = 'A' AND user_status = 'A' AND user_id = '${data.username}'`,
        order = null;
      var login_dt = await db_Select(select, table_name, whr, order);
      resolve(login_dt);
    });
  },

  member_login_data: (data) => {
    return new Promise(async (resolve, reject) => {
      var select = "a.*, b.mem_type",
        table_name = "md_user a, md_member b",
        whr = `a.user_id=b.member_id AND a.user_type = 'M' AND a.user_status = 'A' AND a.user_id = '${data.username}'`,
        order = null;
      var mem_login_dt = await db_Select(select, table_name, whr, order);
      resolve(mem_login_dt);
    });
  },

  superadmin_login_data: (data) => {
    return new Promise(async (resolve, reject) => {
      var select = "*",
        table_name = "md_user",
        whr = `user_type = 'SA' AND user_status = 'A' AND user_id = '${data.username}'`,
        order = null;
      var sup_login_dt = await db_Select(select, table_name, whr, order);
      resolve(sup_login_dt);
    });
  },
};
