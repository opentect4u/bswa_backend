const memberRouter = require("express").Router(),
  { db_Select, db_Insert } = require("../../modules/MasterModule"),
  fs = require("fs"),
  path = require("path");

const { dynamicFileUpload } = require("../../modules/general_formModule");

memberRouter.post("/member_dtls", async (req, res) => {
  var data = req.body;
  var select =
      "form_no, form_dt, member_id, mem_dt, mem_type, memb_oprn, memb_name, unit_id, gurdian_name, gender, marital_status, dob, blood_grp, caste, staff_nos, pers_no, min_no, memb_address, ps, city_town_dist, pin_no, phone_no, email_id, memb_pic, memb_status, remarks, resolution_no, resolution_dt",
    table_name = "md_member",
    whr = data.flag
      ? `form_no = '${data.form_no}'`
      : data.mem_id
      ? `member_id = '${data.mem_id}'`
      : null,
    order = "order by cast(substr(member_id,3) as unsigned)";
  var res_dt = await db_Select(select, table_name, whr, order);
  if (data.flag) {
    var select =
        "form_no, sl_no, member_id, mem_type, dependent_dt, dependent_name, gurdian_name, relation, min_no, dob, blood_grp, memb_address, ps, city_town_dist, pin_no, phone_no, email_id, memb_pic, intro_member_id, dept_status, grp_status, grp_no, stp_status, stp_no",
      table_name = "md_dependent",
      whr = `form_no = '${data.form_no}' AND ${
        res_dt.msg[0].mem_type != "AI"
          ? "relation not in (3, 15)"
          : `intro_member_id is not null`
      }`,
      order = "order by sl_no";
    var spou_dt = await db_Select(select, table_name, whr, order);

    var select =
        "form_no, sl_no, member_id, mem_type, dependent_dt, dependent_name, gurdian_name, relation, min_no, dob, blood_grp, memb_address, ps, city_town_dist, pin_no, phone_no, email_id, memb_pic, intro_member_id, dept_status, grp_status, grp_no, stp_status, stp_no",
      table_name = "md_dependent",
      whr = `form_no = '${data.form_no}' AND ${
        res_dt.msg[0].mem_type != "AI"
          ? "relation not in (3, 15)"
          : `intro_member_id is null`
      }`,
      order = "order by sl_no";
    var dep_dt = await db_Select(select, table_name, whr, order);

    res_dt.msg[0]["spou_dt"] =
      spou_dt.suc > 0 ? (spou_dt.msg.length > 0 ? spou_dt.msg[0] : {}) : {};
    res_dt.msg[0]["dep_dt"] =
      dep_dt.suc > 0 ? (dep_dt.msg.length > 0 ? dep_dt.msg : []) : [];
  }
  res.send(res_dt);
});

