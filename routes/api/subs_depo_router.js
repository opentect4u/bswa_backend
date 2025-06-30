const SubsDepoRouter = require("express").Router();
dotenv = require("dotenv");
const axios = require('axios');
const {
  db_Select,
  db_Insert,
  getMaxTrnId,
  postVoucher,
  getCurrFinYear,
  FIN_YEAR_MASTER,
  BRANCH_MASTER,
  TRANSFER_TYPE_MASTER,
  VOUCHER_MODE_MASTER,
  CR_ACC_MASTER,
} = require("../../modules/MasterModule");
const dateFormat = require("dateformat");
const { sendWappMsg } = require("../../modules/whatsappModule");
dotenv.config({ path: '.env.prod' });

async function shortenURL(longUrl) {
  const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`;
  try {
    const response = await axios.get(apiUrl);
    return response.data; // This will return the shortened URL
  } catch (error) {
    console.error('Error shortening URL:', error);
    return longUrl; // If the shortening fails, fallback to the long URL
  }
}

SubsDepoRouter.post("/get_mem_subs_dtls", async (req, res) => {
  const data = req.body;
  var select =
      "a.member_id, a.form_no, a.memb_name, a.mem_type, a.memb_oprn, a.phone_no, a.email_id, DATE(b.subscription_upto) subscription_upto, b.amount, b.calc_amt, b.calc_upto",
    table_name = "md_member a, td_memb_subscription b",
    whr = `a.member_id=b.member_id AND a.member_id = '${data.memb_id}' AND DATE(b.subscription_upto) = (SELECT MAX(DATE(c.subscription_upto)) FROM td_memb_subscription c WHERE a.member_id=c.member_id)`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

SubsDepoRouter.post("/get_tnx_details", async (req, res) => {
  const data = req.body;
  var select = "*",
    table_name = "td_transactions",
    whr = `approval_status = 'U' AND delete_flag = 'N' ${
      data.trn_id > 0 ? `AND trn_id = ${data.trn_id}` : ""
    }`,
    order = `ORDER BY trn_dt, trn_id`;
  var res_dt = await db_Select(select, table_name, whr, order);
  if (res_dt.suc > 0 && res_dt.msg.length > 0 && data.trn_id > 0) {
    var select =
        "a.member_id, a.form_no, a.memb_name, a.mem_type, a.memb_oprn, a.phone_no, a.email_id, DATE(b.subscription_upto) subscription_upto, b.calc_amt, b.calc_upto",
      table_name = "md_member a, td_memb_subscription b",
      whr = `a.member_id=b.member_id AND a.form_no = '${data.frm_no}' AND DATE(b.subscription_upto) = (SELECT MAX(DATE(c.subscription_upto)) FROM td_memb_subscription c WHERE a.member_id=c.member_id)`,
      order = null;
    var mem_dt = await db_Select(select, table_name, whr, order);

    var select =
        "a.effective_dt, a.memb_type, a.adm_fee, a.donation, a.subs_type, a.subscription_1, a.subscription_2",
      table_name = "md_member_fees a",
      whr = `a.memb_type = '${
        // mem_dt.suc > 0 && mem_dt.msg?.[0]?.mem_type ? mem_dt.msg[0].mem_type : ""
        mem_dt.suc > 0 && mem_dt.msg && mem_dt.msg[0] && mem_dt.msg[0].mem_type ? mem_dt.msg[0].mem_type : ""
      }' AND a.effective_dt = (SELECT MAX(b.effective_dt) FROM md_member_fees b WHERE a.memb_type=b.memb_type AND b.effective_dt <= now())`,
      order = null;
    var fee_dt = await db_Select(select, table_name, whr, order);

    // console.log(fee_dt);

    res_dt.msg[0]["mem_dt"] =
      mem_dt.suc > 0 && mem_dt.msg.length > 0 ? mem_dt.msg[0] : {};
    res_dt.msg[0]["fee_dt"] =
      fee_dt.suc > 0 && fee_dt.msg.length > 0 ? fee_dt.msg[0] : {};
  }
  res.send(res_dt);
});

