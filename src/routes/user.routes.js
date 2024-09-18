import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUsercoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/authentication.middleware.js";

const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secure routes
router.route("/logout").post(verifyJWT, logoutUser);

//routes for refresh token generation
router.route("/refresh-token").post(refreshAccessToken);

//routes for changing password
router.route("/change-password").post(verifyJWT, changeCurrentPassword);

//routes for getting current user
router.route("/current-user").get(verifyJWT, getCurrentUser);

//rutes for updating user details
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

//routes for update user avatar
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

//routers for update user coverImage
router
  .route("/update-coverimage")
  .patch(verifyJWT, upload.single("coverImage"), updateUsercoverImage);

//routers for user channel profile
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

//routers for user watch history
router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;
