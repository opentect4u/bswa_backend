const express = require("express");
const dateFormat = require("dateformat");
const {
  general_form_save,
  spose_depend_form_save,
  saveDepForm,
  saveFile,
  reject_dt,
  accept_dt,
  accept_dt_cash,
  accept_dt_cheque,
  approve_dt,
} = require("../../modules/general_formModule");
const {
  db_Select,
  HUSBAND_ID,
  WIFE_ID,
} = require("../../modules/MasterModule");
const generalRouter = express.Router();

generalRouter.post("/save_genral_form", async (req, res) => {
  //   var user_name = req.user.user_name;
  var data = req.body;
  //   console.log(data, "hhhh");
  var save_gen = await general_form_save(data);
  //   console.log(save_gen, "mmm");
  res.send(save_gen);
});

generalRouter.post("/spose_depend_form_save", async (req, res) => {
  var data = req.body;
  var res_dt = await spose_depend_form_save(data);
  res.send(res_dt);
});

generalRouter.post("/depend_form_save", async (req, res) => {
  var data = req.body;
  var res_dt = await saveDepForm(data);
  res.send(res_dt);
});

generalRouter.post("/image_form_save", async (req, res) => {
  var data = req.body;
  // console.log(req.files, req.body);
  var res_dt = await saveFile(
    req.files ? (req.files.own_file ? req.files.own_file : null) : null,
    req.files ? (req.files.spouse_file ? req.files.spouse_file : null) : null,
    data
  );
  res.send(res_dt);
});

generalRouter.get("/frm_list", async (req, res) => {
  var data = req.query;
  console.log(data, "bbb");
  var select = "form_no,form_dt,memb_name,gender,mem_type,memb_status",
    table_name = "md_member",
    whr = `memb_status = 'P' OR memb_status = 'R' OR memb_status = 'T'`;
  // AND form_no = '${data.form_no}' OR memb_name = '${data.form_no}'`,
  order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  console.log(res_dt, "kiki");
  res.send(res_dt);
});

generalRouter.get("/frm_list_2", async (req, res) => {
  var data = req.query;
  console.log(data, "bbb");
  var select = "form_no,form_dt,memb_name,gender,mem_type,memb_status",
    table_name = "md_member",
    whr = `memb_status = 'P' OR memb_status = 'R' OR memb_status = 'T' AND form_no = '${data.form_no}' OR memb_name = '${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  console.log(res_dt, "kiki");
  res.send(res_dt);
});

generalRouter.get("/get_member_dtls", async (req, res) => {
  var data = req.query;
  // console.log(data, "ooo");
  var select =
      "a.form_no,a.mem_type,a.memb_name,a.unit_id,a.gurdian_name,a.dob,a.blood_grp,a.staff_nos,a.pers_no,a.min_no,a.memb_status,a.remarks,a.memb_address,a.ps,a.phone_no,a.email_id,a.resolution_no,a.resolution_dt,c.adm_fee,c.donation,c.subs_type,c.subscription_1,c.subscription_2,d.unit_name, a.memb_pic",
    table_name = "md_member a, md_member_fees c, md_unit d",
    where = `a.mem_type = c.memb_type
    AND a.unit_id = d.unit_id
    AND a.form_no = '${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, where, order);
  console.log(res_dt, "sss");
  res.send(res_dt);
});

generalRouter.get("/get_total_amount", async (req, res) => {
  var data = req.query;
  // console.log(data, "ooo");
  var select = "tot_amt",
    table_name = "td_transactions",
    where = `form_no = '${data.form_no}'`,
    order = null;
  var tot_dt = await db_Select(select, table_name, where, order);
  console.log(tot_dt, "sss");
  res.send(tot_dt);
});

generalRouter.get("/get_dependent_dtls", async (req, res) => {
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

generalRouter.post("/reject", async (req, res) => {
  var data = req.body;
  // console.log(data,'reject');
  var res_dt = await reject_dt(data);
  res.send(res_dt);
});

generalRouter.post("/payment_accept", async (req, res) => {
  var data = req.body;
  console.log(data, "accept");
  var res_dt = await accept_dt_cash(data);
  res.send(res_dt);
});

generalRouter.post("/payment_accept_cheque", async (req, res) => {
  var data = req.body;
  console.log(data, "accept_cheque");
  var res_dt = await accept_dt_cheque(data);
  res.send(res_dt);
});

generalRouter.get("/transaction_dt", async (req, res) => {
  var data = req.query;
  console.log(data);
  var select =
      "a.*,b.mem_type,b.memb_oprn,b.memb_name,b.unit_id,b.phone_no,b.email_id,b.resolution_no,b.resolution_dt,b.staff_nos,b.pers_no,b.min_no,c.unit_name",
    table_name =
      "td_transactions a JOIN md_member b ON a.form_no = b.form_no LEFT JOIN md_unit c ON b.unit_id = c.unit_id",
    whr = `b.memb_status = 'T'
    ${data.form_no ? `AND a.form_no = '${data.form_no}'` : ""}`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  console.log(res_dt, "mini");
  res.send(res_dt);
});

generalRouter.post("/approve", async (req, res) => {
  var data = req.body;
  console.log(data, "1111");
  var res_dt = await approve_dt(data);
  res.send(res_dt);
});

module.exports = { generalRouter };
