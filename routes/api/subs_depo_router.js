const SubsDepoRouter = require('express').Router()
const {db_Select, db_Insert, getMaxTrnId} = require('../../modules/MasterModule')
const dateFormat = require('dateformat')

SubsDepoRouter.post('/get_mem_subs_dtls', async (req, res) => {
    const data = req.body
    var select = 'a.member_id, a.form_no, a.memb_name, a.mem_type, a.memb_oprn, a.phone_no, a.email_id, (SELECT MAX(DATE(subscription_upto)) FROM td_memb_subscription b WHERE a.member_id=b.member_id) subscription_upto',
    table_name = 'md_member a',
    whr = `a.member_id = '${data.memb_id}'`,
    order = null;
    var res_dt = await db_Select(select, table_name, whr, order)
    res.send(res_dt)
})

SubsDepoRouter.post('/get_tnx_details', async (req, res) => {
    const data = req.body
    var select = '*',
    table_name = 'td_transactions',
    whr = `approval_status = 'U' ${data.trn_id > 0 ? `AND trn_id = ${data.trn_id}` : ''}`,
    order = `ORDER BY trn_dt, trn_id`;
    var res_dt = await db_Select(select, table_name, whr, order)
    res.send(res_dt)
})

SubsDepoRouter.post('/mem_subs_dtls_save', async (req, res) => {
    const data = req.body,
    trn_dt = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')
    var tot_tenure = data.sub_fee > 0 ? data.sub_amt / data.sub_fee : 0;
    var sub_upto = new Date(trn_dt);
    sub_upto.setMonth(sub_upto.getMonth() + tot_tenure);
    var table_name = 'td_memb_subscription',
    fields = '(member_id, sub_dt, amount, subscription_upto, created_by, created_at)',
    values = `('${data.memb_id}', '${trn_dt}', '${data.sub_amt}', '${dateFormat(sub_upto, "yyyy-mm-dd HH:MM:ss")}', '${data.user}', '${trn_dt}')`,
    whr = null,
    flag = 0;
    var res_dt = await db_Insert(table_name, fields, values, whr, flag)
    res.send(res_dt)
})

SubsDepoRouter.post('/mem_sub_tnx_save', async (req, res) => {
    const data = req.body,
    trn_dt = dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss')
    var tnx_data = await getMaxTrnId()
    let year = dateFormat(new Date(), "yyyy");
    var tnx_id = `${year}${tnx_data.suc > 0 ? tnx_data.msg[0].max_trn_id : 0}`
    var table_name = 'td_transactions',
    fields = '(form_no, trn_dt, trn_id, sub_amt, onetime_amt, adm_fee, donation, premium_amt, tot_amt, pay_mode, receipt_no, chq_no, chq_dt, chq_bank, approval_status, created_by, created_at)',
    values = `('${data.form_no}', '${trn_dt}', '${tnx_id}', '${data.sub_amt}', 0, 0, 0, 0, ${data.sub_amt}, '${data.pay_mode}', '${data.receipt_no}', '${data.chq_no}', '${data.chq_dt}', '${data.chq_bank}', '${data.approval_status}', '${data.user}', '${trn_dt}')`,
    whr = null,
    flag = 0;
    var res_dt = await db_Insert(table_name, fields, values, whr, flag)
    res.send(res_dt)
})

module.exports = {SubsDepoRouter}