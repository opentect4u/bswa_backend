const SubsDepoRouter = require("express").Router();
const {
  db_Select,
  db_Insert,
  getMaxTrnId,
} = require("../../modules/MasterModule");
const dateFormat = require("dateformat");
const { sendWappMsg } = require("../../modules/whatsappModule");

SubsDepoRouter.post("/get_mem_subs_dtls", async (req, res) => {
  const data = req.body;
  var select =
      "a.member_id, a.form_no, a.memb_name, a.mem_type, a.memb_oprn, a.phone_no, a.email_id, DATE(b.subscription_upto) subscription_upto, b.calc_amt, b.calc_upto",
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
    whr = `approval_status = 'U' ${
      data.trn_id > 0 ? `AND trn_id = ${data.trn_id}` : ""
    }`,
    order = `ORDER BY trn_dt, trn_id`;
  var res_dt = await db_Select(select, table_name, whr, order);
  if (res_dt.suc > 0 && data.trn_id > 0) {
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
        mem_dt.suc > 0 ? mem_dt.msg[0]?.mem_type : ""
      }' AND a.effective_dt = (SELECT MAX(b.effective_dt) FROM md_member_fees b WHERE a.memb_type=b.memb_type AND b.effective_dt <= now())`,
      order = null;
    var fee_dt = await db_Select(select, table_name, whr, order);

    console.log(fee_dt);

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
  switch (data.sub_type) {
    case "Y":
      sub_upto.setFullYear(sub_upto.getFullYear() + 1);
      break;
    case "O":
      sub_upto.setFullYear(sub_upto.getFullYear() + 1);
      break;
    case "M":
      var tot_tenure =
        data.sub_fee > 0 ? data.paid_month_amt / data.sub_fee : 0;
      sub_upto.setMonth(sub_upto.getMonth() + tot_tenure);
      break;

    default:
      var tot_tenure =
        data.sub_fee > 0 ? data.paid_month_amt / data.sub_fee : 0;
      sub_upto.setMonth(sub_upto.getMonth() + tot_tenure);
      break;
  }

  var table_name = "td_memb_subscription",
    fields =
      "(member_id, sub_dt, amount, subscription_upto, calc_amt, calc_upto, trans_id, created_by, created_at)",
    values = `('${data.memb_id}', '${trn_dt}', '${data.sub_amt}', '${dateFormat(
      sub_upto,
      "yyyy-mm-dd HH:MM:ss"
    )}', 0, '${dateFormat(sub_upto, "yyyy-mm-dd HH:MM:ss")}', '${
      data.trn_id
    }', '${data.user}', '${trn_dt}')`,
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
  res.send(res_dt);
});

SubsDepoRouter.post("/mem_sub_tnx_save", async (req, res) => {
  const data = req.body,
    trn_dt = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var tnx_data = await getMaxTrnId();
  let year = dateFormat(new Date(), "yyyy");
  var tnx_id = `${year}${tnx_data.suc > 0 ? tnx_data.msg[0].max_trn_id : 0}`;
  var table_name = "td_transactions",
    fields =
      "(form_no, trn_dt, trn_id, sub_amt, onetime_amt, adm_fee, donation, premium_amt, tot_amt, pay_mode, receipt_no, chq_no, chq_dt, chq_bank, approval_status, created_by, created_at)",
    values = `('${data.form_no}', '${trn_dt}', '${tnx_id}', '${data.sub_amt}', 0, 0, 0, 0, ${data.sub_amt}, '${data.pay_mode}', '${data.receipt_no}', '${data.chq_no}', '${data.chq_dt}', '${data.chq_bank}', '${data.approval_status}', '${data.user}', '${trn_dt}')`,
    whr = null,
    flag = 0;
  var res_dt = await db_Insert(table_name, fields, values, whr, flag);

  // WHATSAPP MESSAGE //
  try {
    var select = "msg, domain",
      table_name = "md_whatsapp_msg",
      whr = `msg_for = 'Approve transaction'`,
      order = null;
    var msg_dt = await db_Select(select, table_name, whr, order);
    var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
      domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
    wpMsg = wpMsg
      .replace("{user_name}", data.member)
      //   .replace("{form_id}", form_no)
      .replace("{trn_id}", tnx_id)
      .replace("{total}", data.sub_amt)
      .replace("{url}", `${domain}/#/admin/money_receipt/${data.memb_id}`);
    var wpRes = await sendWappMsg(data.phone_no, wpMsg);
  } catch (err) {
    console.log(err);
  }
  // END //

  res.send(res_dt);
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

  // WHATSAPP MESSAGE //
  try {
    var select = "msg, domain",
      table_name = "md_whatsapp_msg",
      whr = `msg_for = 'Approve transaction'`,
      order = null;
    var msg_dt = await db_Select(select, table_name, whr, order);
    var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
      domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
    wpMsg = wpMsg
      .replace("{user_name}", data.member)
      //   .replace("{form_id}", form_no)
      .replace("{trn_id}", tnx_id)
      .replace("{total}", data.sub_amt)
      .replace(
        "{url}",
        `${domain}/#/admin/money_receipt_member/${data.memb_id}`
      );
    var wpRes = await sendWappMsg(data.phone_no, wpMsg);
  } catch (err) {
    console.log(err);
  }
  // END //

  res.send(res_dt);
});

SubsDepoRouter.post("/user_money_receipt", async (req, res) => {
  var data = req.body;
  var select =
      "a.trn_dt,a.trn_id,a.tot_amt,a.pay_mode,a.receipt_no,a.chq_no,a.chq_dt,a.chq_bank,a.approval_status,b.memb_name,b.member_id",
    table_name = "td_transactions a, md_member b",
    whr = ` a.form_no = b.form_no AND b.member_id = '${data.member_id}'`,
    // order = `ORDER BY trn_dt, trn_id`;
    // order = `ORDER BY trn_dt DESC`;
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt);
});

module.exports = { SubsDepoRouter };
