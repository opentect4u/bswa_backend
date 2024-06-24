const Joi = require("joi");
const dateFormat = require("dateformat");
const { db_Insert, db_Select } = require("./MasterModule");

const save_general = async (req, res) => {
  try {
    const schema = Joi.object({
      member: Joi.optional(),
      effect_dt: Joi.optional(),
      admissionFee: Joi.optional(),
      donationFee: Joi.optional(),
      subscriptionFee: Joi.optional(),
      subscriptionType: Joi.optional(),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    // console.log(value, "uu");
    if (error) {
      const errors = {};
      error.details.forEach((detail) => {
        errors[detail.context.key] = detail.message;
      });
      return res.json({ suc: 0, msg: errors });
    }
    var user_name = req.user.user_name;
    const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

    var select = "memb_type",
    table_name = "md_member_fees",
    whr = `memb_type = 'G'`,
    order = null;
    var chk_dt = await db_Select(select, table_name, whr, order);


    let fields = chk_dt.suc > 0 && chk_dt.msg.length > 0 ? `effective_dt='${value.effect_dt}',adm_fee='${value.admissionFee}',donation='${value.donationFee}',subs_type='${value.subscriptionType}',subscription_1='${value.subscriptionFee}',modified_by='${user_name}',modified_at='${datetime}'`
       : "(effective_dt,memb_type,adm_fee,donation,subs_type,subscription_1,subscription_2,created_by,created_at)",
      values = `('${value.effect_dt}','G','${value.admissionFee}','${value.donationFee}','${value.subscriptionType}','${value.subscriptionFee}','0','${user_name}','${datetime}')`;
      whr = chk_dt.suc > 0 && chk_dt.msg.length > 0 ? `memb_type='G'` : null;
      flag = chk_dt.suc > 0 && chk_dt.msg.length > 0 ? 1 : 0;
      var res_dt = await db_Insert("md_member_fees", fields, values, whr, flag);

    // console.log("========genmember==========", res_dt);

    res.send(res_dt);
  } catch (error) {
    console.log(error);
    res.send({ suc: 0, msg: error });
  }
};

const save_life = async (req, res) => {
  try {
    const schema = Joi.object({
      effect_date: Joi.optional(),
      sub_fee_2: Joi.optional(),
      sub_fee: Joi.optional(),
      // subs_type: Joi.optional(),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    // console.log(value, "uu");
    if (error) {
      const errors = {};
      error.details.forEach((detail) => {
        errors[detail.context.key] = detail.message;
      });
      return res.json({ suc: 0, msg: errors });
    }
    var user_name = req.user.user_name;
    const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

    var select = "memb_type",
    table_name = "md_member_fees",
    whr = `memb_type = 'L'`,
    order = null;
    var chk_dt = await db_Select(select, table_name, whr, order);

    let fields = chk_dt.suc > 0 && chk_dt.msg.length > 0 ? `effective_dt='${value.effect_date}',subscription_1='${value.sub_fee}', subscription_2='${value.sub_fee_2}',modified_by='${user_name}',modified_at='${datetime}'`
        : "(effective_dt,memb_type,adm_fee,donation,subs_type,subscription_1,subscription_2,created_by,created_at)",
      values = `('${value.effect_date}','L','0','0','Y','${value.sub_fee}','${value.sub_fee_2}','${user_name}','${datetime}')`;
      whr = chk_dt.suc > 0 && chk_dt.msg.length > 0 ? `memb_type='L'` : null;
      flag = chk_dt.suc > 0 && chk_dt.msg.length > 0 ? 1 : 0;
    var res_dt = await db_Insert("md_member_fees", fields, values, whr, flag);

    // console.log("========lifemember==========", res_dt);

    res.send(res_dt);
  } catch (error) {
    console.log(error);
    res.send({ suc: 0, msg: error });
  }
};

const save_asso = async (req, res) => {
  try {
    const schema = Joi.object({
      eff_dt: Joi.optional(),
      subs_fee_1: Joi.optional(),
      ad_fee: Joi.optional(),
      // subs_ty: Joi.optional(),
    });
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    console.log(value, "value");
    if (error) {
      const errors = {};
      error.details.forEach((detail) => {
        errors[detail.context.key] = detail.message;
      });
      return res.json({ suc: 0, msg: errors });
    }
    var user_name = req.user.user_name;
    const datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

    var select = "memb_type",
    table_name = "md_member_fees",
    whr = `memb_type = 'AI'`,
    order = null;
  var chk_dt = await db_Select(select, table_name, whr, order);

    let fields = chk_dt.suc > 0 && chk_dt.msg.length > 0 ? `effective_dt='${value.eff_dt}',adm_fee='${value.ad_fee}',subscription_1='${value.subs_fee_1}',modified_by='${user_name}',modified_at='${datetime}'`
        : "(effective_dt,memb_type,adm_fee,donation,subs_type,subscription_1,subscription_2,created_by,created_at)",
      values = `('${value.eff_dt}','AI','${value.ad_fee}','0','O','${value.subs_fee_1}','0','${user_name}','${datetime}')`;
      whr = chk_dt.suc > 0 && chk_dt.msg.length > 0 ? `memb_type = 'AI'` : null,
      flag = chk_dt.suc > 0 && chk_dt.msg.length > 0 ? 1 : 0;
      var res_dt = await db_Insert("md_member_fees", fields, values, whr, flag);

    // console.log("========lifemember==========", res_dt);

    res.send(res_dt);
  } catch (error) {
    console.log(error);
    res.send({ suc: 0, msg: error });
  }
};

const show_data = async (req, res) => {
  const schema = Joi.object({
    flag: Joi.optional()
  });
  const { error, value } = schema.validate(req.query, { abortEarly: false });
  console.log(value, "uu");
  if (error) {
    const errors = {};
    error.details.forEach((detail) => {
      errors[detail.context.key] = detail.message;
    });
    return res.json({ suc: 0, msg: errors });
  }
  let select = "*",
    table_name = "md_member_fees",
    whr = value.flag ? `memb_type = '${value.flag}'` : null;
  const save_dt = await db_Select(select, table_name, whr, null);
  console.log(save_dt,'111');
  res.send(save_dt);
};

module.exports = { save_general, save_life, save_asso,show_data };
