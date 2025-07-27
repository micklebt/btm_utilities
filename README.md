# BTM Utility - Laundromat Management System

A comprehensive Progressive Web Application (PWA) for managing BTM Inc. laundromat operations, featuring money collection, task management, emergency contacts, security cameras, and climate control.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **Git** (optional, for version control)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/micklebt/btm_utilities.git
   cd btm_utilities
   ```

2. **Run the setup script**
   ```bash
   node setup-dev.js
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open in your browser**
   - Local: http://localhost:3000
   - Network: Use your device's IP address for mobile testing

## 📱 Features

### Core Functionality
- **Money Collection**: QR code scanning and payment processing
- **To-Do Management**: Task tracking and completion
- **Emergency Contacts**: Quick access to important numbers
- **Security Cameras**: Live camera feed monitoring
- **Climate Control**: Temperature and humidity management

### Technical Features
- **Progressive Web App**: Installable on mobile devices
- **Offline Support**: Core functionality works without internet
- **Mobile-First Design**: Optimized for smartphone use
- **Real-time Updates**: Live data synchronization
- **Secure Storage**: Encrypted local data storage

## 🛠️ Development

### Project Structure
```
btm_util/
├── index.html              # Main application entry point
├── manifest.json           # PWA manifest
├── package.json            # Project dependencies and scripts
├── server.js              # Custom development server
├── setup-dev.js           # Development environment setup
├── css/                   # Stylesheets
│   ├── reset.css          # CSS reset and normalization
│   ├── base.css           # Base styles and branding
│   ├── components.css     # Reusable UI components
│   ├── layout.css         # Layout and grid systems
│   └── utilities.css      # Utility classes
├── js/                    # JavaScript modules
│   ├── config.js          # Configuration management
│   ├── utils.js           # Utility functions
│   ├── storage.js         # Local storage management
│   ├── logger.js          # Logging system
│   ├── error-handler.js   # Error handling
│   └── app.js             # Main application
└── data/                  # Data files and assets
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server with auto-open |
| `npm run dev` | Start with CORS enabled for API testing |
| `npm run serve-live` | Start with live reload |
| `npm run serve` | Start Python HTTP server |
| `npm run serve-php` | Start PHP development server |
| `node server.js` | Start custom Node.js server |
| `node setup-dev.js` | Run development environment setup |

### Development Server Features
- **Hot Reload**: Automatic page refresh on file changes
- **CORS Support**: Cross-origin resource sharing for API testing
- **PWA Headers**: Proper headers for service worker and manifest
- **Security Headers**: XSS protection and content type options
- **Mobile Testing**: Network access for device testing
- **Error Handling**: Graceful error pages and logging

## 🔧 Configuration

### Environment Variables
```bash
PORT=3000              # Server port (default: 3000)
HOST=localhost         # Server host (default: localhost)
NODE_ENV=development   # Environment mode
```

### Development Configuration
The setup script creates `dev-config.json` with:
```json
{
  "development": true,
  "debug": true,
  "port": 3000,
  "host": "localhost",
  "cors": true,
  "hotReload": true
}
```

## 📱 Mobile Testing

### Local Network Testing
1. Start the development server
2. Note the network IP address displayed
3. On your mobile device, navigate to the network IP
4. Test PWA installation and offline functionality

### Device Requirements
- **iOS**: Safari 11.1+ (iOS 11.3+)
- **Android**: Chrome 67+ (Android 7+)
- **Desktop**: Chrome 67+, Firefox 67+, Safari 11.1+, Edge 79+

## 🔒 Security

### Development Security
- **Content Security Policy**: Prevents XSS attacks
- **CORS Configuration**: Controlled cross-origin access
- **Input Validation**: All user inputs are sanitized
- **Error Handling**: No sensitive data in error messages

### Production Security
- **HTTPS Required**: All production traffic encrypted
- **API Key Management**: Secure credential storage
- **Data Encryption**: Sensitive data encrypted at rest
- **Audit Logging**: Comprehensive access logging

## 🧪 Testing

### Manual Testing Checklist
- [ ] PWA installation on mobile devices
- [ ] Offline functionality
- [ ] QR code scanning
- [ ] Camera access
- [ ] Local storage persistence
- [ ] Error handling and recovery
- [ ] Responsive design on various screen sizes

### Browser Testing
- Chrome (desktop and mobile)
- Firefox (desktop and mobile)
- Safari (desktop and iOS)
- Edge (desktop)

## 📊 Performance

### Performance Targets
- **Initial Load**: < 5 seconds
- **Critical Functions**: < 3 seconds
- **API Responses**: < 2 seconds
- **Image Loading**: Optimized with lazy loading

### Optimization Features
- **Service Worker Caching**: Offline resource caching
- **Image Optimization**: WebP format with fallbacks
- **Code Splitting**: Modular JavaScript loading
- **Minification**: Production-ready asset optimization

## 🚨 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Use a different port
PORT=3001 npm start
```

**Module not found errors**
```bash
# Reinstall dependencies
npm install
```

**PWA not installing**
- Ensure HTTPS in production
- Check manifest.json validity
- Verify service worker registration

**Mobile testing issues**
- Check network connectivity
- Verify firewall settings
- Ensure devices are on same network

### Debug Mode
Enable debug logging:
```javascript
// In browser console
localStorage.setItem('btm_debug', 'true');
// Refresh page to see detailed logs
```

## 📚 API Integration

### Supported APIs
- **Twilio**: SMS notifications and voice calls
- **VAPI**: Voice assistant integration
- **Google Workspace**: Gmail, Sheets, Drive, Calendar
- **Make.com**: Webhook automation

### API Configuration
API credentials are stored securely in the application settings. See the settings modal for configuration options.

## 🤝 Contributing

### Development Workflow
1. Follow the linear development process
2. Complete one task at a time
3. Test thoroughly before moving to next task
4. Document all changes
5. Commit with descriptive messages

### Code Standards
- Use ES6+ JavaScript features
- Follow mobile-first CSS approach
- Implement comprehensive error handling
- Add JSDoc documentation for all functions
- Test on multiple devices and browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support or questions:
- **Repository**: https://github.com/micklebt/btm_utilities
- **Issues**: https://github.com/micklebt/btm_utilities/issues
- **Documentation**: See project documentation in `/docs`

---

**BTM Utility** - Making laundromat management simple and efficient. 