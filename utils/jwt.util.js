const jwt = require("jsonwebtoken");
const { secret, ttl } = require("../core/jwt");

const verifyToken = (token) => jwt.verify(token, secret);

const verifyToken2 = (token) => {
  return jwt.verify(token, secret, (err, user) => {
    return err ? 0 : { data: user };
  });
};

const createToken = (data) => jwt.sign(data, secret, { expiresIn: ttl });

module.exports = { verifyToken, verifyToken2, createToken };