memberRouter.post("/update_member_dtls", async (req, res) => {
  var data = req.body.data;
  data = JSON.parse(data);
  var spu_file = req.files ? req.files.spouse_file : null,
    mem_file = req.files ? req.files.member_file : null,
    ownFile_name = null,
    spuseFile_name = null,
    nowTime = new Date().getTime();

  var dir = "assets";
  var subDir = `uploads/${data.form_no}`;
  if (!fs.existsSync(path.join(dir, subDir))) {
    fs.mkdirSync(path.join(dir, subDir));
  }

  if (mem_file) {
    var fileName = data.form_no + "_" + nowTime + "_" + mem_file.name;
    var file_upload = await dynamicFileUpload(
      path.join("assets", `uploads/${data.form_no}`, fileName),
      fileName,
      mem_file
    );
    ownFile_name =
      file_upload.suc > 0 ? `uploads/${data.form_no}/${fileName}` : null;
  }

  if (spu_file) {
    var fileName = data.form_no + "_" + nowTime + "_" + spu_file.name;
    var file_upload = await dynamicFileUpload(
      path.join("assets", `uploads/${data.form_no}`, fileName),
      fileName,
      spu_file
    );
    spuseFile_name =
      file_upload.suc > 0 ? `uploads/${data.form_no}/${fileName}` : null;
  }

  // console.log(JSON.parse(data), typeof(data));
  var datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
  var table_name = "md_member",
    fields = `mem_type = '${data.mem_type}', memb_oprn = '${
      data.member_opt
    }', memb_name = '${data.member}', unit_id = '${
      data.unit_nm
    }', gurdian_name = '${data.gurdian}', gender = '${
      data.gen ? data.gen : "M"
    }', marital_status = '${
      data.marital_status ? data.marital_status : "N"
    }', dob = '${dateFormat(new Date(data.gen_dob), "yyyy-mm-dd")}' ${
      data.blood ? `, blood_grp = '${data.blood}'` : ""
    } ${data.caste ? `, caste = '${data.caste}'` : ""} ${
      data.staff ? `, staff_nos = '${data.staff}'` : ""
    } ${data.personal ? `, pers_no = '${data.personal}'` : ""}, min_no = '${
      data.min
    }', memb_address = "${data.mem}" ${
      data.police_st ? `, ps = '${data.police_st}'` : ""
    } ${data.city ? `, city_town_dist = '${data.city}'` : ""} ${
      data.pin ? `, pin_no = '${data.pin}'` : ""
    }, phone_no = '${data.phone}' ${
      data.email_id ? `, email_id = '${data.email_id}'` : ""
    } ${ownFile_name ? `, memb_pic = '${ownFile_name}'` : ""}, modified_by = '${
      data.user
    }', modified_at = '${datetime}'`,
    values = null,
    whr = `form_no = '${data.form_no}'`,
    flag = 1;
  var res_dt = await db_Insert(table_name, fields, values, whr, flag);

  if (res_dt.suc > 0) {
    var table_name = "md_dependent",
      fields = `dependent_name = '${data.spouse_fr.spou_name}' ${
        data.spouse_fr.spou_gurd_name
          ? `, gurdian_name = '${data.spouse_fr.spou_gurd_name}'`
          : ""
      }, min_no = '${data.spouse_fr.spou_min_no}', dob = '${
        data.spouse_fr.spou_dob
      }' ${
        data.spouse_fr.spou_blood_grp
          ? `, blood_grp = '${data.spouse_fr.spou_blood_grp}'`
          : ""
      }, memb_address = "${data.spouse_fr.spou_mem_addr}" ${
        data.spouse_fr.spou_police_st
          ? `, ps = '${data.spouse_fr.spou_police_st}'`
          : ""
      } ${
        data.spouse_fr.spou_city
          ? `, city_town_dist = '${data.spouse_fr.spou_city}'`
          : ""
      }, phone_no = '${data.spouse_fr.spou_mobile_no}' ${
        spuseFile_name ? `, memb_pic = '${spuseFile_name}'` : ""
      }, modified_by = '${data.user}', modified_at = '${datetime}'`,
      values = null,
      whr = `form_no = '${data.form_no}' AND sl_no = ${data.spouse_fr.sl_no}`,
      flag = 1;
    var spou_dt = await db_Insert(table_name, fields, values, whr, flag);

    if (data.depenFields.length > 0) {
      for (let dt of data.depenFields) {
        // var table_name = "md_dependent",
        //   fields = `dependent_name = '${dt.dependent_name}, phone_no = '${dt.phone_no}', relation = '${dt.relation}', dob = '${dt.dob_dep}', modified_by = '${data.user}', modified_at = '${datetime}'`,
        //   values = null,
        //   whr = `form_no = '${data.form_no}' AND sl_no = ${dt.sl_no}`,
        //   flag = 1;
        // var dep_dt = await db_Insert(table_name, fields, values, whr, flag);

        var table_name = "md_dependent",
          fields =
            dt.sl_no > 0
              ? `dependent_name = '${dt.dependent_name}' ${
                  dt.phone_no ? `, phone_no = '${dt.phone_no}'` : ""
                }, relation = '${dt.relation}' ${
                  dt.dob_dep ? `, dob = '${dt.dob_dep}'` : ""
                }, modified_by = '${data.user}', modified_at = '${datetime}'`
              : `(form_no, sl_no, member_id, mem_type, dependent_name, relation ${
                  dt.dob_dep ? ", dob" : ""
                } ${dt.phone_no ? ", phone_no" : ""}, created_by, created_at)`,
          values = `SELECT '${data.form_no}', count(sl_no)+1, '${data.mem_id}', '${data.mem_type}', '${dt.dependent_name}', '${dt.relation}' ${dt.dob_dep ? `, '${dt.dob_dep}'` : ""} ${dt.phone_no ? `, '${dt.phone_no}'` : ""}, '${data.user}', '${datetime}' from md_dependent WHERE form_no = '${data.form_no}'`,
          whr =
            dt.sl_no > 0
              ? `form_no = '${data.form_no}' AND sl_no = ${dt.sl_no}`
              : null,
          flag = dt.sl_no > 0 ? 1 : 0;
        var dep_dt = await db_Insert(table_name, fields, values, whr, flag, true);
      }
    }
  }
  res.send(res_dt);
});

memberRouter.post('/user_tnx_details', async (req, res) => {
  var data = req.body
  var select = '*',
    table_name = 'td_transactions',
    whr = `form_no = '${data.form_no}' ${data.trn_id > 0 ? `AND trn_id = ${data.trn_id}` : ''}`,
    order = `ORDER BY trn_dt, trn_id`;
    var res_dt = await db_Select(select, table_name, whr, order)
    res.send(res_dt)
})

module.exports = { memberRouter };
