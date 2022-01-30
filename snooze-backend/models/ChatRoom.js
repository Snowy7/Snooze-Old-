const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatRoomSchema = new Schema({
  name: { type: String, required: true },
  names: { type: Array, default: [] },
  messages: [String],
  users: [String],
  isDM: {
    type: Boolean,
    required: true,
  },
});

const CharRoom = mongoose.model("ChatRoom", chatRoomSchema);

module.exports = CharRoom;
