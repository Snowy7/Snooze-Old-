const mongoose = require("mongoose");
const ChatRoom = mongoose.model("ChatRoom");
const Message = mongoose.model("Message");
const User = mongoose.model("User");
const sha256 = require("js-sha256");
const jwt = require("jwt-then");

exports.createChatRoom = async (req, res) => {
  const { token, name, names, usersIds, isDM } = req.body;

  if (!usersIds || usersIds.length > 2) {
    throw "No users specified";
    return;
  }

  let otherId;

  const user = await User.findOne({ token }).lean();
  if (!user) throw "Something is wrong with your token please try again later!";
  const newToken = await jwt.sign({ id: user.id }, process.env.SECRET);

  let chatRoomExist = null;
  if (isDM) {
    chatRoomExist = await ChatRoom.findOne({
      users: { $all: usersIds },
    }).lean();
  }
  if (chatRoomExist) {
    res.json({
      code: "200",
      message: "A Chat room with that homie already exists!",
      room: chatRoomExist,
      user: user,
      token: newToken,
    });
    return;
  } else {
    let chatRoom = new ChatRoom({
      name,
      names: [
        { name: names[0].name, id: names[0].id },
        { name: names[1].name, id: names[1].id },
      ],
      users: usersIds,
      isDM,
    });
    await chatRoom.save();

    res.json({
      code: "200",
      message: "Created a new Chat Successfully!",
      room: chatRoom,
      user: user,
      token: newToken,
    });
  }
};

exports.getAllChats = async (req, res) => {
  const { token } = req.body;
  const user = await User.findOne({ token }).lean();
  if (!user) throw "Something is wrong with your token please try again later!";

  const rooms = await ChatRoom.find({
    users: { $in: [user._id.toString()] },
  });

  res.json({
    code: "200",
    message: "Got the full list of rooms!",
    rooms,
  });
};

exports.toMessages = async (req, res) => {
  const { token, messages, roomID } = req.body;
  let newMessages = [];
  for (let i = 0; i < messages.length; i++) {
    var _id = messages[i];
    const message = await Message.findById(_id).lean();

    if (message) {
      const sender = await User.findById(message.user).lean();
      if (!sender) throw "Something is wrong with message sender";
      newMessages.push({
        roomID,
        message,
        sender,
        userId: sender._id,
      });
    }
  }

  if (!newMessages.length < 0) {
    res.json({
      code: "404",
      message: "Could not find any messages",
      messages: [],
    });
    throw "Could not get the messages list";
  } else {
    res.json({
      code: "200",
      message: "Messages Loaded successfully!",
      messages: newMessages,
    });
  }
};
