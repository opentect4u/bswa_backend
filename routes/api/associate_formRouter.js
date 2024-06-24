const express = require("express");
const dateFormat = require("dateformat");
const {
  associate_form_save,
  intro_depend_form,
  saveFile,
  saveDependForm,
  spose_depend_form_save,
  accept_dt_cash,
  accept_dt_cheque,
  approve_dt,
} = require("../../modules/associate_formModule");
const { saveDepForm } = require("../../modules/life_formModule");
const { db_Select } = require("../../modules/MasterModule");
const associateRouter = express.Router();

associateRouter.post("/save_associate_form", async (req, res) => {
  var data = req.body;
  var save_asso = await associate_form_save(data);
  res.send(save_asso);
});

associateRouter.post("/spose_depend_form_save", async (req, res) => {
  var data = req.body;
  var res_dt = await spose_depend_form_save(data);
  res.send(res_dt);
});

associateRouter.post("/depend_form_save", async (req, res) => {
  var data = req.body;
  var res_dt = await saveDependForm(data);
  res.send(res_dt);
});

associateRouter.post("/image_form_save", async (req, res) => {
  var data = req.body;
  var res_dt = await saveFile(
    req.files ? (req.files.own_file ? req.files.own_file : null) : null,
    req.files ? (req.files.spouse_file ? req.files.spouse_file : null) : null,
    data
  );
  res.send(res_dt);
});

associateRouter.get("/get_member_dtls_asso", async (req, res) => {
  var data = req.query;
  // console.log(data, "ooo");
  var select =
      "a.form_no,a.mem_type,a.memb_name,a.unit_id,a.gurdian_name,a.dob,a.blood_grp,a.staff_nos,a.pers_no,a.min_no,a.memb_address,a.ps,a.phone_no,a.email_id,a.resolution_no,a.resolution_dt,b.adm_fee,b.donation,b.subs_type,b.subscription_1,b.subscription_2,a.memb_pic",
    table_name = "md_member a, md_member_fees b",
    where = `a.mem_type = b.memb_type
    AND a.form_no = '${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, where, order);
  console.log(res_dt, "sss");
  res.send(res_dt);
});

// associateRouter.get("/get_intro_dtls_asso", async (req, res) => {
//   var data = req.query;
//   // console.log(data, "ooo");
//   var select = "form_no,mem_type,dependent_name,relation,intro_member_id",
//     table_name = "md_dependent",
//     where = `form_no = '${data.form_no}'`,
//     order = null;
//   var res_dt = await db_Select(select, table_name, where, order);
//   console.log(res_dt, "sss");
//   res.send(res_dt);
// });

associateRouter.get("/get_dependent_dtls_associate", async (req, res) => {
  var data = req.query;
  console.log(data, "ooo");
  var select = "a.*,b.relation_name",
    table_name = "md_dependent a, md_relationship b",
    where = `a.relation = b.id AND a.form_no = '${data.form_no}' AND a.intro_member_id IS NOT null`,
    order = null;
  var spouse_dt = await db_Select(select, table_name, where, order);

  var select = "a.*,b.relation_name",
    table_name = "md_dependent a, md_relationship b",
    where = `a.relation = b.id AND a.form_no = '${data.form_no}' AND a.intro_member_id IS null`,
    order = null;
  var dep_dt = await db_Select(select, table_name, where, order);

  // var dep_dt = await db_Select(
  //   select,
  //   table_name,
  //   `form_no = '${data.form_no}' AND intro_member_id IN null`,
  //   order
  // );

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

associateRouter.post("/payment_accept_associate", async (req, res) => {
  var data = req.body;
  console.log(data, "accept");
  var res_dt = await accept_dt_cash(data);
  res.send(res_dt);
});

associateRouter.post("/payment_accept_cheque_associate", async (req, res) => {
  var data = req.body;
  console.log(data, "accept_cheque");
  var res_dt = await accept_dt_cheque(data);
  res.send(res_dt);
});

associateRouter.post("/approve_associate", async (req, res) => {
  var data = req.body;
  console.log(data, "1111");
  var res_dt = await approve_dt(data);
  res.send(res_dt);
});
module.exports = { associateRouter };
