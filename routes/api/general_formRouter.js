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
    table_name = `md_member a 
    JOIN md_member_fees c ON a.mem_type = c.memb_type AND date(c.effective_dt) = (SELECT max(date(d.effective_dt))
    FROM md_member_fees d
    WHERE a.mem_type = d.memb_type)
    LEFT JOIN md_unit d ON a.unit_id = d.unit_id`,
    where = `a.form_no = '${data.form_no}'`,
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
      "a.member_id,a.mem_type,a.dependent_dt,a.dependent_name,a.gurdian_name gurd_name,a.relation,a. min_no spou_min,a.dob spou_dob,a.blood_grp spou_blood_grp,a.memb_address spou_memb_address,a.ps spou_ps,a.phone_no spou_phone,a.email_id spou_email,a.memb_pic spou_pic, b.relation_name",
    table_name = "md_dependent a, md_relationship b",
    where = `a.relation = b.id AND a.form_no = '${data.form_no}' AND a.relation IN (${HUSBAND_ID}, ${WIFE_ID})`,
    order = null;
  var spouse_dt = await db_Select(select, table_name, where, order);

  var dep_dt = await db_Select(
    select,
    table_name,
    `a.relation = b.id AND a.form_no = '${data.form_no}' AND a.relation NOT IN (${HUSBAND_ID}, ${WIFE_ID})`,
    order
  );

  var res_dt = {
    suc: 1,
    msg: {
      spouse_dt: spouse_dt.suc > 0 ? spouse_dt.msg : [],
      dep_dt: dep_dt.suc > 0 ? dep_dt.msg : [],
    },
  };
  // console.log(spouse_dt, "qq");
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
