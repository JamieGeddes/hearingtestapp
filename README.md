# 🎧 Hearing Test Web Application

A browser-based hearing assessment tool that provides basic audiometric testing for educational and informational purposes.

## ⚠️ Important Medical Disclaimer

**THIS APPLICATION IS NOT MEDICALLY APPROVED AND SHOULD NOT BE USED FOR MEDICAL DIAGNOSIS.**

This hearing test is designed as an **indicative guide** to help users understand their hearing capabilities. It is **NOT** a substitute for professional audiological assessment. If you have concerns about your hearing, please consult a qualified audiologist or healthcare provider.

## 🎯 Purpose

This application provides a basic hearing screening tool that can help users:
- Get an approximate indication of their hearing thresholds
- Identify potential hearing changes over time
- Understand which frequencies they may have difficulty hearing
- Generate reports for informal tracking purposes

## 🔧 How It Works

### Technical Overview

The application uses the **Web Audio API** to generate pure tone sine waves at standard audiometric frequencies. It implements several key safety and accuracy features:

#### Audio Generation
- **Frequencies Tested**: 125, 250, 500, 1000, 2000, 4000, 8000 Hz
- **Tone Type**: Pure sine waves
- **Volume Ramping**: Gradual increase from silence to prevent acoustic shock
- **Safety Limit**: Maximum volume capped at 30% of system maximum

#### Ear Isolation
- **Stereo Channel Separation**: Left and right ears tested independently
- **Headphone Requirement**: Essential for accurate channel isolation
- **Sequential Testing**: Each ear tested separately to avoid cross-hearing

#### Volume Control
- **Progressive Increase**: Volume increases by 0.1% every 10ms
- **User Response**: Test stops when user indicates they can hear the tone
- **No Response Handling**: Test times out at maximum safe volume if no response

### Test Procedure

1. **Setup Phase**
   - Headphone verification reminder
   - Volume calibration with test tone
   - User instruction review

2. **Testing Phase**
   - 14 total tests (7 frequencies × 2 ears)
   - Each test starts with inaudible volume
   - Volume gradually increases until user responds
   - Response time and volume level recorded

3. **Results Phase**
   - Hearing thresholds calculated in dB HL (Hearing Level)
   - Results categorized by hearing status
   - Visual chart generation
   - Comprehensive report creation

## 📊 Results Analysis

### Hearing Categories
- **Normal**: 0-25 dB HL
- **Mild Loss**: 26-40 dB HL  
- **Moderate Loss**: 41-55 dB HL
- **Severe Loss**: 56-70 dB HL
- **Profound Loss**: 71+ dB HL

### Data Presentation
- **Summary**: Average hearing threshold per ear
- **Frequency Chart**: Visual representation of hearing across frequencies
- **Detailed Table**: Specific thresholds for each frequency
- **Color Coding**: Visual indicators for hearing status levels

## 🚀 Getting Started

### Requirements
- Node.js (v16 or higher)
- npm
- Modern web browser with Web Audio API support
- Headphones or earbuds (REQUIRED)
- Quiet environment
- Approximately 10 minutes

### Installation & Development
1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the TypeScript application:
   ```bash
   npm run build
   ```

3. Start the development server:
   ```bash
   npm run serve
   ```

### Development Commands
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm run serve` - Start HTTP server for testing
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type checking
- `npm run clean` - Remove build files
- `npm run deploy` - Build and serve application

### Production Deployment
Deploy the contents of the `dist/` folder to your web server.

### Usage
1. **Put on headphones** before starting
2. **Adjust volume** using the calibration tone
3. **Follow instructions** on screen
4. **Click "I Can Hear It"** as soon as you detect each tone
5. **Review results** when testing is complete
6. **Save report** if desired for future reference

## 💾 Saving Results

The application generates comprehensive HTML reports that include:
- Test completion timestamp
- Hearing threshold summary for each ear
- Detailed frequency-specific results
- Test parameters and methodology
- Medical disclaimers and recommendations

Reports are saved as standalone HTML files that can be:
- Opened in any web browser
- Printed for physical records
- Shared with healthcare providers (for reference only)
- Stored for comparison with future tests

## 🔒 Safety Features

### Volume Protection
- **Hard Limit**: 30% maximum system volume
- **Gradual Ramping**: No sudden loud sounds
- **User Control**: Test stops immediately on user response
- **Timeout Protection**: Automatic stop at maximum safe level

### Audio Safety
- **Pure Tones**: Clean sine waves without harmonics
- **Controlled Duration**: Each test limited to prevent overexposure
- **Immediate Stopping**: Audio ceases instantly when user responds

## 🌐 Browser Compatibility

### Supported Browsers
- **Chrome**: Version 36+
- **Firefox**: Version 25+
- **Safari**: Version 14.1+
- **Edge**: Version 79+

### Required Features
- Web Audio API support
- ES6 JavaScript support
- HTML5 Canvas for charting
- Blob API for file downloads

## 📱 Device Compatibility

### Desktop
- ✅ Full functionality
- ✅ Optimal screen size for charts
- ✅ Better volume control precision

### Mobile/Tablet
- ✅ Responsive design
- ⚠️ Volume control may be limited by device
- ⚠️ Headphone requirement even more critical

## 🔬 Technical Limitations

### Accuracy Factors
- **Equipment Dependent**: Results vary based on headphone quality
- **Environment Sensitive**: Background noise affects accuracy
- **Volume Calibration**: User's volume setting impacts results
- **Device Limitations**: Audio hardware varies between devices

### Not Suitable For
- Medical diagnosis or treatment decisions
- Professional audiological assessment
- Legal or insurance documentation
- Clinical research purposes

## 🏥 When to Seek Professional Help

Consult a qualified audiologist if you experience:
- Sudden hearing loss
- Hearing loss in one ear only
- Ear pain or discharge
- Persistent tinnitus (ringing)
- Difficulty understanding speech
- Concerns about test results

## 🛠️ Technical Architecture

### Files Structure
```
hearingtestapp/
├── src/                # TypeScript source files
│   ├── script.ts      # Main application logic (TypeScript)
│   └── types.ts       # Type definitions
├── dist/              # Built files for deployment
│   ├── index.html     # Production HTML
│   ├── script.js      # Compiled JavaScript
│   ├── styles.css     # Styles
│   └── *.map         # Source maps for debugging
├── index.html         # Development HTML
├── styles.css         # CSS styles
├── tsconfig.json      # TypeScript configuration
├── package.json       # Dependencies and scripts
├── .eslintrc.json     # ESLint configuration
└── README.md          # This documentation
```

### Key Technologies
- **TypeScript**: Strongly typed JavaScript for better development experience
- **Web Audio API**: Audio generation and processing
- **HTML5 Canvas**: Results visualization
- **CSS Grid/Flexbox**: Responsive layout
- **ES2020 Modules**: Modern JavaScript features
- **Blob API**: File download functionality
- **ESLint**: Code quality and consistency

## 📄 License and Usage

This application is provided for educational and informational purposes. Users are responsible for understanding the limitations and seeking appropriate medical care when needed.

**Remember: This tool provides approximate hearing threshold estimates and should be used for informational purposes only.**

---

*For questions about hearing health, always consult qualified healthcare professionals.*

## 🤖 Development Note

This application was created entirely using [Claude Code](https://claude.ai/code), as an experiment in AI-assisted software development. The entire codebase, including the HTML, CSS, JavaScript implementation, and this documentation, was generated through AI collaboration to explore the capabilities of modern AI code generation tools.