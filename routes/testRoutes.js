const express = require("express");
const router = express.Router();
const {
  getUsers,
  getAnything,
  test,
} = require("../controllers/testController");
const middleware = require("../middleware/auth");
router.get("/getusers", getUsers);
router.post("/get", getAnything);
router.get("/test", test);

module.exports = router;
