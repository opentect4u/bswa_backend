const cronRouter = require('express').Router()
const { sendWappMediaMsg } = require('../modules/whatsappModule');
const {db_Select} = require('../modules/MasterModule')

cronRouter.get('/subscription_cron_notification', async (req, res) => {
    var res_dt = await db_Select('a.member_id, a.amount, a.calc_amt, a.calc_upto, c.memb_name, c.phone_no, c.form_no', 'td_memb_subscription a, md_member c', `a.member_id=c.member_id AND date(a.calc_upto) = (SELECT MAX(date(b.calc_upto)) FROM td_memb_subscription b WHERE a.member_id=b.member_id AND b.calc_upto = date(now()))`, null)
    if(res_dt.suc > 0){
        if(res_dt.msg.length > 0){
            for(let dt of res_dt.msg){
                try {
                    var select = "msg, domain",
                      table_name = "md_whatsapp_msg",
                      whr = `msg_for = 'Subscription End'`,
                      order = null;
                    var msg_dt = await db_Select(select, table_name, whr, order);
                    var wpMsg = msg_dt.suc > 0 ? msg_dt.msg[0].msg : "",
                      domain = msg_dt.suc > 0 ? msg_dt.msg[0].domain : "";
                    wpMsg = wpMsg
                      .replace("{user_name}", dt.memb_name)
                      .replace("{form_no}", dt.form_no);
                    var wpRes = await sendWappMediaMsg(dt.phone_no, wpMsg, domain, 'BOKAROWELFARE.jpg');
                    console.log(wpRes);
                    res.send({suc: 1, msg: wpRes})
                } catch (err) {
                    console.log(err);
                    res.send({suc: 0, msg: err})
                }
            }
        }else{
            res.send({suc: 0, msg: 'No data found'})
        }
    }else{
        res.send(res_dt)
    }
})

module.exports = {cronRouter}