SubsDepoRouter.post("/mem_subs_dtls_save", async (req, res) => {
  const data = req.body,
    trn_dt = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var sub_upto = new Date(data.calc_upto);
  console.log(sub_upto,'upto');
  
  switch (data.sub_type) {
    case "Y":
      sub_upto.setFullYear(sub_upto.getFullYear() + 1);
      break;
    case "O":
      sub_upto.setFullYear(sub_upto.getFullYear() + 1);
      break;
    case "M":
      var tot_tenure =
        data.sub_fee > 0 ? (data.paid_month_amt / data.sub_fee) : 0;
      var sub_year = sub_upto.getFullYear(), sub_mon = sub_upto.getMonth()+1;
      if(((sub_upto.getMonth()+1) + tot_tenure) > 12) sub_year = parseInt(sub_year) + 1;
      if(sub_upto.getFullYear() != sub_year){
        sub_mon = ((sub_upto.getMonth()+1) + tot_tenure) - 12;
      }else{
        sub_mon = ((sub_upto.getMonth()+1) + tot_tenure)
      }
      
      sub_upto = new Date(sub_year, sub_mon, 0)
      console.log(sub_upto);
      

      // console.log(sub_upto.getMonth()+1, tot_tenure, 'Calculation');
      // sub_upto.setMonth(sub_upto.getMonth()+1 + tot_tenure);
      // console.log(sub_upto);
      
      break;

    default:
      var tot_tenure =
        data.sub_fee > 0 ? data.paid_month_amt / data.sub_fee : 0;
      sub_upto.setMonth(sub_upto.getMonth() + tot_tenure-1);
      break;
  }

  var finres = await getCurrFinYear();
  var curr_fin_year = finres.curr_fin_year;

  var voucher_res = await postVoucher(
    FIN_YEAR_MASTER[curr_fin_year],
    curr_fin_year,
    2,
    BRANCH_MASTER[2],
    data.trn_id,
    dateFormat(new Date(trn_dt), "yyyy-mm-dd"),
    TRANSFER_TYPE_MASTER[data.pay_mode],
    VOUCHER_MODE_MASTER[data.pay_mode],
    data.acc_code,
    CR_ACC_MASTER[data.memb_type],
    "DR",
    data.sub_amt,
    data.chq_no,
    data.chq_dt > 0 ? dateFormat(new Date(data.chq_dt), "yyyy-mm-dd") : "",
    data.remarks,
    "A",
    data.user,
    dateFormat(new Date(trn_dt), "yyyy-mm-dd"),
    data.user,
    dateFormat(new Date(trn_dt), "yyyy-mm-dd")
  );

  var voucher_res = {suc: 1, msg: 1}
  console.log(voucher_res,'voucher_res');
  

  if (voucher_res.suc > 0) {
    if (voucher_res.msg > 0) {
      var table_name = "td_memb_subscription",
        fields =
          "(member_id, sub_dt, amount, subscription_upto, calc_amt, calc_upto, trans_id, created_by, created_at)",
        values = `('${data.memb_id}', '${trn_dt}', '${
          data.sub_amt
        }', '${dateFormat(sub_upto, "yyyy-mm-dd HH:MM:ss")}', 0, '${dateFormat(
          sub_upto,
          "yyyy-mm-dd HH:MM:ss"
        )}', '${data.trn_id}', '${data.user}', '${trn_dt}')`,
        whr = null,
        flag = 0;
      var res_dt = await db_Insert(table_name, fields, values, whr, flag);

      if (res_dt.suc > 0) {
        var table_name = "td_transactions",
          fields = `approval_status = '${data.approval_status}', approved_by = '${data.user}', approved_dt = '${trn_dt}', modified_by = '${data.user}', modified_at = '${trn_dt}'`,
          values = null,
          whr = `trn_id = '${data.trn_id}'`,
          flag = 1;
        var chk_dt = await db_Insert(table_name, fields, values, whr, flag);
      }

      // WHATSAPP MESSAGE //
      // try {
      //   var select = "msg, domain",
      //     table_name = "md_whatsapp_msg",
      //     whr = `msg_for = 'Approve transaction'`,
      //     order = null;
      //   var msg_dt = await db_Select(select, table_name, whr, order);
      //   var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
      //     domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
      //   wpMsg = wpMsg
      //     .replace("{user_name}", data.member)
      //     //   .replace("{form_id}", form_no)
      //     .replace("{trn_id}", data.trn_id)
      //     .replace("{total}", data.sub_amt)
      //     .replace(
      //       "{url}",
      //       `${domain}/#/home/money_receipt_member/${data.memb_id}/${data.trn_id}`
      //     );
      //   var wpRes = await sendWappMsg(data.phone_no, wpMsg);
      // } catch (err) {
      //   console.log(err);
      // }

      // END //

      res.send(res_dt);
    } else {
      res.send({ suc: 0, msg: "Voucher Not Saved" });
    }
  } else {
    res.send(voucher_res);
  }
});

