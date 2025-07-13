# AWS Certification Practice Tests

A modern, interactive MCQ (Multiple Choice Questions) application designed to help users prepare for AWS certification exams. Built with React and featuring a beautiful dark theme interface.

## ✨ Features

### 🏠 Landing Page
- **Modern Dark Theme**: Beautiful gradient backgrounds with glassmorphism effects
- **Certification Selection**: Choose from various AWS certification paths
- **Coming Soon Modal**: Informative modal for upcoming certifications
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

### 🧠 MCQ Quiz Interface
- **Interactive Questions**: Multiple choice questions with visual feedback
- **Multiple Selection Support**: Handle both single and multiple correct answers
- **Real-time Scoring**: Track your progress throughout the quiz
- **Immediate Feedback**: See correct/incorrect answers instantly
- **Progress Tracking**: Visual progress bar showing quiz completion
- **Smooth Navigation**: Auto-scroll to top when moving between questions

### 🎯 Available Certifications
- **AWS DVA-C02**: AWS Certified Developer - Associate (Available Now)
- **AWS SAA-C03**: AWS Certified Solutions Architect - Associate (Coming Soon)
- **AWS SOA-C02**: AWS Certified SysOps Administrator - Associate (Coming Soon)
- **AWS CLF-C02**: AWS Certified Cloud Practitioner (Coming Soon)

## 🚀 Live Demo

Visit the live application: [AWS Practice Tests](https://heyom.github.io/aws-questions-mcq)

## 🛠️ Technology Stack

- **React 19.1.0**: Modern React with hooks and functional components
- **CSS3**: Custom styling with modern features like backdrop-filter and gradients
- **JavaScript ES6+**: Modern JavaScript features and async/await
- **GitHub Pages**: Hosting and deployment

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/heyom/aws-questions-mcq.git
   cd aws-questions-mcq
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to view the application

## 🚀 Deployment to GitHub Pages

### Prerequisites
- A GitHub account
- The repository pushed to GitHub

### Deployment Steps

1. **Install gh-pages package** (already added to package.json)
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Deploy to GitHub Pages**
   ```bash
   npm run deploy
   ```

3. **Configure GitHub Pages**
   - Go to your repository on GitHub
   - Navigate to Settings → Pages
   - Set Source to "Deploy from a branch"
   - Select "gh-pages" branch
   - Save the settings

4. **Access your deployed site**
   Your application will be available at: `https://heyom.github.io/aws-questions-mcq`

## 📁 Project Structure

```
aws-questions-mcq/
├── public/
│   ├── resource/
│   │   └── final-questions.json    # Question bank
│   ├── index.html
│   └── ...
├── src/
│   ├── App.js                      # Main application component
│   ├── App.css                     # Main application styles
│   ├── LandingPage.js              # Landing page component
│   ├── LandingPage.css             # Landing page styles
│   ├── Quiz.js                     # Quiz component
│   ├── index.js                    # Application entry point
│   └── index.css                   # Global styles
├── package.json
└── README.md
```

## 🎨 Design Features

### Dark Theme Aesthetic
- Deep gradient backgrounds (#0f0f23 to #16213e)
- Glassmorphism effects with backdrop blur
- Accent colors: #64ffda (teal) and #00d4ff (blue)
- Smooth animations and transitions

### Interactive Elements
- Hover effects on certification cards
- Glowing borders and shadows
- Animated progress bars
- Pulse animations for results
- Floating logo animation

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured experience with hover effects
- **Tablet**: Adapted layout with touch-friendly interactions
- **Mobile**: Optimized for small screens with simplified navigation

## 🔧 Customization

### Adding New Questions
1. Edit `public/resource/final-questions.json`
2. Follow the existing format:
   ```json
   {
     "question": "Your question here?",
     "options": ["Option A", "Option B", "Option C", "Option D"],
     "answer": [1, 2]  // 1-based indexing for correct answers
   }
   ```

### Adding New Certifications
1. Update the `certifications` array in `src/LandingPage.js`
2. Set `available: true` for ready certifications
3. Add corresponding question files if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- AWS for providing the certification framework
- React team for the amazing framework
- GitHub for hosting and deployment services

## 📞 Support

If you have any questions or need support, please open an issue on GitHub or contact the maintainers.

---

**Happy Learning! 🚀**
