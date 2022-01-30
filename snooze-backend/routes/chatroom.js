const router = require("express").Router();
const { catchErrors } = require("../handlers/errorsHandler");
const chatController = require("../controllers/chatController");

const auth = require("../middlewares/auth");

router.get("/", (req, res) => {
  res.send("Chat API");
});

router.post("/create", auth, catchErrors(chatController.createChatRoom));
router.post("/getall", auth, catchErrors(chatController.getAllChats));
router.post("/tomessages", auth, catchErrors(chatController.toMessages));

module.exports = router;