var finres = getCurrFinYear();
// console.log(finres);

SubsDepoRouter.post("/mem_sub_tnx_save", async (req, res) => {
  const data = req.body;
  console.log(data,'data');
  
  trn_dt = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var sub_upto = new Date(data.cal_upto);

  console.log(sub_upto,'upto');

  var tnx_data = await getMaxTrnId();
  let year = dateFormat(new Date(), "yyyy");
  var tnx_id = `${year}${tnx_data.suc > 0 ? tnx_data.msg[0].max_trn_id : 0}`;

  const chq_no = data.chq_no ? `'${data.chq_no}'` : 'NULL';
  const chq_dt = data.chq_dt ? `'${data.chq_dt}'` : 'NULL';
  const chq_bank = data.chq_bank ? `'${data.chq_bank}'` : 'NULL';

  var tot_tenure = data.sub_amt > 0 ? data.sub_amt / data.sub_fee : 0;
  console.log(tot_tenure,'ten');
  
  var sub_upto = new Date(trn_dt);
  // sub_upto.setMonth(sub_upto.getMonth() + tot_tenure - 1);
  sub_upto.setMonth(sub_upto.getMonth() + tot_tenure);

   var finres = await getCurrFinYear();
  var curr_fin_year = finres.curr_fin_year;

  var voucher_res = await postVoucher(
    FIN_YEAR_MASTER[curr_fin_year],
    curr_fin_year,
    2,
    BRANCH_MASTER[2],
    // data.trn_id,
    tnx_id,
    dateFormat(new Date(trn_dt), "yyyy-mm-dd"),
    TRANSFER_TYPE_MASTER[data.pay_mode],
    VOUCHER_MODE_MASTER[data.pay_mode],
    data.acc_code,
    CR_ACC_MASTER[data.memb_type],
    "DR",
    data.sub_amt,
    data.chq_no,
    data.chq_dt > 0 ? dateFormat(new Date(data.chq_dt), "yyyy-mm-dd") : "",
    data.remarks,
    "A",
    data.user,
    dateFormat(new Date(trn_dt), "yyyy-mm-dd"),
    data.user,
    dateFormat(new Date(trn_dt), "yyyy-mm-dd")
  );

  var voucher_res = {suc: 1, msg: 1}
  console.log(voucher_res,'voucher_res');

  // if(data.pay_mode != 'O'){
  if (voucher_res.suc > 0) {
    if (voucher_res.msg > 0) {
    var table_name = "td_transactions",
      fields =
        "(form_no, trn_dt, trn_id, sub_amt, onetime_amt, adm_fee, donation, premium_amt, tot_amt, pay_mode, receipt_no, chq_no, chq_dt, chq_bank, approval_status, created_by, created_at)",
      values = `('${data.form_no}', '${data.form_dt}', '${tnx_id}', '${data.sub_amt}', 0, 0, 0, 0, ${data.sub_amt}, '${data.pay_mode}', '${data.receipt_no}', ${chq_no}, ${chq_dt}, ${chq_bank}, '${data.approval_status}', '${data.user}', '${trn_dt}')`,
      whr = null,
      flag = 0;
    var res_dts = await db_Insert(table_name, fields, values, whr, flag);

    if(res_dts.suc > 0){
      var table_name = "td_memb_subscription",
      fields =
        "(member_id, sub_dt, amount, subscription_upto, calc_amt, calc_upto, trans_id, modified_by, modified_at)",
      values = `('${data.memb_id}', '${data.form_dt}', '${data.sub_amt}', '${dateFormat(
                      sub_upto,
                      "yyyy-mm-dd HH:MM:ss"
                    )}', '${data.cal_amt}', '${dateFormat(
                sub_upto,
                "yyyy-mm-dd HH:MM:ss"
              )}', '${tnx_id}', '${data.user}', '${trn_dt}')`,
      whr = null,
      flag = 0;
    var res_dt = await db_Insert(table_name, fields, values, whr, flag);
    }
  
    res_dts["trn_id"] = tnx_id;
    res.send(res_dt)
     } else {
      res.send({ suc: 0, msg: "Voucher Not Saved" });
    }
  } else {
    res.send(voucher_res);
  }

  // }else{
  //   // WHATSAPP MESSAGE //
  //   try {
  //     const encDtgen = encodeURIComponent(data.pay_enc_data)
  //     console.log(encDtgen,'uuu');
      
  //     var select = "msg, domain",
  //       table_name = "md_whatsapp_msg",
  //       whr = `msg_for = 'Member accept online'`,
  //       order = null;
  //     var msg_dt = await db_Select(select, table_name, whr, order);
  //     var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
  //       domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
  
  //       // Construct the long URL
  //     const longUrl = `${process.env.CLIENT_URL}/auth/payment_preview_page?enc_dt=${encDtgen}`;
  
  //       // Shorten the URL
  //     const shortUrl = await shortenURL(longUrl);
  
  //     wpMsg = wpMsg
  //       .replace("{user_name}", data.member)
  //       .replace("{form_no}", data.form_no)
  //       // .replace("{pay_link}", `${process.env.CLIENT_URL}/auth/payment_preview_page?enc_dt=${encDtgen}`);
  //       .replace("{pay_link}", shortUrl);
  //     var wpRes = await sendWappMsg(
  //       data.phone_no,
  //       wpMsg
  //     );
  //     console.log(wpRes,'message');
  //     res.send({suc: 1, msg: wpRes})
  //   } catch (err) {
  //     console.log(err);
  //     res.send({suc: 0, msg: "Message Not send for online transaction"})
  //   }
  // }

    // END //

  // WHATSAPP MESSAGE //
  // try {
  //   var select = "msg, domain",
  //     table_name = "md_whatsapp_msg",
  //     whr = `msg_for = 'Approve transaction'`,
  //     order = null;
  //   var msg_dt = await db_Select(select, table_name, whr, order);
  //   var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
  //     domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
  //   wpMsg = wpMsg
  //     .replace("{user_name}", data.member)
  //     //   .replace("{form_id}", form_no)
  //     .replace("{trn_id}", tnx_id)
  //     .replace("{total}", data.sub_amt)
  //     .replace("{url}", `${domain}/#/admin/money_receipt/${data.memb_id}`);
  //   var wpRes = await sendWappMsg(data.phone_no, wpMsg);
  // } catch (err) {
  //   console.log(err);
  // }
  // END //

  // res.send(res_dt);
});

