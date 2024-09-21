import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadInCloudinary } from "../utils/cloudinary.fileuploads.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

//refresh and access token generation method
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); //yesle chai kun field lai set garney ho garxa ra save garnu aagadi validation gardaina validataBeforeSave le| yesma chaidaina pani kina vaney refreshToken generate gareko tyo refresh token lai validation garirakhnu pardaina generate ko case ma chai
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend or postman thunderclient
  //validation -not empty
  //check if user already exist :username , email
  //check for images, check for avatar
  //upload them to cloudinary, avatar check garney upload vayo ki vayena vanera
  //create user object -create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return response

  //get user details from frontend or postman thunderclient
  const { username, email, fullname, password } = req.body;
  console.log(req.body);

  //validation check garxa below code le : here only empty filed check gariraxum
  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill all the fields");
  }

  //Check if user already exist : username, email check garney : yo check garna lai chai model bata User import gareko xa ra findOne mongoDb ko query chalako xa
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  console.log(existedUser);

  if (existedUser) {
    throw new ApiError(409, "This email or username is already registered");
  }

  //check for images : yesko lagi chai user.routes.js ma middleware multer user gareko xa ra tyaha kehi property haru check gareko xum jastai avatar ra coverImage using .fields methods bata array of object banako xa avatar ra coverImage kai lagi
  console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log(avatarLocalPath);
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;  //yo code ma chai k error hunxa vaney req.files le chai coverImage expect garxa ra yedi tyo vetayena vaney ta undefined vayo ra API testing garda tyaha error aauney vayo to resolve this

  //safe side vayo yo chai .. traditional tarika le check garim hami ley coverImageLocalPath ko lagi chai using Array.isArray() method
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  //check for avatar : if not found then throw custom ApiError with avatar image is required
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  //upload garney cloudinary with localpath and also check if avatar is available or not
  const avatar = await uploadInCloudinary(avatarLocalPath);
  const coverImage = await uploadInCloudinary(coverImageLocalPath);

  //check if avatar is availabe or not if not then throw the error before storing in database
  if (!avatar) {
    throw new ApiError(400, "Avatar image is not available");
  }

  //create user object and entry in database with certain condion of following
  const user = await User.create({
    fullname,
    avatar: avatar.url, //yo field ta hami le compulsory le check garekai xa so yo aauxa nai aauxa
    email,
    coverImage: coverImage?.url || "", //coverimage yeti url ma xa vaney thik xa url bata nikaldiney tara xaina vaney '' empty
    username: username.toLowerCase(), // username lai lowercase mai rakhney
    password,
  });
  console.log(user);

  //remove password and refreshToken field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //check if there is some internal server error while registering or not
  if (!createdUser) {
    throw new ApiError(
      500,
      "something went wrong while registering the users "
    );
  }

  //res send gardiney aba successfully vanera . ApiResponse.js ma banako 'ApiResponse' class user garera
  return res
    .status(401)
    .json(new ApiResponse(201, createdUser, "user registered successfully !"));
});

