const axios = require('axios'),
dotenv = require("dotenv"),
dateFormat= require("dateformat");
// dotenv.config();
dotenv.config({ path: `.env.${process.env.CLIENT_URL}` });

const SMS_API_KEY = process.env.SMS_API_KEY;
const SMS_SENDER_ID = process.env.SMS_SENDER_ID;
const SMS_USERNAME = process.env.SMS_USERNAME;
const SMS_BASE_URL = process.env.SMS_BASE_URL;

// All SMS templates
const smsTemplates = {
  // MEMBER_ACCEPT_ONLINE: "Dear {#var#}, your membership subscription for Form No {#var#} is accepted. Pay your subscription via {#var#} -Bokaro Steel PWA",

  NEW_MEMBER_ACCEPT_ONLINE: "Dear {#var#}, your membership subscription for Form No {#var#} is accepted. Pay your subscription via {#var#} -Bokaro Steel PWA",
  
  SUBSCRIPTION_END: "Dear {#var#}, your membership subscription for Form No {#var#} is expired. -Bokaro Steel PWA",
  
  FORM_REJECTION: "Dear {#var#}, your membership subscription form number {#var#} has been Rejected. -Bokaro Steel PWA",
  
  FORM_SUBMISSION: "Dear {#var#}, your member subscription form has been successfully submitted. Your form number is {#var#}. -Bokaro Steel PWA",
  
  ACCEPT_STP: "Dear {#var#}, your Super Top Up Policy form no {#var#} has been {#var#}. -Bokaro Steel PWA",
  
  APPROVE_TRANSACTION: "Dear {#var#}, your member subscription Rs. {#var#} is deposited successfully against of Transaction ID {#var#}. -Bokaro Steel PWA",
  
  // FORM_APPROVED: "Dear User, your member subscription form is approved. Please login {#var#} User ID {#var#} Password {#var#}. -Bokaro Steel PWA",

  NEW_SUBSCRIPTION_FORM_APPROVED: "Dear User, your member subscription is approved. Please login https://bspwa.in/#/auth/member_login User ID {#var#} Password {#var#}. -Bokaro Steel PWA",

  
  FORM_ACCEPT: "Dear {#var#}, your member subscription form no {#var#} has been Accepted. -Bokaro Steel PWA",
};

function formatMessage(templateKey, values = []) {
  let msg = smsTemplates[templateKey] || "";
  values.forEach(val => {
    msg = msg.replace("{#var#}", val);
  });
  return msg;
}

async function sendSms(phone, templateKey, values = []) {
  try {
    // console.log(phone,templateKey,values);
    
    // Cleanup phone number
    let cleanPhone = String(phone).replace(/\D/g, "");
    let phone_no = cleanPhone;

    if (cleanPhone.length === 10) 
      phone_no = "91" + cleanPhone;

    if (!/^\d{12}$/.test(phone_no)) {
      throw new Error("Invalid phone number format");
    }

    const textMsg = formatMessage(templateKey, values);
    const url = `${SMS_BASE_URL}?username=${SMS_USERNAME}&apikey=${SMS_API_KEY}&senderid=${SMS_SENDER_ID}&route=OTP&mobile=${phone_no}&text=${encodeURIComponent(textMsg)}`;

    const res = await axios.get(url);
    // console.log(res,'res');
    
    return { success: true, response: res.data };
  } catch (err) {
    console.error("❌ SMS send failed:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
sendSms,smsTemplates
}