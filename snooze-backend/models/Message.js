const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  chatRoom: {
    type: mongoose.Schema.Types.ObjectId,
    required: "Chat room id is required!",
    ref: "ChatRoom",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: "User ID is required!",
    ref: "User",
  },
  content: {
    type: String,
    required: "Message content is required!",
  },
});

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
