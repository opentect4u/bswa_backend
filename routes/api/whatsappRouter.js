const express = require('express');
const { db_Select } = require('../../modules/MasterModule');
const { sendWappMsg } = require('../../modules/whatsappModule');
const whatsappRouter = express.Router();

whatsappRouter.get('/send_whatsapp_member', async (req, res) => {
    var data = req.query;
    
    var select = "a.member_id, c.member_id, c.memb_name, c.phone_no, a.amount, a.calc_amt",
    table_name = "td_memb_subscription a, md_member c",
    whr = `a.member_id =c.member_id 
    AND c.phone_no IS NOT NULL AND c.phone_no != '' AND a.member_id NOT LIKE "AI%" 
    AND (SELECT MAX(DATE(b.subscription_upto)) FROM td_memb_subscription b WHERE a.member_id = b.member_id) <= DATE(NOW())`,
    order = null;
    var res_dt = await db_Select(select,table_name,whr,order);
    var wpRes_dt = {}
    if(res_dt.suc > 0){
        if(res_dt.msg.length > 0){
            var select = "msg",
                table_name = "md_whatsapp_msg",
                whr = `msg_for = 'Subscription End'`,
                order = null;
            var msg_dt = await db_Select(select, table_name, whr, order);
            var msg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : ""
            for(let dt of res_dt.msg){
                try{
                    var wpMsg = msg.replace("{user_name}", dt.memb_name).replace("{form_no}", dt.member_id)
                    
                    // Send the WhatsApp message
                    wpRes_dt = await sendWappMsg(dt.phone_no, wpMsg);
                    // console.log(wpRes_dt);
                    // res.send({ suc: 1, msg: wpRes_dt });
                } catch (err) {
                    console.log(err);
                    // res.send({ suc: 0, msg: err });
                    wpRes_dt = { suc: 0, msg: err }
                }
            }
            res.send(wpRes_dt)

        }else {
            res.send({ suc: 0, msg: 'No data found' });
        }
    }else {
        res.send(res_dt);
    }
});

module.exports = {whatsappRouter}