const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());

let posts = []; // Store messages in memory (capped at 100)

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send existing posts to new users
  socket.emit("loadPosts", posts);

  socket.on("sendPost", (post) => {
    if (!post.username) {
      console.log("Received post without username. Ignoring.");
      return;
    }

    console.log(`New post from ${post.username}: ${post.text || "[Image]"}`);

    // Store the post (limit storage to 100 posts)
    posts.unshift(post);
    if (posts.length > 100) posts.pop();

    io.emit("newPost", post); // Broadcast to all clients
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(4000, "0.0.0.0", () => console.log("Server running on port 4000"));