const loginUser = asyncHandler(async (req, res) => {
  //req body bata data liney
  //username or email lai liney
  //find the user. tyo user xa ki xaina vanera
  //password check garney if wrong password then throw password is incorrect
  //access and refresh token generate garney
  //send cookie . secure cookie respond gardiney

  //req body bata data leko ho yo chai
  const { username, email, password } = req.body;
  console.log(username, email, password);

  //check garney username or email xa ki xaina vanera herney
  if (!email && !username) {
    throw new ApiError(400, "username or email password is required");
  }

  //user xa ki xaina vanera find garney database bata . here ki ta email ki ta username xa vaney dinxa
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  //password check garney .. schema bata isPasswordCorrect methods user garna panxa
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentaials");
  }

  //access ra refresh token generate garney : yesko lagi method banayo vaney sajilo hunxa top ma xa yesko lagi method
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //aba user ma ta sabai field access hunxa yaha chai ki ta database query lai chalauney that may be costly in case of time or direct update garauney . password field ra accessToken lai ta exclude garda hunxa login garda user lai tyo information dinu vayena

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //aba cookie lai set garney . yaha httpOnly le chai secure garauxa ra front end side bata change garna mildaina serverside matra herxa
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // middle ware banayim authentication ko lagi ra naya object add garim user vanera aba user sanga access xa id ko ra dbquery garera set operation user gareko xum
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out Successfully!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //front end bata aairaheko refresh token lai ki ta cookies bata liney wa body bata aairaheko request lai store garney variable ma
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  //yedi tyo incommingrefresh xaina vaney yo garney
  if (!incommingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    //aba chai tyo incomming refresh token chai verified xa ki xaina teslai decode garney. with jwt.verify(aairahekoreq, refreshtokensecret ) yeti user garera
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    //aba dabasase sanga query garney tyo decodedToken ko id find garney ra user ma rakhdiney
    const user = await User.findById(decodedToken?._id);
    // console.log(user); user ma chai k k hunxa vanera check gareko hami le

    //aba yedi tyo id vako user nai xaina vaney invalid token diney
    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }

    // console.log(`your incomming refresh token is : ${incommingRefreshToken}`); //check gareko error aako thiyo ani
    // console.log(`Your user refreshToken is : ${user?.refreshToken}`);

    //aba chai compare garney yedi tyo incomming refreshToken ra databasema vako refreshToken match garena vaney error throw garney
    if (!(incommingRefreshToken === user?.refreshToken)) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    //match garyo vaney aba accessToken ra refreshToken generate gardiney yo method bata jun chai aagadi nai banako xum hami le
    const { accessToken, newrefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    //cookie ko lagi secure channel set garney
    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access token is refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  //req.body bata oldPassword ra newPassword liney ho
  const { oldPassword, newPassword } = req.body;

  //password change gardai xum vaney ta user already logged in nai huney vayo so req.user middleware ma hami le user vanera set gareko xum ra yo database sanga liney
  const loggedUser = await User.findById(req.user?._id);

  //yaha chai loggedUser ko password match gareko usermodel ma vako isPasswordCorrect vanney method bata ra oldpassword as an argument pass garako xa
  const oldPasswordCorrect = await loggedUser.isPasswordCorrect(oldPassword);
  if (!oldPasswordCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }

  // console.log(`you are going to change the oldPassword: ${oldPassword} with newPassword : ${newPassword}`)//yaha chai check gareko hai ta k kasto ho old password kasari aayo new password kasari save garney vanera

  //set the newPassword into password field of database and save it without validation . yesle chai k garyo vaney user schema bata pre hooks chalaidiyo mongodb ko ra just before save password pani hash huney vayo yo case ma
  loggedUser.password = newPassword;
  console.log(`changed password is : ${loggedUser.password}`);
  await loggedUser.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully "));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  //current user lai line ko lagi ta req.user vanney middleware bata lida hunxa  kina vaney yedi user logged in xa vaney ta req.user lai hami le set gareko xum
  //direct return garda vayo res lai with the help of req.user as a data in json

  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  //req.body bata data liney kun kun field lai update garauney vanera
  const { fullname, email } = req.body;
  // console.log(fullname, email);for checking

  //check if there is no fullname and email then
  if (!(fullname || email)) {
    throw new ApiError(400, "Please provide at least one field to update");
  }

  //now from mongodb check the user id and update the required field
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname: fullname,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user },
        "Updated fullname or email  or both || account details updates successfully "
      )
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  //aba yaha ta file upload garnu parney hunxa so : yaha ko case ma hami only avatar update gardai xum so file is needed : req.file?.path

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "give correct avatar file");
  }

  const avatar = await uploadInCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading an avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  //TODO: old avatar image lai chai sabai kaam sake paxi delete garda vayo by finding the old url and deleting it from cloudinary

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

const updateUsercoverImage = asyncHandler(async (req, res) => {
  //aba yaha ta file upload garnu parney hunxa so : yaha ko case ma hami only coverImage update gardai xum so file is needed : req.file?.path

  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "give correct coverImage file path");
  }

  //cloudinary ma upload garayo yo method le uploadInCloudinary which is already created inside utils with file name cloudinary.fileuploads.js
  const coverImage = await uploadInCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading a coverImage");
  }

  //database ma query garera update gardiney aba ko nay coverImage ko url from cloudinary service bata
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  //hami lai yedi kunai user ko username nikalnu xa vaney user ko profile bata url liney ra tes bata chai username nikalney
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  //aba database ma find method garera username nikalney ani pheri _id bata aggregation pipeline linu vanda ramro . aggregate use garney ra multiple pipeline create garney find ko lagi . $match user garda hunxa ra yo aggregation le array return garxa
  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        //lookup performs left outer join of the related documents and returns the array
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel", //channel select garyo vaney subscribers lina sakinxa
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions", //mongodb le small letter and plural form ma convert garxa .. uta model chai Subscription xa yeslai hami le aafai subscriptions vanera banaidiney
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        //The addFields operator is used to add new fields to documents within the aggregation pipeline.
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        email:1,
        avatar:1,
        coverImage:1,
      },
    },
  ]);

  console.log(channel);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "user channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  //it is done with the help of mongodb operation . 'req.user._id' behind the scene yesle chai string dinxa database bata mongoose le object id lai convert garera id dinxa
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUsercoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
