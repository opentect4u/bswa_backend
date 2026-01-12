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

    user_data: (data) => {
    return new Promise(async (resolve, reject) => {
      var select = "*",
        table_name = "md_user",
        whr = `user_id = '${data.username}'`,
        order = null;
      var user_data = await db_Select(select, table_name, whr, order);
      resolve(user_data);
    });
  },

  member_login_data: (username) => {
    return new Promise(async (resolve, reject) => {
      var select = "a.*, b.mem_type, b.form_no, b.mem_type, b.memb_name, b.member_id",
        table_name = "md_user a, md_member b",
        whr = `a.user_id=b.member_id AND a.user_type = 'M' AND a.user_status = 'A' AND a.user_id = '${username}'`,
        order = null;
      var mem_login_dt = await db_Select(select, table_name, whr, order);
      resolve(mem_login_dt);
    });
  },

    stp_login_data: (username) => {
    return new Promise(async (resolve, reject) => {
      var select = "a.form_no,a.form_dt,d.user_type,a.policy_holder_type,c.policy_holder_type,a.member_id,a.association,b.unit_name,a.memb_type,a.memb_oprn,a.memb_name,a.gender,a.dob,a.mem_address,a.phone_no,a.min_no,a.personel_no,a.memb_flag,a.dependent_name,a.spou_min_no,a.spou_dob,a.spou_phone,a.spou_gender,a.spou_address,a.dependent_flag,a.premium_type,d.stp_user_status",
      table_name = "td_stp_ins a LEFT JOIN md_unit b ON a.association = b.unit_id LEFT JOIN md_policy_holder_type c ON a.policy_holder_type = c.policy_holder_type_id LEFT JOIN md_user d ON a.min_no = d.min_no AND a.form_no = d.stp_form_no AND a.member_id = d.user_id",
      whr = `a.member_id = '${username}' AND d.user_status = 'A' AND d.stp_user_status = 'A'`,
      order = null;
      var stp_login_dt = await db_Select(select, table_name, whr, order);
      resolve(stp_login_dt);
    });
  },

   cp_login_data: (username) => {
    return new Promise(async (resolve, reject) => {
      var select = "a.form_no,a.flag,a.member_id,a.member_name,a.dob,a.gender,a.marital_status,a.status,a.age,a.phone_no,a.member_address,a.gurdian_name,b.cp_user_status",
      table_name = "td_child_policy a LEFT JOIN md_user b ON a.form_no = b.cp_form_no AND a.member_id = b.user_id",
      whr = `a.member_id = '${username}' AND b.user_status = 'A' AND b.cp_user_status = 'A'`,
      order = null;
      var cp_login_dt = await db_Select(select, table_name, whr, order);
      resolve(cp_login_dt);
    });
  },

     gp_login_data: (username) => {
    return new Promise(async (resolve, reject) => {
      var select = "a.form_no,a.form_dt,a.flag,a.policy_holder_type policy_holder_type_id,c.policy_holder_type,a.member_id,a.association,b.unit_name,a.memb_type,a.memb_oprn,a.memb_name,a.phone,a.father_husband_name,a.gender,a.marital_status,a.dob,d.gp_user_status",
      table_name = "td_gen_ins a LEFT JOIN md_unit b ON a.association = b.unit_id LEFT JOIN md_policy_holder_type c ON a.policy_holder_type = c.policy_holder_type_id LEFT JOIN md_user d ON a.form_no = d.gp_form_no AND a.member_id = d.user_id",
      whr = `a.member_id = '${username}' AND d.user_status = 'A' AND d.gp_user_status = 'A'`,
      order = null;
      var gp_login_dt = await db_Select(select, table_name, whr, order);
      resolve(gp_login_dt);
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
      a.policy_holder_type, a.stp_memb_name, a.stp_memb_phone,
      a.stp_user_status, a.password, a.form_no,b.member_id,b.min_no
    `;
    
    // const table_name = `
    //   md_stp_login a
    //   LEFT JOIN td_stp_ins b
    //   ON a.min_no COLLATE utf8mb4_general_ci = b.min_no COLLATE utf8mb4_general_ci
    // `;

     const table_name = `
      md_stp_login a
      LEFT JOIN td_stp_ins b
      ON a.min_no = b.member_id
    `;

    // const whr = `
    //   a.stp_user_status = 'A'
    //   AND a.min_no COLLATE utf8mb4_general_ci = '${data.min_no}' COLLATE utf8mb4_general_ci
    // `;

     const whr = `
      a.stp_user_status = 'A'
      AND a.min_no = '${data.member_id}'
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
