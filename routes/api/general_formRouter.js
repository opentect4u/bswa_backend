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
  upi_dt,
  pin_data,
} = require("../../modules/general_formModule");
const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const { ed25519 } = require('@noble/curves/ed25519');

const {
  db_Select,
  HUSBAND_ID,
  WIFE_ID,
  db_Insert,
} = require("../../modules/MasterModule");
const generalRouter = express.Router();

generalRouter.post("/check_staff_no", async (req, res) => {
  var data = req.body;
  // console.log(data, 'datarara');

  var select = "mem_type,member_id",
      table_name = "md_member",
      whr = `staff_nos = '${data.staff_no}'`,
      order = null;

  var res_dt = await db_Select(select, table_name, whr, order);

  if (res_dt.suc > 0 && res_dt.msg.length > 0) {
      res.send({ suc: 2, exists: true });  // Ensure `suc` and `exists` are returned
  } else {
      res.send({ suc: 1, exists: false });
  }
});

generalRouter.post("/check_mobile_no", async (req, res) => {
  const data = req.body;

  var select = "phone_no",
      table_name = "md_member",
      whr = `phone_no = '${data.phone_no}'`,
      order = null;

  const res_dt = await db_Select(select, table_name, whr, order);

  if (res_dt.suc > 0 && res_dt.msg.length > 0) {
      res.send({ suc: 2, exists: true });
  } else {
      res.send({ suc: 1, exists: false });
  }
});



generalRouter.post("/save_genral_form", async (req, res) => {
  //   var user_name = req.user.user_name;
  var data = req.body;
  // console.log(data, "hhhh");
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
  // console.log(data, "ccc");
  var select = "form_no,form_dt,memb_name,gender,mem_type,memb_status,pay_status",
    table_name = "md_member",
    whr = `memb_status IN('P','R','T','A')`;
  // whr = `memb_status = 'P' OR memb_status = 'R' OR memb_status = 'T'`;
  // AND form_no = '${data.form_no}' OR memb_name = '${data.form_no}'`,
  order = `ORDER BY form_dt desc`;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "kiki");
  res.send(res_dt);
});

generalRouter.get("/frm_list_2", async (req, res) => {
  var data = req.query;
  // console.log(data, "bbb");
  var select = "form_no,form_dt,memb_name,gender,mem_type,memb_status",
    table_name = "md_member",
    whr = `(form_no LIKE '%${data.form_no}%' OR memb_name LIKE '%${data.form_no}%') AND memb_status IN('P','R','T','A')`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "kiki");
  res.send(res_dt);
});

