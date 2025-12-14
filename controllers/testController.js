// controllers/authController.js
const db = require("../config/db");

exports.getUsers = async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM users");
  res.json({ users: rows });
};
exports.test = async (req, res) => {
  res.json({ users: "this is local test endpoint", status: "ok" });
};
exports.getAnything = async (req, res) => {
  if (!req.body.query) {
    return res.status(400).json({ message: "No query provided" });
  }

  console.log(req.body);
  const [rows] = await db.execute(req.body.query);
  res.json({ data: rows });
};
