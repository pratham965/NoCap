![](logo.png)
# NoCap: Digital Misinformation Regulator

A real-time social media platform that automatically flags potential misinformation in text posts and detects tampered images using AI/ML models.

## Features
- **Real-time posting** with Socket.io integration
- **Text validation** using LLM truth assessment
- **Image forgery detection** with deepfake recognition
- **User warnings** with confidence levels and source attribution
- **Persistent usernames** via localStorage
- **Content reporting system** with multiple categories

## Installation

1. **Clone the repository**
```bash
  git clone https://github.com/pratham965/NoCap.git
  cd NoCap
```
2. **Install dependencies**
```bash
  cd frontend && npm install
  cd ../backend-server && npm install
  cd ../MLBackend-server && pip install -r requirements.txt
```
3. **Set up environment variables**
- Get HuggingFace API key
- Make a .env file in MLBackend-server
```bash
  cd MLBackend-server && touch .env
```
- Add HF_API_KEY=your_key
4. **Make script executable**
```bash
  chmod +x NoCap.sh
```
5. **Run the system**
```bash
  ./NoCap.sh
```
