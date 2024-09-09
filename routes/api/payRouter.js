const payRouter = require('express').Router()
const CryptoJS = require('crypto-js');
const { getepayPortal, saveTrns, saveSubs, payRecordSave } = require('../../modules/payModule');
const { decryptEas } = require('../../controller/decryptEas');
const { getMaxTrnId } = require('../../modules/MasterModule');
const dateFormat = require('dateformat');

payRouter.post('/generate_pay_url', async (req, res) => {
    var encData = req.body.encData
    const secretKey = process.env.secretKey;
    console.log(secretKey);
    // var rand_no = Math.floor(100000 + Math.random() * 900000)
    // var tnx_id = `BOSEC${rand_no}`
    var tnx_data = await getMaxTrnId();
    let year = dateFormat(new Date(), "yyyy");
    var tnx_id = `${year}${tnx_data.suc > 0 ? tnx_data.msg[0].max_trn_id : 0}`;

    var data = CryptoJS.AES.decrypt(encData, secretKey).toString(CryptoJS.enc.Utf8);
    try {
        data = JSON.parse(data)
        console.log(data);
        if (data.member_id != '' && data.memb_name != '' && data.amount > 0) {
            const reqData = {
                mid: process.env.PAY_MERCHANT_ID,
                amount: data.amount.toString(),
                merchantTransactionId: tnx_id.toString(),
                transactionDate: new Date().toISOString(),
                terminalId: process.env.PAY_TERMINAL_ID,
                udf1: data.phone_no,
                udf2: data.email_id,
                udf3: data.memb_name,
                udf4: data.member_id,
                udf5: data.approve_status,
                udf6: data.form_no,
                udf7: data.calc_upto,
                udf8: data.subs_type,
                udf9: data.sub_fee,
                udf10: data.redirect_path,
                ru: `${process.env.BASE_URL}/success_payment`,
                callbackUrl: process.env.PAY_CALL_BACK_URL,
                currency: "INR",
                paymentMode: "ALL",
                bankId: "",
                txnType: "single",
                productType: "IPG",
                txnNote: "Test Txn",
                vpa: process.env.PAY_VPA,
            };

            const config = {
                GetepayMid: 108,
                GeepayTerminalId: process.env.PAY_VPA,
                GetepayKey: process.env.PAY_GET_KEY,
                GetepayIV: process.env.PAY_GET_IV,
                GetepayUrl: process.env.PAY_GET_URL,
            };
            getepayPortal(reqData, config)
                .then((paymentUrl) => {
                    console.log(paymentUrl, "Payment URL");
                    res.send({
                        suc: 1,
                        msg: "URL generated successfully.",
                        pay_url: paymentUrl
                    });
                })
                .catch((error) => {
                    console.error("Error:", error);
                    res.send({suc: 0, msg: error});
                });
        }
    } catch (err) {
        console.log(err);
        res.send({ suc: 0, msg: err })
    }
})

payRouter.post('/success_payment', async (req, res) => {
    const result = req.body.response;
    var dataitems = decryptEas(
        result,
        process.env.PAY_GET_KEY,
        process.env.PAY_GET_IV
    );
    const parsedData = JSON.parse(dataitems);
    console.log("data", parsedData);
    var res_dt = JSON.parse(parsedData)
    var res_load = await payRecordSave(res_dt)
    if(res_dt.txnStatus == 'SUCCESS'){
        var save_dt = await saveTrns(res_dt)
        if(data.udf5 != 'U'){
            var sub_res = await saveSubs(res_dt)
        }
        res.redirect(`${process.env.CLIENT_URL}/main/money_receipt_member/${res_dt.udf4}/${save_dt.trn_id}`)
    }else{
        res.redirect(`${process.env.CLIENT_URL}${res_dt.udf10}`)
    }
    // res.send(parsedData);
})

module.exports = { payRouter }