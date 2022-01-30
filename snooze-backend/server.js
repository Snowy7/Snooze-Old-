require("dotenv").config();

const mongoose = require("mongoose");
require("./models/user");
require("./models/ChatRoom");
require("./models/Message");
const socket = require("socket.io");

const app = require("./app");
const jwt = require("jwt-then");

const port = process.env.PORT || 8000;

let server, io;

const Message = mongoose.model("Message");
const User = mongoose.model("User");
const ChatRoom = mongoose.model("ChatRoom");

mongoose.connect(
  process.env.DATABASE,
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  },
  null
);

mongoose.connection.on("error", (err) => {
  console.log("Database Connection ERROR: " + err.message);
});

mongoose.connection.once("open", () => {
  console.log("Database Connected!");
  server = app.listen(port, () =>
    console.log(`Server is up listening to: ${port}`)
  );

  const io = socket(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.query.token;
      const payload = await jwt.verify(token, process.env.SECRET);
      socket.userId = payload.id;
      next();
    } catch (err) {}
  });

  io.on("connection", (socket) => {
    console.log("Connected: " + socket.userId);

    socket.on("disconnect", () => {
      console.log("Disconnected: " + socket.userId);
    });

    socket.on("joinRoom", ({ roomID }) => {
      socket.join(roomID);
      console.log("User joined room: " + roomID);
    });

    socket.on("leaveRoom", ({ roomID }) => {
      socket.leave(roomID);
      console.log("User left room: " + roomID);
    });

    socket.on("sendMessage", async ({ roomID, message }) => {
      const user_ = await User.findById(socket.userId).lean();
      const { password, ...sender } = user_;

      const newMessage = new Message({
        chatRoom: roomID,
        user: socket.userId,
        content: message,
      });

      const room = await ChatRoom.findByIdAndUpdate(roomID, {
        $push: { messages: newMessage._id },
      }).lean();

      if (message.trim().length > 0) {
        io.to(roomID).emit("newMessage", {
          roomID,
          message: newMessage,
          sender,
          userId: socket.userId,
        });
      }

      await newMessage.save();
    });
  });
});

/* const http = require("http");
const server = http.createServer(app);
const mongoose = require("mongoose");
const socket = require("socket.io");

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const dbURL =
  "mongodb+srv://snowy:islamdev123@snowychat.2ls0t.mongodb.net/SnowyChat?retryWrites=true&w=majority";
mongoose
  .connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((results) => {
    console.log("connected to db");
    app.listen(8000, () => console.log("listening on *:8000"));
  })
  .catch((err) => console.log(err));
 */
