const { v4: uuidv4 } = require("uuid");
const db = require("../db");
/**
 * handleIdentify function
 * -----------------------
 * This function handles identifying users when they connect via a socket.
 * 
 * 1. Listens for an "identify" event from the client.
 * 2. If the client provides a user ID, it uses that; otherwise, it generates a new unique ID using UUID.
 * 3. Logs the identified user ID to the console.
 * 4. Checks if the user exists in the database:
 *      - If the user does not exist, it inserts a new record with:
 *          - id = the userId
 *          - username = "New User"
 *          - email = "user_<userId>@example.com"
 * 5. Uses "INSERT IGNORE" so it won't create duplicates if the user already exists.
 */
function handleIdentify(socket) {
  socket.on("identify", (providedUserId) => {
    socket.userId = providedUserId || uuidv4();
    console.log(`👤 User identified: ${socket.userId}`);
    checkAndInsertUser(socket.userId);
  });

  function checkAndInsertUser(userId) {
    const email = `user_${userId}@example.com`;

    db.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
      if (err) return console.error("DB error (check user):", err);

      db.query(
        "INSERT IGNORE INTO users (id, username, email) VALUES (?,?,?)",
        [userId, "New User", email],
        (err) => {
          if (err) console.error("DB error (insert user):", err);
        }
      );
    });
  }
}

module.exports = handleIdentify;
