import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadInCloudinary } from "../utils/cloudinary.fileuploads.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  console.log("username", username);

  //validation check garxa below code le : here only empty filed check gariraxum
  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Please fill all the fields");
  }

  //Check if user already exist : username, email check garney : yo check garna lai chai model bata User import gareko xa ra findOne mongoDb ko query chalako xa
  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "This email or username is already registered");
  }

  //check for images : yesko lagi chai user.routes.js ma middleware multer user gareko xa ra tyaha kehi property haru check gareko xum jastai avatar ra coverImage using .fields methods bata array of object banako xa avatar ra coverImage kai lagi
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
  const user = User.create({
    fullname,
    avatar: avatar.url, //yo field ta hami le compulsory le check garekai xa so yo aauxa nai aauxa
    email,
    coverImage: coverImage?.url || "", //coverimage yeti url ma xa vaney thik xa url bata nikaldiney tara xaina vaney '' empty
    username: username.toLowerCase(), // username lai lowercase mai rakhney
    password,
  });

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

export { registerUser };
