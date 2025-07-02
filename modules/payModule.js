const {encryptEas} = require('../controller/encryptEas')
const {decryptEas} = require('../controller/decryptEas')
const fetch = require('node-fetch');
const dateFormat = require('dateformat');
const { db_Insert, getMaxTrnId, generateNextSubDate, postVoucher, getCurrFinYear,
  FIN_YEAR_MASTER,
  BRANCH_MASTER,
  TRANSFER_TYPE_MASTER,
  VOUCHER_MODE_MASTER,
  CR_ACC_MASTER,
  db_Select,
  drVoucher_stp, } = require('./MasterModule');
module.exports = {
  getepayPortal: (data, config) => {
    return new Promise((resolve, reject) => {
      const JsonData = JSON.stringify(data);
      var ciphertext = encryptEas(
        JsonData,
        config["GetepayKey"],
        config["GetepayIV"]
      );
      var newCipher = ciphertext.toUpperCase();
      var myHeaders = {
        "Content-Type": "application/json",
      };
      var raw = JSON.stringify({
        mid: data.mid,
        terminalId: data.terminalId,
        req: newCipher,
      });
      var requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      console.log(data, config, "config");

      fetch(config["GetepayUrl"], requestOptions)
        .then((response) => response.text())
        .then((result) => {
          var resultobj = JSON.parse(result);
          console.log(resultobj, "Result");

          var responseurl = resultobj.response;
          var dataitem = decryptEas(
            responseurl,
            config["GetepayKey"],
            config["GetepayIV"]
          );
          const parsedData = JSON.parse(dataitem);
          const paymentUrl = parsedData.paymentUrl;
          resolve(paymentUrl);
        })
        .catch((error) => {
          console.log(error);
          reject(error);
        });
    });
  },
  saveTrns: (data) => {
    return new Promise(async (resolve, reject) => {
      const trn_dt = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      var table_name = "td_transactions",
        fields =
          "(form_no, trn_dt, trn_id, sub_amt, onetime_amt, adm_fee, donation, premium_amt, tot_amt, pay_mode, receipt_no, chq_no, chq_dt, chq_bank, approval_status, created_by, created_at)",
        values = `('${data.udf6}', '${trn_dt}', '${data.merchantOrderNo}', '${data.txnAmount}', 0, 0, 0, 0, ${data.txnAmount}, 'O', '${data.getepayTxnId}', NULL, NULL, 75, '${data.udf5}', '${data.udf3}', '${trn_dt}')`,
        whr = null,
        flag = 0;
      var res_dt = await db_Insert(table_name, fields, values, whr, flag);
      res_dt["trn_id"] = data.merchantOrderNo;
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
      resolve(res_dt);
    });
  },
  saveTrnsGmp: (data) => {
    return new Promise(async (resolve, reject) => {
      const trn_dt = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

      var table_name = "td_transactions",
        fields =
          data.up_flag > 0
            ? `trn_dt = '${trn_dt}',premium_amt = '${data.txnAmount}', tot_amt = '${data.txnAmount}', pay_mode = 'O',receipt_no = '${data.getepayTxnId}',chq_bank = '16', approval_status='${data.udf5}',modified_by = '${data.udf3}',modified_at = '${trn_dt}'`
            : `(form_no,trn_dt,trn_id,premium_amt,tot_amt,pay_mode,receipt_no,chq_no,chq_dt,chq_bank,approval_status,created_by,created_at)`,
        values = `('${data.udf6}','${trn_dt}','${data.merchantOrderNo}','${data.txnAmount}','${data.txnAmount}','O','${data.getepayTxnId}',NULL,NULL,16,'${data.udf5}','${data.udf3}','${trn_dt}')`,
        where = data.up_flag > 0 ? `trn_id = ${data.merchantOrderNo}` : null,
        flag = data.up_flag > 0 ? 1 : 0;
      var trn_data = await db_Insert(table_name, fields, values, where, flag);
      trn_data["trn_id"] = data.merchantOrderNo;
      resolve(trn_data);
    });
  },

   saveTrnsGmps: (data) => {
    console.log(data,'online_stp');

    return new Promise(async (resolve, reject) => {
       var sub_upto = await generateNextSubDate(
        data.udf7,
        data.udf8,
        data.txnAmount,
        data.udf9
      );
      var trn_dt = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      var finres = await getCurrFinYear();
      var curr_fin_year = finres.curr_fin_year;

      var flag_dt = await db_Select('flag', 'td_child_policy', `member_id = '${data.udf6}'`, 'LIMIT 1')
      const flag_dtls = flag_dt.suc > 0 ? (flag_dt.msg.length > 0 ? flag_dt.msg[0].flag : '') : '';


      // const cr_acc_code = flag_dtls === 'CP' ? 106 : 107;
      const cr_acc_code = flag_dtls === 'CP' ? CR_ACC_MASTER.Children_Policy_Payable : CR_ACC_MASTER.Super_topup_policy_payable;

      var voucher_res = await drVoucher_stp(
        FIN_YEAR_MASTER[curr_fin_year],
        curr_fin_year,
        2,
        BRANCH_MASTER[1],
        data.getepayTxnId,
        dateFormat(new Date(trn_dt), "yyyy-mm-dd"),
        TRANSFER_TYPE_MASTER['O'],
        VOUCHER_MODE_MASTER['O'],
        75,
        // CR_ACC_MASTER[mem_type],
        CR_ACC_MASTER[cr_acc_code],
        "DR",
        data.txnAmount,
        data.chq_no ? data.chq_no : "",
        data.chq_dt > 0 ? dateFormat(new Date(data.chq_dt), "yyyy-mm-dd") : "",
        // data.paymentStatus,
        `Being subscription received from Member No ${data.udf6}`,
        data.udf5,
        data.udf3,
        dateFormat(new Date(trn_dt), "yyyy-mm-dd"),
        data.udf3,
        dateFormat(new Date(trn_dt), "yyyy-mm-dd")
      );

      console.log(voucher_res, 'Res in transaction');

       if (voucher_res.suc > 0) {
        if (voucher_res.msg > 0) {

      var table_name = "td_transactions",
        fields =
          data.up_flag > 0
            ? `trn_dt = '${trn_dt}',premium_amt = '${data.txnAmount}', tot_amt = '${data.txnAmount}', pay_mode = 'O',receipt_no = '${data.getepayTxnId}',chq_bank = '16', approval_status='${data.udf5}',modified_by = '${data.udf3}',modified_at = '${trn_dt}'`
            : `(form_no,trn_dt,trn_id,premium_amt,tot_amt,pay_mode,receipt_no,chq_no,chq_dt,chq_bank,approval_status,created_by,created_at)`,
        values = `('${data.udf6}','${trn_dt}','${data.merchantOrderNo}','${data.txnAmount}','${data.txnAmount}','O','${data.getepayTxnId}',NULL,NULL,16,'${data.udf5}','${data.udf3}','${trn_dt}')`,
        where = data.up_flag > 0 ? `trn_id = ${data.merchantOrderNo}` : null,
        flag = data.up_flag > 0 ? 1 : 0;
      var trn_data = await db_Insert(table_name, fields, values, where, flag);
      trn_data["trn_id"] = data.merchantOrderNo;
      resolve(trn_data);
       } else {
          resolve({ suc: 0, msg: "Voucher Not Saved" });
        }
      } else {
        resolve(voucher_res);
      }

    });
  },


  saveSubs: (data) => {
    console.log(data,'online');
    
    return new Promise(async (resolve, reject) => {
      var sub_upto = await generateNextSubDate(
        data.udf7,
        data.udf8,
        data.txnAmount,
        data.udf9
      );
      var trn_dt = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      var finres = await getCurrFinYear();
      var curr_fin_year = finres.curr_fin_year;

      var memberDt = await db_Select('mem_type', 'md_member', `form_no = '${data.udf6}'`, 'LIMIT 1')
      const mem_type = memberDt.suc > 0 ? (memberDt.msg.length > 0 ? memberDt.msg[0].mem_type : '') : '';

      var voucher_res = await postVoucher(
        FIN_YEAR_MASTER[curr_fin_year],
        curr_fin_year,
        2,
        BRANCH_MASTER[2],
        data.getepayTxnId,
        dateFormat(new Date(trn_dt), "yyyy-mm-dd"),
        // TRANSFER_TYPE_MASTER[data.pay_mode],
        TRANSFER_TYPE_MASTER['O'],
        // VOUCHER_MODE_MASTER[data.pay_mode],
        VOUCHER_MODE_MASTER['O'],
        75,
        CR_ACC_MASTER[mem_type],
        "DR",
        data.txnAmount,
        data.chq_no ? data.chq_no : "",
        data.chq_dt > 0 ? dateFormat(new Date(data.chq_dt), "yyyy-mm-dd") : "",
        // data.paymentStatus,
        `Being subscription received from Member No ${data.udf6}`,
        data.udf5,
        data.udf3,
        dateFormat(new Date(trn_dt), "yyyy-mm-dd"),
        data.udf3,
        dateFormat(new Date(trn_dt), "yyyy-mm-dd")
      );

      console.log(voucher_res, 'Res in transaction');
      

      // var voucher_res = { suc: 1, msg: 1 };

      if (voucher_res.suc > 0) {
        if (voucher_res.msg > 0) {
          var table_name = "td_memb_subscription",
            fields =
              "(member_id, sub_dt, amount, subscription_upto, calc_amt, calc_upto, trans_id, created_by, created_at)",
            values = `('${data.udf4}', '${trn_dt}', '${
              data.txnAmount
            }', '${dateFormat(
              sub_upto,
              "yyyy-mm-dd HH:MM:ss"
            )}', 0, '${dateFormat(sub_upto, "yyyy-mm-dd HH:MM:ss")}', '${
              data.merchantOrderNo
            }', '${data.udf3}', '${trn_dt}')`,
            whr = null,
            flag = 0;
          var res_dt = await db_Insert(table_name, fields, values, whr, flag);

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

          resolve(res_dt);
        } else {
          resolve({ suc: 0, msg: "Voucher Not Saved" });
        }
      } else {
        resolve(voucher_res);
      }
    });
  },
  saveSubsGmp: (data) => {
    return new Promise(async (resolve, reject) => {
      var sub_upto = await generateNextSubDate(
        data.udf7,
        data.udf8,
        data.txnAmount,
        data.udf9
      );
      var trn_dt = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      var finres = await getCurrFinYear();
      var curr_fin_year = finres.curr_fin_year;

      // var voucher_res = await postVoucher(
      //   FIN_YEAR_MASTER[curr_fin_year],
      //   curr_fin_year,
      //   2,
      //   BRANCH_MASTER[2],
      //   data.trn_id,
      //   dateFormat(new Date(trn_dt), "yyyy-mm-dd"),
      //   TRANSFER_TYPE_MASTER[data.pay_mode],
      //   VOUCHER_MODE_MASTER[data.pay_mode],
      //   data.acc_code,
      //   CR_ACC_MASTER[data.memb_type],
      //   "DR",
      //   data.sub_amt,
      //   data.chq_no,
      //   data.chq_dt > 0 ? dateFormat(new Date(data.chq_dt), "yyyy-mm-dd") : "",
      //   data.remarks,
      //   "A",
      //   data.user,
      //   dateFormat(new Date(trn_dt), "yyyy-mm-dd"),
      //   data.user,
      //   dateFormat(new Date(trn_dt), "yyyy-mm-dd")
      // );

      var voucher_res = { suc: 1, msg: 1 };

      if (voucher_res.suc > 0) {
        if (voucher_res.msg > 0) {
          var table_name = "td_memb_subscription",
            fields =
              "(member_id, sub_dt, amount, subscription_upto, calc_amt, calc_upto, trans_id, created_by, created_at)",
            values = `('${data.udf4}', '${trn_dt}', '${
              data.txnAmount
            }', '${dateFormat(
              sub_upto,
              "yyyy-mm-dd HH:MM:ss"
            )}', 0, '${dateFormat(sub_upto, "yyyy-mm-dd HH:MM:ss")}', '${
              data.merchantOrderNo
            }', '${data.udf3}', '${trn_dt}')`,
            whr = null,
            flag = 0;
          var res_dt = await db_Insert(table_name, fields, values, whr, flag);

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

          resolve(res_dt);
        } else {
          resolve({ suc: 0, msg: "Voucher Not Saved" });
        }
      } else {
        resolve(voucher_res);
      }
    });
  },
  // payRecordSave: (data) => {
  //   return new Promise(async (resolve, reject) => {
  //     let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  //     var table_name = "td_pg_transaction",
  //       fields =
  //         "(entry_dt, pay_trns_id, mid, trns_amt, trns_status, mer_order_no, udf1, udf2, udf3, udf4, udf5, udf6, udf7, udf8, udf9, udf10, udf41, cust_ref_no, pay_mode, discriminator, message, paymentStatus, txnDate, surcharge, totalAmount, settlementAmount, settlementRefNo, settlementDate, settlementStatus, txnNote)",
  //       values = `('${datetime}', '${data.getepayTxnId}', '${data.mid}', '${data.txnAmount}', '${data.txnStatus}', '${data.merchantOrderNo}', '${data.udf1}', '${data.udf2}', '${data.udf3}', '${data.udf4}', '${data.udf5}', '${data.udf6}', '${data.udf7}', '${data.udf8}', '${data.udf9}', '${data.udf10}', '${data.udf41}', '${data.custRefNo}', '${data.paymentMode}', '${data.discriminator}', '${data.message}', '${data.paymentStatus}', '${data.txnDate}', '${data.surcharge}', '${data.totalAmount}', '${data.settlementAmount}', '${data.settlementRefNo}', '${data.settlementDate}', '${data.settlementStatus}', '${data.txnNote}')`,
  //       whr = null,
  //       flag = 0;
  //     var res_dt = await db_Insert(table_name, fields, values, whr, flag);
  //     resolve(res_dt);
  //   });
  // },

  payRecordSave: (data) => {
    console.log(data);
    
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      var table_name = "td_pg_transaction",
        fields =
          "(entry_dt, pay_trns_id, mid, trns_amt, trns_status, mer_order_no, udf1, udf2, udf3, udf4, udf5, udf6, udf7, udf8, udf9, udf10, udf41, cust_ref_no, pay_mode, discriminator, message, paymentStatus, txnDate, surcharge, totalAmount, settlementAmount, settlementRefNo, settlementDate, settlementStatus, txnNote)",
        values = `('${datetime}', '${data.getepayTxnId}', '${data.mid}', '${data.txnAmount}', '${data.txnStatus}', '${data.merchantOrderNo}', '${data.udf1}', '${data.udf2}', '${data.udf3}', '${data.udf4}', '${data.udf5}', '${data.udf6}', '${data.udf7}', '${data.udf8}', '${data.udf9}', '${data.udf10}', '${data.udf41}', '${data.custRefNo}', '${data.paymentMode}', '${data.discriminator}', '${data.message}', '${data.paymentStatus}', '${data.txnDate}', '${data.surcharge}', '${data.totalAmount}', '${data.settlementAmount > 0 ? data.settlementAmount : 0}', '${data.settlementRefNo != '' ? data.settlementRefNo : 0}', ${data.settlementDate != '' ? `'${data.settlementDate}'` : null}, '${data.settlementStatus}', '${data.txnNote}')`,
        whr = null,
        flag = 0;
      var res_dt = await db_Insert(table_name, fields, values, whr, flag);
      console.log(res_dt,'res');
      resolve(res_dt);
      console.log(res_dt,'res');
      
    });
  }

};