const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    token: {
      type: String,
    },

    user_id: {
      type: Number,
      required: true,
    },

    tag: { type: String, required: true },

    username: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    friends: [String],

    servers: [String],

    requests: [String],

    pendings: [String],

    opened_dm: [String],

    bio: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