generalRouter.get("/get_member_dtls", async (req, res) => {
  var data = req.query;
  // console.log(data, "ooo");
  var select =
      "a.form_no,a.member_id,a.mem_type,a.memb_name,a.unit_id,a.gurdian_name,a.dob,a.blood_grp,a.staff_nos,a.pers_no,a.min_no,a.memb_status,a.remarks,a.memb_address,a.ps,a.phone_no,a.email_id,a.resolution_no,a.resolution_dt,c.adm_fee,c.donation,c.subs_type,c.subscription_1,c.subscription_2,d.unit_name, a.memb_pic",
    table_name = `md_member a 
    JOIN md_member_fees c ON a.mem_type = c.memb_type AND date(c.effective_dt) = (SELECT max(date(d.effective_dt))
    FROM md_member_fees d
    WHERE a.mem_type = d.memb_type)
    LEFT JOIN md_unit d ON a.unit_id = d.unit_id`,
    where = `a.form_no = '${data.form_no}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, where, order);
  // console.log(res_dt, "sss");
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
  // console.log(tot_dt, "sss");
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
  // console.log(data, "accept");
  var res_dt = await accept_dt_cash(data);
  res.send(res_dt);
});

generalRouter.post('/check_link_expiry', async (req, res) => {
    const formNo = req.body.form_no;
    const result = await db_Select(
        "payment_link,link_expiry_time",
        "md_member",
        `form_no='${formNo}'`,
        null
    );
    console.log(result,'result');
    

    if (result.suc > 0) {
        const expiryTime = new Date(result.msg[0].link_expiry_time).getTime();
        console.log(expiryTime,'expiryTime');
        
        // const now = new Date();
        if (Date.now() > expiryTime) {
          console.log(now > expiryTime,'loiu');
          
            return res.json({ expired: true });
        }
        return res.json({ expired: false });
    }
    res.json({ expired: true });
});

generalRouter.post('/update_payment_status', async (req, res) => {
  try {
    const { form_no, pay_status } = req.body;
    console.log(form_no,pay_status);
    

    if (!form_no || !pay_status) {
      return res.json({ suc: 0, msg: "Missing parameters" });
    }

    // Update the database
    var table_name = "md_member",
    fields = `pay_status = '${pay_status}'`,
    values = null,
    whr = `form_no = '${form_no}'`,
    flag = 1;
    const result = await db_Insert(table_name,fields,values,whr,flag);

    res.json({ suc: 1, msg: "Payment status updated" });
  } catch (error) {
    console.error(error);
    res.json({ suc: 0, msg: "Server error", error });
  }
});

generalRouter.post("/payment_accept_cheque", async (req, res) => {
  var data = req.body;
  // console.log(data, "accept_cheque");
  var res_dt = await accept_dt_cheque(data);
  res.send(res_dt);
});

generalRouter.post("/upi_accept", async (req, res) => {
  var data = req.body;
  console.log(data, "upi");
  var res_dt = await upi_dt(data);
  res.send(res_dt);
});

generalRouter.get("/transaction_dt", async (req, res) => {
  var data = req.query;
  // console.log(data);
  var select =
      "a.*,b.mem_type,b.memb_oprn,b.memb_name,b.unit_id,b.phone_no,b.email_id,b.resolution_no,b.resolution_dt,b.staff_nos,b.pers_no,b.min_no,b.memb_status,c.unit_name",
    table_name =
      "td_transactions a JOIN md_member b ON a.form_no = b.form_no LEFT JOIN md_unit c ON b.unit_id = c.unit_id",
    whr = `b.memb_status = 'T'
    ${data.form_no ? `AND a.form_no = '${data.form_no}'` : ""}`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "mini");
  res.send(res_dt);
});

generalRouter.post("/approve", async (req, res) => {
  var data = req.body;
  // console.log(data, "1111");
  var res_dt = await approve_dt(data);
  res.send(res_dt);
});

generalRouter.post("/set_pin", async (req, res) => {
  var data = req.body;
  console.log(data,'set');
  var set_pin_data = await pin_data(data);
  res.send(set_pin_data)
})

generalRouter.post("/accept_money_receipt", async (req, res) => {
  var data = req.body;
  var select =
      "a.form_no,a.trn_dt,a.trn_id,a.tot_amt,a.pay_mode,a.receipt_no,a.chq_no,a.chq_dt,a.chq_bank,a.approval_status,b.memb_name,b.mem_type",
    table_name = "td_transactions a, md_member b",
    whr = `a.form_no = b.form_no AND a.form_no = '${data.form_no}' AND a.trn_id = '${data.trn_id}'`,
    order = null;
  var res_dt = await db_Select(select, table_name, whr, order);
  // console.log(res_dt, "lo");
  res.send(res_dt);
});

// VERIFY MEMBER IS OK OR NOT
generalRouter.post("/check_member_id", async (req, res) => {
  const data = req.body;

   // Validation
   if (!data.member_id || data.member_id.trim() === '') {
    return res.send({ suc: 0, msg: 'Member ID is required' });
    }

  var select = "member_id",
      table_name = "md_member",
      whr = `member_id = '${data.member_id}'`,
      order = null;
  const res_dt = await db_Select(select, table_name, whr, order);

  if (res_dt.suc > 0 && res_dt.msg.length > 0) {
      res.send({ suc: 1, msg: 'Member ID is Valid' });
  } else {
      res.send({ suc: 0, msg: 'Invalid Member ID' });
  }
});

// SEND REGISTERED MOBILE NO FOR OTP
generalRouter.post("/send_phone_no_fr_otp", async (req, res) => {
  const data = req.body;

  var select = "phone_no",
      table_name = "md_member",
      whr = `member_id = '${data.member_id}'`,
      order = null;
  const res_dt = await db_Select(select, table_name, whr, order);
  res.send(res_dt)
});

generalRouter.get("/show_data", async (req, res) => {
  const data = req.query;
  // console.log(data,'datata');
  
  var select = "created_by,created_at,modified_by,modified_at,approve_by,approve_at,rejected_by,rejected_dt,remarks",
      table_name = "md_member",
      whr = `form_no = '${data.form_no}'`;
      order = null;
  const res_dt_show = await db_Select(select, table_name, whr, order);
  res.send(res_dt_show)
});

// Start challenge endpoint

generalRouter.post("/challange_start", async (req, res) => {
  var data = req.body;
  let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");

  if (!data.device_id) {
    return res.send({ suc: 0, msg: 'device_id required' });
  }

  var select = "user_status,public_key",
  table_name = "md_user",
  whr = `user_id = '${data.member_id}' AND device_id = '${data.device_id}'`,
  order = null;
  var key_data = await db_Select(select,table_name,whr,order);

   // DEBUG
    // console.log("key_data:", key_data);

  const challenge = crypto.randomBytes(32).toString('hex');

  var table_name = "md_device_challenges",
  fields =`(user_id,device_id,challenge,used,created_by,created_at)`,
  values = `('${data.member_id}','${data.device_id}','${challenge}','0','${data.member_id}','${datetime}')`,
  where = null,
  flag = 0;
  var res_dt = await db_Insert(table_name, fields, values, where, flag);

   // DEBUG
    // console.log("Insert response:", res_dt);
    
   return res.send({
      suc: 1,
      challenge: challenge
    });
});

//Verify signature endpoint
generalRouter.post("/challange_verify", async (req, res) => {
 var data = req.body;

  // ----------------- GET PUBLIC KEY -----------------
    let userRes = await db_Select(
        "public_key",
        "md_user",
        `user_id = '${data.member_id}' AND device_id = '${data.device_id}' AND user_status = 'A'`,
        null
    );

    if (!userRes.suc || userRes.msg.length === 0) {
        return res.send({ suc: 0, msg: "User or device not found" });
    }

    const publicKeyHex = userRes.msg[0].public_key;

 // ----------------- GET CHALLENGE -----------------
    let challengeRes = await db_Select(
        "id, created_at, used",
        "md_device_challenges",
        `user_id = '${data.member_id}' AND device_id = '${data.device_id}' AND challenge = '${data.challenge}'`,
        "ORDER BY id DESC LIMIT 1"
    );

    if (!challengeRes.suc || challengeRes.msg.length === 0) {
        return res.send({ suc: 0, msg: "Challenge not found" });
    }

    const challenge = challengeRes.msg[0];

    if (challenge.used === 1) {
        return res.send({ suc: 0, msg: "Challenge already used" });
    }

    // ----------------- EXPIRY CHECK (2 MIN) -----------------
    const createdAt = new Date(challenge.created_at);
    if ((Date.now() - createdAt.getTime()) > 2 * 60 * 1000) {
        return res.send({ suc: 0, msg: "Challenge expired" });
    }

    // ----------------- VERIFY SIGNATURE -----------------
    // const message = Buffer.from(data.challenge, "hex");
    // const message = Buffer.from(data.challenge, "utf8");
    const message = new TextEncoder().encode(data.challenge);
    const signatureBytes = Buffer.from(data.signature, "hex");
    const publicKeyBytes = Buffer.from(publicKeyHex, "hex");

    const isValid = ed25519.verify(signatureBytes, message, publicKeyBytes);

    if (!isValid) {
        return res.send({ suc: 0, msg: "Signature verification failed" });
    }

    // ----------------- MARK CHALLENGE USED -----------------
    let updateRes = await db_Insert(
        "md_device_challenges",
        "used = '1'",
        null,
        `id = '${challenge.id}'`,
        1
    );

    if (!updateRes.suc) {
        return res.send({ suc: 0, msg: "Failed to update challenge" });
    }

    return res.send({ suc: 1, msg: "Challenge verified" });
});

module.exports = { generalRouter };
