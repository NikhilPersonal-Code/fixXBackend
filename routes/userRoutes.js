const express = require("express");
const router = express.Router();
const { updateProfile } = require("../controllers/userController");
const upload = require("../middleware/upload");

// Using PATCH for updating a resource is a good practice.
// The upload.single('profileImage') middleware will handle the file upload.
// 'profileImage' should be the name of the field in your form-data.
router.patch(
  "/updateprofile/:userId",
  upload.single("profileImage"),
  updateProfile
);

module.exports = router;
