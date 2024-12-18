const express = require("express");
const router = express.Router();
const requireToken = require("../middlewares/verifyToken");
const multer = require("multer");

const {
  registerController,
  loginController,
  verifyController,
  forgetPassword,
  resetPassword,
  logout,
  getProfile,
  editProfile,
  deleteAccountController,
  upgradeController,
} = require("../controllers/userController");

//multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Set the destination folder for file uploads
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Use the original filename
  },
});
const upload = multer({
  storage: storage,
});

router.post("/register", upload.single("profilePhoto"), registerController);
router.post("/login", loginController);
router.post("/confirm/:userID", verifyController);
router.get("/profile", requireToken, getProfile);
router.put("/edit-user/", upload.single("image"), requireToken, editProfile);
router.post("/forget-password", forgetPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/logout", logout);
// router.delete("/", requireToken, deleteAccountController); 
// router.put("/upgrade/:userId", requireToken, upgradeController)

module.exports = router;