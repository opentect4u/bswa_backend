var dateFormat = require("dateformat"),
path = require("path"),
fs = require("fs");
const { db_Select, db_Insert, db_Delete, getMaxTrnId } = require("./MasterModule");
const { sendSms } = require("./smsModule");

// const getMaxFormNo = (flag) => {
//   return new Promise(async (resolve, reject) => {
//     var select =
//         "IF(MAX(SUBSTRING(form_no, -6)) > 0, LPAD(MAX(SUBSTRING(form_no, -6))+1, 6, '0'), '000001') max_form",
//       table_name = "td_child_policy",
//       whr = `SUBSTRING(form_no, 1, ${flag.length}) = '${flag}'`,
//       order = null;
//     var res_dt = await db_Select(select, table_name, whr, order);
//     resolve(res_dt);
//   });
// };

const getMaxFormNo = (flag) => {
  return new Promise(async (resolve, reject) => {
    try {
      let select = `
        LPAD(IFNULL(MAX(CAST(RIGHT(form_no, 6) AS UNSIGNED)) + 1, 1), 6, '0') AS max_form
      `;
      table_name = "td_child_policy";
      whr = `form_no LIKE '${flag}%'`;

      res_dt = await db_Select(select, table_name, whr, null);
      resolve(res_dt);

    } catch (err) {
      reject(err);
    }
  });
};


