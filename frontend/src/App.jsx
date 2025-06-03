import { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";
import Header from "./Header";

const socket = io("http://localhost:4000", {
  transports: ["websocket"],
  reconnection: true,
});

export default function App() {
  const [posts, setPosts] = useState([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [isUsernameSet, setIsUsernameSet] = useState(!!username);
  const [isConnected, setIsConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState([]);

  const handleCheckboxChange = (reason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((item) => item !== reason)
        : [...prev, reason]
    );
  };

  const reportOptions = [
    "False Information",
    "Hate Speech",
    "Spam",
    "Harassment",
    "Forged Content",
    "Other",
  ];

  const handleSubmit = () => {
    alert(`✅ Report has been submitted!`);
    setShowModal(false);
    setSelectedReasons([])
  };

  const saveUsername = () => {
    if (username.trim()) {
      localStorage.setItem("username", username);
      setIsUsernameSet(true);
    }
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected!");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected!");
      setIsConnected(false);
    });

    socket.on("newPost", (post) => {
      setPosts((prevPosts) => [post, ...prevPosts]);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("newPost");
    };
  }, []);



  const handlePost = async () => {
    console.log("Clicked")
    if (input.trim() || image) {
      let isValid = true; // Default to true
      let isSuspicious = false; // Tracks if the user overrides validation

      const newPost = {
        username,
        text: input,
        image,
        id: Date.now(),
      };

      if (input.trim()) {
        try {
          const response = await fetch("http://127.0.0.1:8000/validate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ statement: input }),
          });

          const validationResult = await response.json();
          console.log(typeof validationResult)
          console.log(validationResult)
          if (!validationResult['result']) {
            isValid = false; // Mark as invalid
            newPost.explanation = validationResult['explanation']
            newPost.source = validationResult["source"]
            const confidenceValue = parseInt(validationResult["confidence"]); // Convert "90%" to 90
            newPost.confValue = confidenceValue
            switch (true) {
              case confidenceValue >= 90:
                newPost.message = "This message is completely false. Do not trust or share!"
                break;
              case confidenceValue >= 80:
                newPost.message = "Severely misleading content! Spreading this message can contribute to misinformation."
                break;
              case confidenceValue >= 70:
                newPost.message = "This message is mostly false. It may have some truth, but it's heavily distorted.."
                break;
              case confidenceValue >= 60:
                newPost.message = "Caution: This message is from an unreliable source and is likely misleading."
                break;
              case confidenceValue >= 50:
                newPost.message = "Warning: This message contains a high amount of misinformation. Cross-check sources!"
                break;
              default:
                newPost.message = ""
            }
            const userChoice = window.confirm(
              `❌ Validation Failed!\n\nExplanation: ${validationResult["explanation"]}\nConfidence: ${validationResult["confidence"]}%\nSource: ${validationResult["source"]}\n\nDo you still want to post?`
            );

            if (userChoice) {
              isSuspicious = true; // User wants to post despite invalidation
            }
          }
        } catch (error) {
          console.error("Error validating statement:", error);
          isValid = false;
        }
      } else if (image) {
        const blob = await fetch(image).then((res) => res.blob());
        const formData = new FormData();
        formData.append("file", blob, "resized-image.jpg");
        try {
          const response = await fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            body: formData, // Content-Type is auto-handled
          });

          const result = await response.json();
          console.log(result)
          if (result) {
            const deepfakeScore = result.find(r => r.label === "Deepfake")?.score || 0;
            const artificialScore = result.find(r => r.label === "Artificial")?.score || 0;
            if (deepfakeScore>0.5 || artificialScore>0.5) {
              isValid = false
              const maxScore = Math.max(deepfakeScore, artificialScore);
              const userChoice = window.confirm(
                `The image is detected to be deepfaked with a score of ${parseInt(maxScore * 100)}%. Do you still want to post?`
              );
              if (userChoice) {
                newPost.message = "This image may be forged"
                isSuspicious = true
              }
            }
          } else {
            throw Error("Failed to analyze the image.")
          }
        } catch (error) {
          alert("Failed to analyze the image. Please try again.");
        }
      }
      // If post is valid OR user overrides validation, send the post
      if (isValid || isSuspicious) {
        newPost.suspicious = isSuspicious; // Add suspicious flag if overridden
        socket.emit("sendPost", newPost);
        console.log(newPost)
      }
      setInput("");
      setImage(null);
      document.getElementById("fileInput").value = "";
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <Header />
      <div className="app">
        {!isUsernameSet ? (
          <div className="username-box">
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button onClick={saveUsername}>Save</button>
          </div>
        ) : (
          <>
            <div className="post-box" style={{border: "1px solid black"}}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What's happening?"
                style={{border: "1px solid black"}}
              ></textarea>
              <input type="file" accept="image/*" onChange={handleImageUpload} id="fileInput"/>
              {image && <img src={image} alt="Preview" className="preview" />}
              <button onClick={handlePost}>Post</button>
            </div>
            <div className="posts">
              {posts.map((post) => (
                <div key={post.id} className="post" style={{border: "1px solid black"}}>
                  <div className="top-bar">
                    <img src="user.png" height={20}/>
                    <strong className="username">{post.username}</strong>
                    <button style={{ background: "none" }}><img src="report.png" height={20}  title="Report" onClick={() => { setShowModal(true) }} /></button>
                    {showModal && (
                      <div
                        style={{
                          position: "fixed",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          backgroundColor: "white",
                          padding: "20px",
                          borderRadius: "8px",
                          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                          width: "320px",
                          zIndex: 1000
                        }}
                      >
                        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" }}>
                          Report Post
                        </h2>

                        {/* Checkboxes */}
                        {reportOptions.map((option, index) => (
                          <label key={index} style={{ display: "block", marginBottom: "8px" }}>
                            <input
                              type="checkbox"
                              value={option}
                              checked={selectedReasons.includes(option)}
                              onChange={() => handleCheckboxChange(option)}
                              style={{ marginRight: "8px" }}
                            />
                            {option}
                          </label>
                        ))}

                        {/* Buttons */}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                          <button
                            style={{
                              backgroundColor: "#ccc",
                              padding: "8px 12px",
                              borderRadius: "4px",
                              marginRight: "8px",
                              border: "none",
                              cursor: "pointer"
                            }}
                            onClick={() => setShowModal(false)}
                          >
                            Cancel
                          </button>
                          <button
                            style={{
                              backgroundColor: "#e53e3e",
                              color: "white",
                              padding: "8px 12px",
                              borderRadius: "4px",
                              border: "none",
                              cursor: "pointer",
                              opacity: selectedReasons.length === 0 ? 0.5 : 1
                            }}
                            onClick={handleSubmit}
                            disabled={selectedReasons.length === 0}
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                  {post.text && <p>{post.text}</p>}
                  {post.image && <img src={post.image} alt="Post" className="post-image" />}
                  {post.suspicious && <p className="sus-text"><img src="info.png" height={15} title={`${post.explanation} \nSource: ${post.source} \nUnreliability: ${post.confValue}%`} />{post.message}</p>}
                  <div className="activity-bar">
                    <img src="thumbsUp.png" height={20} />
                    <img src="comment.png" height={20} />
                    <img src="share.png" height={20} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}