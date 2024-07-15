const db = require("../core/db"),
  { createLogFile } = require("../core/createLog");
// const fin_db = require("../core/fin_db");
const axios = require("axios");

const db_Select = (select, table_name, whr, order) => {
  var tb_whr = whr ? `WHERE ${whr}` : "";
  var tb_order = order ? order : "";
  let sql = `SELECT ${select} FROM ${table_name} ${tb_whr} ${tb_order}`;
  // console.log(sql);
  return new Promise((resolve, reject) => {
    try {
      db.query(sql, (err, result) => {
        if (err) {
          createLogFile({
            event: `Exicuting Select Statement from table ${table_name}`,
            message: JSON.stringify(err),
          });
          console.log(err);
          data = { suc: 0, msg: JSON.stringify(err) };
        } else {
          data = { suc: 1, msg: result, sql };
        }
        resolve(data);
      });
    } catch (err) {
      createLogFile({
        event: `Exicuting Select Statement from table ${table_name}`,
        message: err,
      });
      reject({ suc: 0, msg: err, sql: sql });
    }
  });
};

const db_Insert = (table_name, fields, values, whr, flag, sel = false) => {
  var sql = "",
    msg = "",
    tb_whr = whr ? `WHERE ${whr}` : "";
  // 0 -> INSERT; 1 -> UPDATE
  // IN INSERT flieds ARE TABLE COLOUMN NAME ONLY || IN UPDATE fields ARE TABLE NAME = VALUES
  if (flag > 0) {
    sql = `UPDATE ${table_name} SET ${fields} ${tb_whr}`;
    msg = "Updated Successfully !!";
  } else {
    sql = `INSERT INTO ${table_name} ${fields} ${
      !sel ? "VALUES" : ""
    } ${values}`;
    msg = "Inserted Successfully !!";
  }

  return new Promise((resolve, reject) => {
    try {
      db.query(sql, (err, lastId) => {
        if (err) {
          console.log(err);
          createLogFile({
            event: `Exicuting ${
              flag > 0 ? "Update" : "Insert"
            } Statement for table ${table_name}`,
            message: err,
          });
          data = { suc: 0, msg: JSON.stringify(err) };
        } else {
          data = { suc: 1, msg: msg, lastId };
        }
        resolve(data);
      });
    } catch (err) {
      createLogFile({
        event: `Exicuting ${
          flag > 0 ? "Update" : "Insert"
        } Statement for table ${table_name}`,
        message: err,
      });
      reject({ suc: 0, msg: err });
    }
  });
};

// const db_fin_Insert = (table_name, fields, values, whr, flag) => {
//   var sql = "",
//     msg = "",
//     tb_whr = whr ? `WHERE ${whr}` : "";
//   // 0 -> INSERT; 1 -> UPDATE
//   // IN INSERT flieds ARE TABLE COLOUMN NAME ONLY || IN UPDATE fields ARE TABLE NAME = VALUES
//   if (flag > 0) {
//     sql = `UPDATE ${table_name} SET ${fields} ${tb_whr}`;
//     msg = "Updated Successfully !!";
//   } else {
//     sql = `INSERT INTO ${table_name} ${fields} VALUES ${values}`;
//     msg = "Inserted Successfully !!";
//   }

//   return new Promise((resolve, reject) => {
//     try {
//       fin_db.query(sql, (err, lastId) => {
//         if (err) {
//           console.log(err);
//           createLogFile({
//             event: `Exicuting ${
//               flag > 0 ? "Update" : "Insert"
//             } Statement for table ${table_name}`,
//             message: err,
//           });
//           data = { suc: 0, msg: JSON.stringify(err) };
//         } else {
//           data = { suc: 1, msg: msg, lastId };
//         }
//         resolve(data);
//       });
//     } catch (err) {
//       createLogFile({
//         event: `Exicuting ${
//           flag > 0 ? "Update" : "Insert"
//         } Statement for table ${table_name}`,
//         message: err,
//       });
//       reject({ suc: 0, msg: err });
//     }
//   });
// };

