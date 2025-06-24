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
      var select = "a.*, b.mem_type, b.form_no, b.mem_type, b.memb_name, b.member_id",
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

  //   stp_member_login_data: (data) => {
  //   return new Promise(async (resolve, reject) => {
  //     var select = "a.policy_holder_type,a.min_no,a.stp_memb_name,a.stp_memb_phone,a.stp_user_status,a.password,b.member_id",
  //       table_name = "md_stp_login a LEFT JOIN td_stp_ins b ON a.min_no = b.min_no",
  //       whr = `a.stp_user_status = 'A' AND a.min_no COLLATE utf8mb4_general_ci = '${data.min_no}' COLLATE utf8mb4_general_ci`,
  //       order = null;
  //     var stp_mem_login_dt = await db_Select(select, table_name, whr, order);
  //     resolve(stp_mem_login_dt);
  //   });
  // },

  stp_member_login_data: (data) => {
  return new Promise(async (resolve, reject) => {
    const select = `
      a.policy_holder_type, a.min_no, a.stp_memb_name, a.stp_memb_phone,
      a.stp_user_status, a.password, a.form_no,b.member_id
    `;
    
    // const table_name = `
    //   md_stp_login a
    //   LEFT JOIN td_stp_ins b
    //   ON a.min_no COLLATE utf8mb4_general_ci = b.min_no COLLATE utf8mb4_general_ci
    // `;

     const table_name = `
      md_stp_login a
      LEFT JOIN td_stp_ins b
      ON a.min_no COLLATE utf8mb4_0900_ai_ci = b.min_no COLLATE utf8mb4_0900_ai_ci
    `;

    // const whr = `
    //   a.stp_user_status = 'A'
    //   AND a.min_no COLLATE utf8mb4_general_ci = '${data.min_no}' COLLATE utf8mb4_general_ci
    // `;

     const whr = `
      a.stp_user_status = 'A'
      AND a.min_no COLLATE utf8mb4_0900_ai_ci = '${data.min_no}' COLLATE utf8mb4_0900_ai_ci
    `;

    const order = null;

    try {
      const stp_mem_login_dt = await db_Select(select, table_name, whr, order);
      resolve(stp_mem_login_dt);
    } catch (err) {
      reject(err);
    }
  });
}

};
