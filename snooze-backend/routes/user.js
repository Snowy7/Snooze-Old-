const router = require("express").Router();
const { catchErrors } = require("../handlers/errorsHandler");
const userController = require("../controllers/userController");

router.get("/", (req, res) => {
  res.send("User API");
});

router.post("/login", catchErrors(userController.login));
router.post("/register", catchErrors(userController.register));
router.post("/getuser", catchErrors(userController.getUser));
router.post("/tousers", catchErrors(userController.toUsers));
router.post(
  "/sendfriendrequest",
  catchErrors(userController.sendFriendRequest)
);

router.post(
  "/acceptfriendrequest",
  catchErrors(userController.acceptFriendRequest)
);

module.exports = router;