const db_Delete = (table_name, whr) => {
  whr = whr ? `WHERE ${whr}` : "";
  var sql = `DELETE FROM ${table_name} ${whr}`;
  return new Promise((resolve, reject) => {
    try {
      db.query(sql, (err, lastId) => {
        if (err) {
          createLogFile({
            event: `Exicuting Delete Statement for table ${table_name}`,
            message: JSON.stringify(err),
          });
          console.log(err);
          data = { suc: 0, msg: JSON.stringify(err) };
        } else {
          data = { suc: 1, msg: "Deleted Successfully !!" };
        }
        resolve(data);
      });
    } catch (err) {
      createLogFile({
        event: `Exicuting Delete Statement for table ${table_name}`,
        message: err,
      });
      reject({ suc: 0, msg: err });
    }
  });
};

const generateDBValue = ({
  data = Object,
  erase = Array[null],
  flag = Number,
}) => {
  return new Promise(async (resolve, reject) => {
    var values = "",
      fields = "";
    if (Array.isArray(erase) && erase.length > 0) {
      for (let dt of erase) {
        if (data[dt]) delete data[dt];
      }
    }
    // 0 -> INSERT; 1 -> UPDATE
    if (flag > 0) {
      data["modified_by"] = data.created_by;
      delete data["created_by"];
      var result = [];
      for (let [key, value] of Object.entries(data)) {
        result.push(`${key}='${value}'`);
      }
      fields = result.join(",");
    } else {
      fields = Object.keys(data).join(",");
      values = Object.values(data)
        .map((dt) => (dt ? `'${dt}'` : "''"))
        .join(",");
    }
    resolve({ fields, values });
  });
};

const HUSBAND_ID = 15,
  WIFE_ID = 3;

