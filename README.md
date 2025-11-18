# 🎬 YouTube Title Doctor

An AI-powered workflow that analyzes YouTube channels and generates improved video titles using Claude AI, built on the Motia serverless platform.

## 📋 Overview

YouTube Title Doctor is an event-driven application that:
- Fetches videos from any YouTube channel
- Analyzes video titles using Claude AI
- Generates improved, SEO-optimized titles with rationale
- Sends results via email using Resend

## ✨ Features

- **AI-Powered Analysis**: Uses Anthropic's Claude AI to enhance video titles
- **Channel Resolution**: Supports both channel IDs and usernames
- **Email Delivery**: Sends formatted results with improved titles and explanations
- **Error Handling**: Comprehensive error tracking and notifications
- **Event-Driven Architecture**: Built on Motia's serverless event system

## 🏗️ Architecture

The application follows a 6-step event-driven workflow:

1. **Submit Step** (`01-submit.step.ts`) - API endpoint that accepts channel ID/username and email
2. **Resolve Channel** (`02-resolve-channel.step.ts`) - Converts usernames to channel IDs
3. **Fetch Videos** (`03-fetch-videos.step.ts`) - Retrieves recent videos from YouTube
4. **AI Title Enhancer** (`04-ai-title-inhenser.step.ts`) - Generates improved titles using Claude
5. **Send Email** (`05-send-email.step.ts`) - Delivers results via Resend
6. **Error Handler** (`06-error-handler.step.ts`) - Manages errors and sends notifications

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Motia CLI installed (`npm install -g motia`)
- API Keys:
  - YouTube Data API v3
  - Anthropic API Key
  - Resend API Key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/SumiranBhawsar/youtube_title_doctor.git
cd youtube_title_doctor
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the root directory:

```env
# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Resend Email
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your@domain.com
```

### Configuration

Update `motia.config.ts` with your project settings:

```typescript
export default {
  projectName: "motia-yt",
  region: "us-east-1",
  // ... other configuration
};
```

## 📦 Deployment

### Build the project:
```bash
npm run build
```

### Deploy to Motia Cloud:
```bash
motia deploy
```

## 🔧 Usage

### API Endpoint

Send a POST request to the submit endpoint:

```bash
POST /submit
Content-Type: application/json

{
  "channelId": "UCxxxxxxxxxxxxxx",  // or "username": "@channelname"
  "email": "your@email.com"
}
```

### Response

```json
{
  "jobId": "uuid-v4-job-id",
  "message": "Job submitted successfully"
}
```

### Email Output

You'll receive an email with:
- Original video titles
- AI-improved titles
- Rationale for each improvement
- Direct video links

Example format:
```
Youtube Title Doctor - Improved Titles for [Channel Name]
============================================================

Video 1:
-----------------
Original: my video title
Improved: How to Create Amazing Videos: A Complete Guide
Why: Added clear value proposition and keywords for better SEO
Watch: https://youtube.com/watch?v=...
```

## 🛠️ Development

### Project Structure

```
youtube_title_doctor/
├── steps/
│   ├── 01-submit.step.ts           # API entry point
│   ├── 02-resolve-channel.step.ts  # Channel resolution
│   ├── 03-fetch-videos.step.ts     # YouTube data fetching
│   ├── 04-ai-title-inhenser.step.ts # AI title generation
│   ├── 05-send-email.step.ts       # Email delivery
│   └── 06-error-handler.step.ts    # Error management
├── motia.config.ts                  # Motia configuration
├── package.json
└── README.md
```

### Event Flow

```
yt.submit
    ↓
yt.channel.resolved
    ↓
yt.videos.fetched
    ↓
yt.enhanced.titles
    ↓
yt.email.enhanced.titles
```

### Local Testing

Run individual steps locally:
```bash
motia test steps/01-submit.step.ts
```

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | Yes |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | Yes |
| `RESEND_API_KEY` | Resend email service key | Yes |
| `RESEND_FROM_EMAIL` | Sender email address | Yes |

## 📊 API Reference

### YouTube Data API v3
- **Endpoint**: `https://www.googleapis.com/youtube/v3`
- **Documentation**: https://developers.google.com/youtube/v3

### Anthropic API
- **Model Used**: `claude-sonnet-4-20250514`
- **Documentation**: https://docs.anthropic.com

### Resend API
- **Endpoint**: `https://api.resend.com/emails`
- **Documentation**: https://resend.com/docs

## 🐛 Error Handling

The application includes comprehensive error handling:
- API failures are caught and logged
- Users receive email notifications for errors
- Job status is tracked throughout the workflow
- All errors are stored in the state for debugging

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Motia](https://motia.dev) - Serverless event-driven platform
- Powered by [Anthropic Claude](https://anthropic.com) - AI title generation
- Email delivery by [Resend](https://resend.com)
- YouTube data from [YouTube Data API v3](https://developers.google.com/youtube/v3)

## 📧 Contact

Sumiran Bhawsar - [@SumiranBhawsar](https://github.com/SumiranBhawsar)

Project Link: [https://github.com/SumiranBhawsar/youtube_title_doctor](https://github.com/SumiranBhawsar/youtube_title_doctor)

---

**Made with ❤️ using Motia and Claude AI**
