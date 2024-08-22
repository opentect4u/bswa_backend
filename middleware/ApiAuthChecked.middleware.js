const { verifyToken2 } = require("../utils/jwt.util");

const checkedToken = async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"] || req.headers["authorization"];
    const verifyTokenres = await verifyToken2(token);
    if (verifyTokenres != 0) {
      req.user = verifyTokenres.data.userdata[0];
      next();
    } else {
      res.send({suc:0, msg:"Invalid token"})
      // res.json(sendErrorResponce(null, "invalid token"));
    }
  } catch (error) {
    console.log(error);
    res.send({suc:0, msg:"error data"})
    // res.json(sendErrorResponce(error, "error data"));
  }
};

module.exports = {
  checkedToken,
};
