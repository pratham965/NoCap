import streamlit as st
import requests
from PIL import Image
import io

# Session state for posts and user
if 'posts' not in st.session_state:
    st.session_state.posts = []

if 'username' not in st.session_state:
    st.session_state.username = None

st.set_page_config(page_title="Deepfake Analyzer", layout="centered")

# Login UI
def login():
    st.title("Login")
    username = st.text_input("Enter your username")
    if st.button("Login") and username:
        st.session_state.username = username
        st.success(f"Welcome, {username}!")

# Post creation UI
def create_post():
    st.title("Create a Post")
    text = st.text_area("What's on your mind?")
    image_file = st.file_uploader("Upload an image (optional)", type=["png", "jpg", "jpeg"])

    if st.button("Post"):
        is_fake_text = False
        is_fake_image = False
        validation_override = False

        if text.strip():
            try:
                res = requests.post("http://127.0.0.1:8000/validate", json={"text": text})
                is_fake_text = res.json().get("is_fake", False)
            except Exception as e:
                st.warning("Text validation failed (backend might be down).")

        if image_file:
            try:
                files = {"file": image_file.getvalue()}
                res = requests.post("http://127.0.0.1:8000/predict", files=files)
                is_fake_image = res.json().get("is_fake", False)
            except Exception as e:
                st.warning("Image validation failed (backend might be down).")

        if is_fake_text or is_fake_image:
            st.warning("This post may contain fake content.")
            if st.checkbox("Post anyway?"):
                validation_override = True
            else:
                return

        # Store the post
        post = {
            "author": st.session_state.username,
            "text": text,
            "image": image_file.read() if image_file else None,
            "is_fake_text": is_fake_text,
            "is_fake_image": is_fake_image,
            "override": validation_override
        }
        st.session_state.posts.insert(0, post)
        st.success("Post submitted!")

# Display all posts
def display_posts():
    st.title("Feed")
    if not st.session_state.posts:
        st.info("No posts yet.")
    for i, post in enumerate(st.session_state.posts):
        st.subheader(f"Post #{len(st.session_state.posts)-i} by {post['author']}")
        if post["text"]:
            st.write(post["text"])
        if post["image"]:
            st.image(Image.open(io.BytesIO(post["image"])), use_column_width=True)
        if post["is_fake_text"] or post["is_fake_image"]:
            st.error("⚠️ Warning: This post may contain fake content.")
            if post["is_fake_text"]:
                st.markdown("• **Text was flagged as fake**")
            if post["is_fake_image"]:
                st.markdown("• **Image was flagged as fake**")
        st.markdown("---")

# Main logic
def main():
    if st.session_state.username is None:
        login()
    else:
        create_post()
        display_posts()

main()