module.exports = {
children_form_save: (data) => {
    return new Promise(async (resolve, reject) => {
    let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
    let year = dateFormat(new Date(), "yyyy");

    try {
    const no = await getMaxFormNo(data.flag);
    let form_no = `${data.flag}${year}${no.msg[0].max_form}`;
    console.log(form_no,'form_no');
    
    // ------------------ INSERT MAIN CHILD POLICY ------------------
     let fields = `(form_no,form_dt,flag,member_id,member_name,dob,gender,marital_status,status,age,phone_no,member_address,gurdian_name,approval_status,created_by,created_at)`;
      values = `('${form_no}','${datetime}','${data.flag}','${data.member_id}',${data.member_name ? `'${data.member_name}'` : 'NULL'},${data.dob ? `'${data.dob}'` : 'NULL'},${data.gender ? `'${data.gender}'` : 'NULL'},${data.marital_status ? `'${data.marital_status}'` : 'NULL'},'SELF',${data.age ? `${data.age}` : 0},${data.phone_no ? `'${data.phone_no}'` : 'NULL'},${data.member_address ? `'${data.member_address.split("'").join("\\'")}'` : 'NULL'},${data.gurdian_name ? `'${data.gurdian_name}'` : 'NULL'},'P','${data.member_name}','${datetime}')`;
      table_name = "td_child_policy";
      whr = null;
      order = null;
      var children_dt = await db_Insert(table_name, fields, values, whr, order);

       if (children_dt.suc <= 0) {
        return reject({ suc: 0, msg: "Failed to save child policy" });
      }

      // ---------------------------------------------------
      // ADD SELF AS FIRST DEPENDENT AUTOMATICALLY
      // ---------------------------------------------------

      let selfDependent = {
        form_no: form_no,
        member_id: data.member_id,
        dependent_name: data.member_name,
        dob: data.dob,
        gender: data.gender,
        status: "SELF",
        age: data.age,
        treatment_flag: data.memb_treatment_flag,
        treatment_dtls: data.memb_treatment_dtls ? data.memb_treatment_dtls.split("'").join("\\'") : 'NULL',
        created_by: data.member_name,
        created_at: datetime
      };


       if (!Array.isArray(data.dependent_dt)) {
        data.dependent_dt = [];
      }

      // Insert SELF as index 0
      data.dependent_dt.unshift(selfDependent);


      // ------------------ INSERT DEPENDENTS ------------------
        for (let dt of data.dependent_dt) {
            fields = `(form_no,member_id,dependent_name,dob,gender,status,age,treatment_flag,treatment_dtls,created_by,created_at)`;
          values = `('${form_no}','${data.member_id}','${dt.dependent_name}',${dt.dob ? `'${dt.dob}'` : 'NULL'},'${dt.gender}',${dt.status ? `'${dt.status}'` : 'NULL'},${dt.age ? `${dt.age}` : 0},'${dt.treatment_flag}',${dt.treatment_dtls ? `'${dt.treatment_dtls.replace(/'/g, "\\'")}'` : 'NULL'},'${data.member_name}','${datetime}')`;
          table_name = "td_child_policy_dependent";
          whr = null;
          order = null;
          var super_dt = await db_Insert(table_name,fields,values,whr,order);

        // IF DEPENDENT INSERT FAILS → DELETE MAIN TABLE RECORD
        if (super_dt.suc <= 0) {
          await db_Delete("td_child_policy", `form_no='${form_no}'`);
          return reject({
            suc: 0,
            msg: "Save failed"
          });
        }
      }
      
      table_name = "md_user";
      fields = `cp_form_no = '${form_no}',cp_user_status = 'I',modified_by = '${data.member_name}',modified_at = '${datetime}'`;
      values = null;
      whr = `user_id = '${data.member_id}'`;
      flag = 1;
      let mdUserRes = await db_Insert(table_name, fields, values, whr, flag);

      if (mdUserRes.suc <= 0) {
      await db_Delete("td_child_policy_dependent", `form_no='${form_no}'`);
      await db_Delete("td_child_policy", `form_no='${form_no}'`);
      return reject({
      suc: 0,
      msg: "User update failed, transaction rolled back"
     });
    }

       resolve({
        suc: 1,
        msg: "Child Policy Form saved successfully",
        form_no: form_no,
        policy_holder_type: data.policy_holder_type   
      });
       } catch (err) {
      reject({ suc: 0, msg: "Error occurred → No data saved", error: err });
    }
    });
},
  reject_dt: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      var fields = `approval_status = '${data.status}',resolution_no ='${data.resolution_no}',effective_date = '${data.resolution_dt}',remarks = '${data.reject.split("'").join("\\'")}',rejected_by = '${data.user}',rejected_at = '${datetime}',modified_by = '${data.user}',modified_at = '${datetime}'`,
        table_name = "td_child_policy",
        values = null,
        whr = `form_no = '${data.formNo}'`,
        flag = 1;
      var mem_dt = await db_Insert(table_name, fields, values, whr, flag);

       // SEND SMS AFTER FORM REJECT //
       try{
          // ✅ Trim member name to 30 characters max
          let memb_name = data.member ? (data.member.length > 30 ? data.member.substring(0, 27) + "..." : data.member) : "";
          const phone = data.phone_no;
          const form_no = data.formNo;

           // Send SMS
           let smsRes = await sendSms(
           phone,
            "FORM_REJECTION",
          [
           memb_name,
           form_no
           ]);
          console.log("SMS Response:", smsRes, phone);
        }catch(err){
          console.log("Error in sending SMS",err);
        }
      resolve(mem_dt);
    });
  },
   save_cp_data: (data) => {
    return new Promise(async (resolve, reject) => {
      let datetime = dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss");
      let year = dateFormat(new Date(), "yyyy");

      const no = await getMaxTrnId();
      let trn_id = `${year}${no.msg[0].max_trn_id}`;
      // console.log(trn_id,'trn');
      
      let approveSuccess = false;

        var table_name = "td_child_policy",
        fields = `effective_date = '${data.resolution_dt}',policy_amount = '${data.policy_amount}',premium_amount = '${data.premium_amount}',approval_status = '${data.status}',trns_type = 'ONLINE',resolution_no ='${data.resolution_no}',approved_by = '${data.user}',approved_at = '${datetime}',modified_by = '${data.user}',modified_at = '${datetime}'`,
        values = null,
        whr = `form_no = '${data.formNo}'`,
        flag = 1;
        var trns_data = await db_Insert(table_name,fields,values,whr,flag);
        trns_data["trn_id"] = trn_id;

          if(trns_data.suc > 0){
        var table_name = "md_user",
        fields = `user_status = 'A',cp_user_status = 'A',modified_by = '${data.user}',modified_at = '${datetime}'`,
        values = null,
        whr = `cp_form_no = '${data.formNo}'`,
        flag = 1;
        var trn_data = await db_Insert(table_name,fields,values,whr,flag);

         if (trn_data.suc > 0) {
           approveSuccess = true;
             }
        }

         
           // SEND SMS AFTER FORM APPROVED //
           if(approveSuccess){
           try{
            // ✅ Trim member name to 30 characters max
            let memb_name = data.member ? (data.member.length > 30 ? data.member.substring(0, 27) + "..." : data.member) : "";
            let status_label = data.status === "A" ? "Approved" : "";
            const phone = data.phone_no;
            const form_no = data.formNo;

             // Send SMS
           let smsRes = await sendSms(
           phone,
           "ACCEPT_STP",
           [
            memb_name,
            form_no,
            status_label
           ]);
         console.log("SMS Response:", smsRes);
        }catch(err){
          console.log("Error in sending SMS",err);
        }
        } else {
        console.log("SKIPPING SMS");
        }
        resolve(trn_data)
      });
  },
};
