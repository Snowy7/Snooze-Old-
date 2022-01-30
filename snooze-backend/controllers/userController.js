const mongoose = require("mongoose");
const User = mongoose.model("User");
const sha256 = require("js-sha256");
const jwt = require("jwt-then");

exports.register = async (req, res) => {
  let { username, email, password } = req.body;
  email = email.toLowerCase();

  let user_id = "error";
  const docs = await User.countDocuments();
  user_id = docs;
  if (user_id === "error") {
    throw "Something wrong with the database";
  }
  const emailRegex =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (!emailRegex.test(email)) throw "Email [" + email + "] is not valid.";

  let userExists = await User.findOne({ email });
  if (userExists) throw "User with this email already exist";

  const usernameRegex = /^[A-Za-z][A-Za-z0-9_]{2,19}$/;
  if (!usernameRegex.test(username))
    throw "Username [" + username + "] is not valid.";

  if (password.length < 6) throw "Password must be at least 6 characters long.";
  let tag = "0000";
  if (user_id > 0) tag = "0000".substr(String(user_id).length) + user_id;
  userExists = await User.findOne({ username, tag });
  let i = 1;
  while (userExists) {
    tag = "0000".substr(String(user_id).length + i) + user_id + i;
    userExists = await User.findOne({ username, tag });
    i++;
  }

  const user = new User({
    user_id,
    tag,
    username,
    email,
    password: sha256(password + process.env.SALT),
    bio: "Hello there!",
  });

  await user.save();
  const token = await jwt.sign({ id: user.id }, process.env.SECRET);
  let updatedUser = await User.findOneAndUpdate(
    {
      email,
      password: sha256(password + process.env.SALT),
    },
    { token },
    { upsert: true }
  ).lean();

  res.json({
    message: "User [" + username + "] registered successfully!",
    token,
    id: user.user_id,
    user: updatedUser,
  });
};

exports.login = async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase();

  const user = await User.findOne({
    email,
    password: sha256(password + process.env.SALT),
  });

  if (!user) {
    throw "No account match your details";
  }

  const token = await jwt.sign({ id: user.id }, process.env.SECRET);
  let updatedUser = await User.findOneAndUpdate(
    {
      email,
      password: sha256(password + process.env.SALT),
    },
    { token },
    { upsert: true }
  ).lean();

  delete updatedUser["password"];
  res.json({
    message: "User logged in successfully!",
    token,
    id: user.user_id,
    user: updatedUser,
  });
};

exports.getUser = async (req, res) => {
  const { token, id } = req.body;
  const userExists = await User.findOne({ token }).lean();

  if (!userExists) {
    res.json({
      code: "404",
      message: "Could not find user with token: " + token,
    });
    throw "Could not find user with id: " + token;
  } else {
    const { password, ...user } = userExists;
    res.json({
      code: "200",
      message: "User Found successfully!",
      user,
    });
  }
};

exports.sendFriendRequest = async (req, res) => {
  const { token, friend } = req.body;

  let otherName = friend.split("#");
  let tag = otherName[1],
    username = otherName[0];

  const userExists = await User.findOne({ token }).lean();
  if (!userExists)
    throw "Something is wrong with your token please try again later!";

  const id = userExists._id.toString();

  const otherFriend = await User.findOneAndUpdate(
    { tag, username },
    {
      $addToSet: { requests: id },
    }
  ).lean();

  if (!otherFriend)
    throw "Could not find " + friend + ", Check usename and try again!";

  const newToken = await jwt.sign({ id }, process.env.SECRET);

  const user = await User.findOneAndUpdate(
    { token },
    {
      $addToSet: { pending: otherFriend._id.toString() },
      token: newToken,
    }
  ).lean();

  res.json({
    message: "Send Request to " + friend + "Successfully!",
    user: user,
    token: newToken,
  });
};

exports.acceptFriendRequest = async (req, res) => {
  const { token, friend } = req.body;

  let otherName = friend.split("#");
  let tag = otherName[1],
    username = otherName[0];

  const userExists = await User.findOne({ token }).lean();
  const friendExists = await User.findOne({ tag, username }).lean();
  if (!userExists)
    throw "Something is wrong with your token please try again later!";

  if (!friendExists)
    throw "Can not find your friend, maybe deleted account !?!";

  const id = userExists._id.toString();

  const otherFriend = await User.findOneAndUpdate(
    { tag, username },
    {
      $push: { friends: id },
      $pull: { pending: id },
    }
  ).lean();

  if (!otherFriend)
    throw "Could not find " + friend + ", Check usename and try again!";

  const newToken = await jwt.sign({ id }, process.env.SECRET);

  const user = await User.findOneAndUpdate(
    { token },
    {
      $push: { friends: otherFriend._id.toString() },
      $pull: { requests: otherFriend._id.toString() },
      token: newToken,
    }
  ).lean();

  res.json({
    message: "Added " + friend + " to your Homies list!",
    user: user,
    token: newToken,
  });
};

exports.toUsers = async (req, res) => {
  const { users } = req.body;
  const newUsers = [];
  for (let i = 0; i < users.length; i++) {
    var _id = users[i];
    const user = await User.findById(_id).lean();
    if (user) {
      const { password, ...finalUser } = user;
      newUsers.push(finalUser);
    }
  }

  if (!newUsers.length < 0) {
    res.json({
      code: "404",
      message: "Could not find any user with the given id's",
    });
    throw "Could not get the users list";
  } else {
    res.json({
      code: "200",
      message: "Users Loaded successfully!",
      users: newUsers,
    });
  }
};
