const express = require("express");
var app = express(),
  fs = require("fs"),
  path = require("path"),
  port = process.env.PORT || 3001,
  dotenv = require("dotenv"),
  cors = require("cors");

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SET ASSETS AS A STATIC PATH //
app.use(express.static(path.join(__dirname, "assets/")));

const fileUpload = require("express-fileupload");

app.use(fileUpload());

const { LoginRouter } = require("./routes/api/LoginRouter");
const { admin_fee_typeRouter } = require("./routes/api/admin_fee_typeRouter");
const { masterRouter } = require("./routes/api/masterRouter");
const { generalRouter } = require("./routes/api/general_formRouter");
const { lifeRouter } = require("./routes/api/life_formRouter");
const { associateRouter } = require("./routes/api/associate_formRouter");
const { group_policyRouter } = require("./routes/api/group_policyRouter");
const { super_policyRouter } = require("./routes/api/super_policyRouter");
const { SubsDepoRouter } = require("./routes/api/subs_depo_router");
const { reportRouter } = require("./routes/api/reportRouter");
const { memberRouter } = require("./routes/api/memberRouter");
const { password_change } = require("./routes/api/password_change");
const { add_adminRouter } = require("./routes/api/add_adminRouter");
const { memberPolicyRouter } = require("./routes/api/memberPolicyRouter");
const { cronRouter } = require("./routes/cronRouter");
const { payRouter } = require("./routes/api/payRouter");
const { whatsappRouter } = require("./routes/api/whatsappRouter");

app.use(LoginRouter);
app.use("/fee", admin_fee_typeRouter);
app.use("/master", masterRouter);
app.use(generalRouter);
app.use(lifeRouter);
app.use(associateRouter);
app.use(group_policyRouter);
app.use(super_policyRouter);
app.use(SubsDepoRouter);
app.use(reportRouter);
app.use(memberRouter);
app.use(memberPolicyRouter);
app.use(password_change);
app.use(add_adminRouter);
app.use(payRouter)
app.use('/cron', cronRouter)
app.use(whatsappRouter)

app.listen(port, (err) => {
  if (err) throw new Error(err);
  else
    console.log(
      `App is running in ${process.env.NODE_ENV} mode at http://localhost:${port}`
    );
});
