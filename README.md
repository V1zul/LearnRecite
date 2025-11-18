# 📖 LearnToRecite

A modern web application for learning Quranic recitation with AI-powered feedback. Master Tajweed rules and explore different Qira'at (recitation styles) with real-time correction and guidance.

## Features

### 🎯 Tajweed Practice
- **Real-time Speech Recognition**: Record your recitation and get instant feedback
- **AI-Powered Correction**: Uses Google Gemini AI to analyze your pronunciation and tajweed rules
- **Verse Selection**: Practice with pre-loaded verses or use custom text
- **Detailed Feedback**: Receive comprehensive analysis including:
  - Accuracy score
  - Specific tajweed errors
  - Pronunciation corrections
  - Areas of improvement
  - Correctly applied rules

### 🎵 Learn Qeerat
- **10 Different Qira'at Styles**: Explore various recitation methods including:
  - Hafs 'an 'Asim (Most common)
  - Warsh 'an Nafi'
  - Qaloon 'an Nafi'
  - Ibn Kathir
  - Abu 'Amr
  - And more...
- **Side-by-Side Comparison**: Compare different recitation styles
- **AI Tutor**: Ask questions about qira'at and get expert explanations
- **Educational Content**: Learn about the history and characteristics of each style

## Setup Instructions

### Prerequisites
- A modern web browser (Chrome, Edge, or Safari recommended for speech recognition)
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone or download this repository**

2. **Get your Google Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key
   - Copy the API key

3. **Configure the API Key**

   **Option 1: Using .env file (Recommended)**
   ```bash
   # Create a .env file in the project root
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```

   **Option 2: Browser Prompt**
   - When you first open the app, you'll be prompted to enter your API key
   - The key will be stored in your browser's localStorage

4. **Run the Application**

   **Option 1: Using a Local Server (Recommended)**
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Or using Node.js (if you have http-server installed)
   npx http-server -p 8000
   ```

   **Option 2: Direct File Access**
   - Simply open `index.html` in your browser
   - Note: Some features may be limited due to CORS restrictions

5. **Access the Application**
   - Open your browser and navigate to `http://localhost:8000`
   - Or open `index.html` directly if using direct file access

## Usage

### Tajweed Practice

1. **Select a Verse**
   - Choose from the dropdown menu or select "Custom Text" to practice your own verse

2. **Start Recording**
   - Click "Start Recording" button
   - Grant microphone permissions when prompted
   - Recite the verse clearly

3. **Stop Recording**
   - Click "Stop Recording" when finished
   - Wait for AI analysis (usually takes a few seconds)

4. **Review Feedback**
   - Read the detailed feedback provided by the AI
   - Focus on areas that need improvement
   - Practice again to improve your score

5. **Play Reference Audio**
   - Click "Play Reference" to hear the correct pronunciation
   - Use this to compare with your recitation

### Learn Qeerat

1. **Select a Qira'at Style**
   - Choose from the dropdown menu
   - Read about its characteristics and history

2. **Compare Styles**
   - Use the comparison section to see differences
   - Play audio examples of different styles

3. **Ask the AI Tutor**
   - Type questions in the chat interface
   - Get expert explanations about qira'at
   - Learn about pronunciation differences and historical context

## Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Safari**: Full support
- **Firefox**: Limited speech recognition support
- **Mobile Browsers**: Works on iOS Safari and Chrome Android

## API Key Security

⚠️ **Important**: Never commit your API key to version control!

- The `.env` file is included in `.gitignore` (if using git)
- API keys stored in localStorage are browser-specific
- For production, use environment variables or secure key management

## Technical Details

### Technologies Used
- **HTML5**: Structure and semantic markup
- **CSS3**: Modern styling with gradients and animations
- **JavaScript (ES6+)**: Core functionality
- **Web Speech API**: Speech recognition for recording
- **Google Gemini API**: AI-powered analysis and feedback
- **Web Speech Synthesis**: Audio playback

### API Integration
- Uses Google Gemini Pro model for text generation
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- Requires API key for authentication

## Troubleshooting

### Speech Recognition Not Working
- Ensure you're using Chrome, Edge, or Safari
- Check microphone permissions in browser settings
- Make sure you're using HTTPS or localhost (required for some browsers)

### API Key Issues
- Verify your API key is correct
- Check if you have API quota remaining
- Ensure the key has access to Gemini Pro model

### No Feedback Appearing
- Check browser console for errors
- Verify API key is configured correctly
- Ensure you have internet connection

## Future Enhancements

- [ ] Support for more verses and surahs
- [ ] Audio file upload for analysis
- [ ] Progress tracking and statistics
- [ ] Multiple language support
- [ ] Offline mode with local AI models
- [ ] Integration with Quranic audio databases
- [ ] Advanced tajweed rule visualization
- [ ] User accounts and saved progress

## Disclaimer

This application is for educational purposes only. While the AI provides guidance based on established tajweed rules and qira'at knowledge, it should not replace learning from qualified teachers. Always verify corrections with knowledgeable scholars.

## License

This project is open source and available for educational use.

## Support

For issues, questions, or contributions, please open an issue in the repository.

---

**May Allah accept our efforts and make this a beneficial tool for learning His Book. Ameen.**