SubsDepoRouter.post("/mem_sub_tnx_save_online", async (req, res) => {
  const data = req.body,
    trn_dt = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var tnx_data = await getMaxTrnId();
  let year = dateFormat(new Date(), "yyyy");
  var tnx_id = `${year}${tnx_data.suc > 0 ? tnx_data.msg[0].max_trn_id : 0}`;
  var table_name = "td_transactions",
    fields =
      "(form_no, trn_dt, trn_id, sub_amt, onetime_amt, adm_fee, donation, premium_amt, tot_amt, pay_mode, receipt_no, chq_no, chq_dt, chq_bank, approval_status, created_by, created_at)",
    values = `('${data.form_no}', '${trn_dt}', '${tnx_id}', '${data.sub_amt}', 0, 0, 0, 0, ${data.sub_amt}, 'O', '${data.receipt_no}', '${data.chq_no}', '${data.chq_dt}', '${data.chq_bank}', '${data.approval_status}', '${data.user}', '${trn_dt}')`,
    whr = null,
    flag = 0;
  var res_dt = await db_Insert(table_name, fields, values, whr, flag);
  res_dt["trn_id"] = tnx_id;
  // console.log(res_dt, "res");
  // WHATSAPP MESSAGE //
  // try {
  //   var select = "msg, domain",
  //     table_name = "md_whatsapp_msg",
  //     whr = `msg_for = 'Approve transaction'`,
  //     order = null;
  //   var msg_dt = await db_Select(select, table_name, whr, order);
  //   var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
  //     domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
  //   wpMsg = wpMsg
  //     .replace("{user_name}", data.member)
  //     //   .replace("{form_id}", form_no)
  //     .replace("{trn_id}", tnx_id)
  //     .replace("{total}", data.sub_amt)
  //     .replace(
  //       "{url}",
  //       `${domain}/#/admin/money_receipt_member/${data.memb_id}`
  //     );
  //   var wpRes = await sendWappMsg(data.phone_no, wpMsg);
  // } catch (err) {
  //   console.log(err);
  // }
  // END //

  res.send(res_dt);
});

