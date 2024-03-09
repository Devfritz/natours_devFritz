const express = require("express");
const multer = require("multer");

const upload = multer({ dest: "public/img/users" });

const {
  getMe,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require("../controllers/users");

const {
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
} = require("../controllers/authControllers");

const router = express.Router();

router.post("/signup", signup);
router.get("/logout", logout);
router.post("/login", login);

router.post("/forgotpassword", forgotPassword);
router.patch("/resetpassword/:token", resetPassword);

router.patch("/updatemypassword", protect, updatePassword);
router.get("/me", protect, getMe, getUser);
router.patch("/updateme", protect, uploadUserPhoto, resizeUserPhoto, updateMe);

router.delete("/deleteme", protect, deleteUser);
router.route("/").get(getAllUsers);

router.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
