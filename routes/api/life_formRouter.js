const express = require("express");
const {
  life_form_save,
  spose_depend_form,
  saveDepForm,
  saveFile,
  accept_dt_cash,
  accept_dt_cheque,
  approve_dt,
} = require("../../modules/life_formModule");
const { db_Select } = require("../../modules/MasterModule");
const lifeRouter = express.Router();

lifeRouter.post("/save_life_form", async (req, res) => {
  var data = req.body;
  console.log(data, "ttt");
  var save_life = await life_form_save(data);
  res.send(save_life);
});

lifeRouter.post("/spose_depend_form_save", async (req, res) => {
  var data = req.body;
  var res_dt = await spose_depend_form(data);
  res.send(res_dt);
});

lifeRouter.post("/depend_form_save", async (req, res) => {
  var data = req.body;
  var res_dt = await saveDepForm(data);
  res.send(res_dt);
});

lifeRouter.post("/image_form_save", async (req, res) => {
  var data = req.body;
  var res_dt = await saveFile(
    req.files ? (req.files.own_file ? req.files.own_file : null) : null,
    req.files ? (req.files.spouse_file ? req.files.spouse_file : null) : null,
    data
  );
  res.send(res_dt);
});

lifeRouter.get("/get_member_dtls", async (req, res) => {
  var data = req.query;
  // console.log(data, "ooo");
  var select =
      "a.form_no,a.mem_type,a.memb_name,a.unit_id,a.gurdian_name,a.dob,a.blood_grp,a.staff_nos,a.pers_no,a.min_no,a.memb_address,a.ps,a.phone_no,a.email_id,a.resolution_no,c.adm_fee,c.donation,c.subs_type,c.subscription_1,c.subscription_2,d.unit_name, a.memb_pic",
    table_name = "md_member a, md_member_fees c, md_unit d",
    where = `a.mem_type = c.memb_type
      AND a.unit_id = d.unit_id
      AND a.form_no = '${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, where, order);
  console.log(res_dt, "sss");
  res.send(res_dt);
});

lifeRouter.get("/get_dependent_dtls", async (req, res) => {
  var data = req.query;
  // console.log(data, "ooo");
  var select =
      "member_id,mem_type,dependent_dt,dependent_name,gurdian_name gurd_name,relation, min_no spou_min,dob spou_dob,blood_grp spou_blood_grp,memb_address spou_memb_address,ps spou_ps,phone_no spou_phone,email_id spou_email,memb_pic spou_pic",
    table_name = "md_dependent",
    where = `form_no = '${data.form_no}' AND relation IN (${HUSBAND_ID}, ${WIFE_ID})`,
    order = null;
  var spouse_dt = await db_Select(select, table_name, where, order);

  var dep_dt = await db_Select(
    select,
    table_name,
    `form_no = '${data.form_no}' AND relation NOT IN (${HUSBAND_ID}, ${WIFE_ID})`,
    order
  );

  var res_dt = {
    suc: 1,
    msg: {
      spouse_dt: spouse_dt.suc > 0 ? spouse_dt.msg : [],
      dep_dt: dep_dt.suc > 0 ? dep_dt.msg : [],
    },
  };
  console.log(spouse_dt, "qq");
  res.send(res_dt);
});

lifeRouter.post("/payment_accept_life", async (req, res) => {
  var data = req.body;
  console.log(data, "accept");
  var res_dt = await accept_dt_cash(data);
  res.send(res_dt);
});

lifeRouter.post("/payment_accept_cheque_life", async (req, res) => {
  var data = req.body;
  console.log(data, "accept_cheque");
  var res_dt = await accept_dt_cheque(data);
  res.send(res_dt);
});

lifeRouter.post("/approve_life", async (req, res) => {
  var data = req.body;
  console.log(data, "1111");
  var res_dt = await approve_dt(data);
  res.send(res_dt);
});
module.exports = { lifeRouter };
