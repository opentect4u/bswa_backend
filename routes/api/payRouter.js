const payRouter = require('express').Router()
const CryptoJS = require('crypto-js');
dotenv = require("dotenv");
const { getepayPortal, saveTrns, saveSubs, payRecordSave, saveTrnsGmp } = require('../../modules/payModule');
const { decryptEas } = require('../../controller/decryptEas');
const { getMaxTrnId, db_Insert } = require('../../modules/MasterModule');
const dateFormat = require('dateformat');
dotenv.config({ path: '.env.prod' });


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
        var paySocFlag = data.soc_flag ? data.soc_flag == 'T' ? true : false : false
        tnx_id = paySocFlag ? (data.trn_id > 0 ? data.trn_id : tnx_id) : tnx_id
        console.log(tnx_id, data.trn_id, paySocFlag, data.soc_flag, 'HEHEHEHEHEHEEHEHEHEHEHE');
        
        if (data.memb_name != '' && data.amount > 0) {
            const reqData = {
                mid: paySocFlag ? process.env.PAY_MERCHANT_ID : process.env.ASSO_PAY_PROD_MERCHANT_ID,
                amount: data.amount.toString(),
                merchantTransactionId: tnx_id.toString(),
                transactionDate: new Date().toISOString(),
                terminalId: paySocFlag ? process.env.PAY_TERMINAL_ID : process.env.ASSO_PAY_PROD_TERMINAL_ID,
                udf1: data.phone_no.toString(),
                udf2: data.email_id ? data.email_id : '',
                udf3: data.memb_name,
                udf4: `${data.member_id}||${data.approve_status}||${data.form_no}||${data.trn_id > 0 ? 1 : 0} || ${paySocFlag ? data.pay_flag : 'A'}`,
                udf5: '',
                udf6: '',
                udf7: data.calc_upto,
                udf8: data.subs_type,
                udf9: data.sub_fee.toString(),
                udf10: data.redirect_path,
                ru: paySocFlag ? `${process.env.BASE_URL}/${process.env.UAT_REDIRECT_URL}` : `${process.env.BASE_URL}/${process.env.ASSO_PAY_REDIRECT_URL}`,
                callbackUrl: process.env.PAY_CALL_BACK_URL,
                currency: "INR",
                paymentMode: "ALL",
                bankId: "",
                txnType: "single",
                productType: "IPG",
                txnNote: "Test Txn",
                vpa: paySocFlag ? process.env.PAY_TERMINAL_ID : process.env.ASSO_PAY_PROD_TERMINAL_ID,
            };

            const config = {
                GetepayMid: paySocFlag ? process.env.PAY_MERCHANT_ID : process.env.ASSO_PAY_PROD_MERCHANT_ID,
                GeepayTerminalId: paySocFlag ? process.env.PAY_TERMINAL_ID : process.env.ASSO_PAY_PROD_TERMINAL_ID,
                GetepayKey: paySocFlag ? process.env.PAY_GET_KEY : process.env.ASSO_PAY_PROD_KEY,
                GetepayIV: paySocFlag ? process.env.PAY_GET_IV : process.env.ASSO_PAY_PROD_IV,
                GetepayUrl: paySocFlag ? process.env.PAY_GET_URL : process.env.ASSO_PAY_PROD_GET_URL,
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

payRouter.post('/success_payment_gmp', async (req, res) => {
    const result = req.body.response;
    var dataitems = decryptEas(
        result,
        process.env.PAY_GET_KEY,
        process.env.PAY_GET_IV
    );
    const parsedData = JSON.parse(dataitems);
    console.log("data UAT", parsedData);
    var res_dt = JSON.parse(parsedData)
    var res_load = await payRecordSave(res_dt)
    var data = res_dt.udf4.split('||')
    res_dt.udf4 = data[0]
    res_dt.udf5 = data[1]
    res_dt.udf6 = data[2]
    res_dt['up_flag'] = data[3]
    res_dt['direct_flag'] = data[4]
    if(res_dt.txnStatus == 'SUCCESS'){
        var save_dt = await saveTrnsGmp(res_dt)
        try{
            if(res_dt.direct_flag == 'D'){
          var mem_dt = await db_Insert('td_gen_ins', `form_status = 'A'`, null, `form_no = '${data.formNo}'`, 1);
          res.send(mem_dt)
          console.log('Update result:', mem_dt,data,formNo);
            }
        }catch(err){
            console.log(err);            
        }
        // if(res_dt.udf5 != 'U'){
        //     var sub_res = await saveSubs(res_dt)
        // }
        var redirect_url_client =
          data[0] != ""
            ? `main/money_receipt_member/${data[0]}/${save_dt.trn_id}`
            : `home/money_receipt_member/${save_dt.trn_id}`;

        // console.log(`${process.env.CLIENT_URL}/${redirect_url_client}`);
        res.redirect(`${process.env.CLIENT_URL}/${redirect_url_client}`);
        // res.redirect(`${process.env.CLIENT_URL}/${res_dt.udf10}`)
    }else{
        res.redirect(`${process.env.CLIENT_URL}${res_dt.udf10}`)
    }
    // res.send(parsedData);
})

payRouter.post('/success_payment_asso', async (req, res) => {
    const result = req.body.response;
    var dataitems = decryptEas(
        result,
        process.env.ASSO_PAY_PROD_KEY,
        process.env.ASSO_PAY_PROD_IV
    );
    const parsedData = JSON.parse(dataitems);
    console.log("data", parsedData);
    var res_dt = JSON.parse(parsedData)
    var res_load = await payRecordSave(res_dt)
    var data = res_dt.udf4.split('||')
    res_dt.udf4 = data[0]
    res_dt.udf5 = data[1]
    res_dt.udf6 = data[2]
    if(res_dt.txnStatus == 'SUCCESS'){
        var save_dt = await saveTrns(res_dt);
        if(res_dt.udf5 != 'U'){
            var sub_res = await saveSubs(res_dt)
        }
        var redirect_url_client = data[0] != ''
        ? `main/money_receipt_member/${data[0]}/${save_dt.trn_id}`
        : `home/money_receipt_member/${save_dt.trn_id}`;
        
        // console.log(`${process.env.CLIENT_URL}/${redirect_url_client}`);
        res.redirect(`${process.env.CLIENT_URL}/${redirect_url_client}`);
    }else{
        res.redirect(`${process.env.CLIENT_URL}${res_dt.udf10}`)
    }
    // res.send(parsedData);
})

module.exports = { payRouter }