// SubsDepoRouter.post("/user_money_receipt", async (req, res) => {
//   var data = req.body;
//   var select =
//       `a.trn_dt,a.trn_id,a.tot_amt,a.pay_mode,a.receipt_no,a.chq_no,a.chq_dt,a.chq_bank,a.approval_status,IF(b.memb_name != '', b.memb_name, c.memb_name) memb_name, IF(b.member_id != '', b.member_id, c.member_id) member_id, IF(b.mem_type != '', b.mem_type, c.policy_holder_type) mem_type`,
//       // `a.trn_dt,a.trn_id,a.tot_amt,a.pay_mode,a.receipt_no,a.chq_no,a.chq_dt,a.chq_bank,a.approval_status,IF(b.memb_name != '', b.memb_name, c.memb_name) memb_name, IF(b.member_id != '', b.member_id, c.member_id) member_id, IF(b.mem_type != '', b.mem_type, c.memb_type) mem_type`,
//     table_name = "td_transactions a LEFT JOIN md_member b ON a.form_no = b.form_no LEFT JOIN td_gen_ins c ON a.form_no = c.form_no",
//     // whr = ` a.form_no = b.form_no AND b.member_id = '${data.member_id}' AND a.trn_id = '${data.trn_id}'`,
//     // whr = `a.trn_id = '${data.trn_id}' ${data.member_id > 0 ? `AND b.member_id = '${data.member_id}'` : ''}`,
//     // whr = `a.trn_id = '${data.trn_id}' ${data.member_id && data.member_id.trim() !== '' ? `AND b.member_id = '${data.member_id}'` : ''}`,
//      whr = `a.trn_id = '${data.trn_id}'`,
//     // order = `ORDER BY trn_dt, trn_id`;
//     // order = `ORDER BY trn_dt DESC`;
//     order = null;
//   var res_dt = await db_Select(select, table_name, whr, order);
//   console.log(res_dt);
  
//   res.send(res_dt);
// });

SubsDepoRouter.post("/user_money_receipt", async (req, res) => {
  var data = req.body;
  var select =`a.trn_dt,
  a.trn_id,
  a.premium_amt,
  a.tot_amt,
  a.pay_mode,
  a.receipt_no,
  a.chq_no,
  a.chq_dt,
  a.chq_bank,
  a.approval_status,
  d.min_no,

   -- STP Flag(only for STP)
  CASE 
    WHEN LEFT(a.form_no, 3) = 'STP' THEN 'STP'
    ELSE NULL
  END AS flag,

     -- STP premium type(only for STP)
  CASE 
    WHEN LEFT(a.form_no, 3) = 'STP' THEN d.premium_type
    ELSE NULL
  END AS premium_type,

    -- Member Name Logic
  CASE 
    WHEN b.memb_name IS NOT NULL AND b.memb_name != '' THEN b.memb_name
    WHEN LEFT(a.form_no, 3) = 'STP' AND d.memb_name IS NOT NULL THEN d.memb_name
    ELSE c.memb_name
  END AS memb_name,

  -- Member ID Logic
  CASE 
    WHEN b.member_id IS NOT NULL AND b.member_id != '' THEN b.member_id
    WHEN LEFT(a.form_no, 3) = 'STP' AND d.member_id IS NOT NULL THEN d.member_id
    ELSE c.member_id
  END AS member_id,

  -- Member Type Logic
  CASE 
    WHEN b.mem_type IS NOT NULL AND b.mem_type != '' THEN b.mem_type
    WHEN LEFT(a.form_no, 3) = 'STP' AND d.policy_holder_type IS NOT NULL THEN d.policy_holder_type
    ELSE c.policy_holder_type
  END AS mem_type`,
    table_name = "td_transactions a LEFT JOIN md_member b ON a.form_no = b.form_no LEFT JOIN td_gen_ins c ON a.form_no = c.form_no LEFT JOIN td_stp_ins d ON a.form_no = d.form_no",
     whr = `a.trn_id = '${data.trn_id}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  console.log(res_dt);
  
  res.send(res_dt);
});


SubsDepoRouter.post("/subscription_voucher", async (req, res) => {});


SubsDepoRouter.post("/delete_unapprove_trn", async (req, res) => {
  var data = req.body;
  // console.log(data,'juju');
  let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  
  var table_name = "td_transactions",
  fields = `delete_flag = 'Y', deleted_by = '${data.user}', deleted_at = '${datetime}'`,
  values = null,
  whr = `form_no = '${data.form_no}' AND trn_id = '${data.trn_id}'`,
  flag = 1;
  var delete_dt = await db_Insert(table_name, fields, values, whr, flag);
  res.send(delete_dt)
})

module.exports = { SubsDepoRouter };