const GenPassword = () => {
  return new Promise((resolve, reject) => {
    var alpha = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "0",
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
    ];
    var a = alpha[Math.floor(Math.random() * 62)];
    var b = alpha[Math.floor(Math.random() * 62)];
    var c = alpha[Math.floor(Math.random() * 62)];
    var d = alpha[Math.floor(Math.random() * 62)];
    var e = alpha[Math.floor(Math.random() * 62)];
    var sum_id = a + b + c + d + e;
    var sum = sum_id.toUpperCase();
    console.log(sum);
    resolve(sum);
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

const formStatus = {
  P: "Pending",
  T: "Accepted",
  R: "Rejected",
  A: "Approved",
};

const getCurrFinYear = () => {
  return new Promise((resolve, reject) => {
    var nowYear = parseInt(dateFormat(new Date(), "yyyy"));
    var current_year = nowYear - 1,
      previous_year = nowYear - 2,
      next_year = nowYear,
      end_acc_dm = "0331";

    if (dateFormat(new Date(), "yyyymmdd") > nowYear + end_acc_dm) {
      current_year += 1;
      previous_year += 1;
      next_year += 1;
    }

    var curr_fin_year = `${current_year}-${next_year
        .toString()
        .substring(4, 2)}`,
      prev_fin_year = `${previous_year}-${current_year
        .toString()
        .substring(4, 2)}`;
    resolve({ curr_fin_year, prev_fin_year });
  });
};

const FIN_YEAR_MASTER = {
  "2024-25": 5,
  "2025-26": 6,
  "2026-27": 7,
  "2027-28": 8,
  "2028-29": 9,
};

const BRANCH_MASTER = {
  1: "BOSEC",
  2: "BSPWA",
};

const REMARKS_MASTER = {
  remarks: "Amount deposited for opening of member for member no",
};

const postVoucher = (
  fin_year,
  fin_full_year,
  br_id,
  br_nm,
  trn_id,
  trn_dt,
  transfer_type,
  voucher_mode,
  acc_code,
  acc_cd_cr,
  dr_cr_flag,
  amount,
  ins_no,
  ins_dt,
  remarks,
  approval_status,
  created_by,
  created_at,
  approved_by,
  approved_dt
) => {
  return new Promise((resolve, reject) => {
    let data = JSON.stringify({
      data: {
        fin_yr: fin_year,
        fin_fulyr: fin_full_year,
        branch_id: br_id,
        br_nm: br_nm,
        trans_no: trn_id,
        trans_dt: trn_dt,
        transfer_type: transfer_type,
        voucher_mode: voucher_mode,
        acc_cd_dr: acc_code,
        dr_cr_flag: dr_cr_flag,
        amount: amount,
        acc_cd_cr: acc_cd_cr,
        ins_no: ins_no,
        ins_dt: ins_dt,
        remarks: remarks,
        approval_status: approval_status,
        created_by: created_by,
        created_dt: created_at,
        approved_by: approved_by,
        approved_dt: approved_dt,
      },
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://bspwa.in/fin/index.php/api_voucher/member_subscription",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        resolve({ suc: 1, msg: response.data });
      })
      .catch((error) => {
        console.log(error);
        resolve({ suc: 0, msg: error });
      });
  });
};

const drVoucher = (
  fin_year,
  fin_full_year,
  br_id,
  br_nm,
  trn_id,
  trn_dt,
  transfer_type,
  voucher_mode,
  acc_code,
  acc_cd_cr,
  dr_cr_flag,
  acc_cd_adm_cr,
  acc_cd_don_cr,
  memb_type,
  amount_don_cr,
  amount_adm_cr,
  amount,
  amount_cr,
  ins_no,
  ins_dt,
  remarks,
  approval_status,
  created_by,
  created_at,
  approved_by,
  approved_dt
) => {
  return new Promise((resolve, reject) => {
    let data = JSON.stringify({
      data: {
        fin_yr: fin_year,
        fin_fulyr: fin_full_year,
        branch_id: br_id,
        br_nm: br_nm,
        trans_no: trn_id,
        trans_dt: trn_dt,
        transfer_type: transfer_type,
        voucher_mode: voucher_mode,
        acc_cd_dr: acc_code,
        dr_cr_flag: dr_cr_flag,
        amount_dr: amount,
        amount_cr: amount_cr,
        acc_cd_cr: acc_cd_cr,
        acc_cd_don_cr: acc_cd_don_cr,
        acc_cd_adm_cr: acc_cd_adm_cr,
        memb_type: memb_type,
        amount_don_cr: amount_don_cr,
        amount_adm_cr: amount_adm_cr,
        ins_no: ins_no,
        ins_dt: ins_dt,
        remarks: remarks,
        approval_status: approval_status,
        created_by: created_by,
        created_dt: created_at,
        approved_by: approved_by,
        approved_dt: approved_dt,
      },
    });

    console.log(data, "data");

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://bspwa.in/fin/index.php/api_voucher/member_opening",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        resolve({ suc: 1, msg: response.data });
      })
      .catch((error) => {
        console.log(error);
        resolve({ suc: 0, msg: error });
      });
  });
};

const TRANSFER_TYPE_MASTER = {
  C: "H",
  Q: "C",
  O: "N",
};

const CR_ACC_MASTER = {
  G: 67,
  AI: 68,
  L: 69,
};

const VOUCHER_MODE_MASTER = {
  C: "C",
  Q: "B",
  O: "B",
};

module.exports = {
  db_Select,
  db_Insert,
  db_Delete,
  generateDBValue,
  HUSBAND_ID,
  WIFE_ID,
  GenPassword,
  getMaxTrnId,
  formStatus,
  // db_fin_Insert,
  getCurrFinYear,
  postVoucher,
  FIN_YEAR_MASTER,
  BRANCH_MASTER,
  TRANSFER_TYPE_MASTER,
  VOUCHER_MODE_MASTER,
  CR_ACC_MASTER,
  // REMARKS_MASTER,
  drVoucher,
};
