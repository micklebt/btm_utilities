# BTM Utility Project Rules & Development Guidelines

## Table of Contents
1. [Project Overview](#project-overview)
2. [Development Workflow Rules](#development-workflow-rules)
3. [Code Quality Standards](#code-quality-standards)
4. [UI/UX Guidelines](#uiux-guidelines)
5. [Testing Requirements](#testing-requirements)
6. [Documentation Standards](#documentation-standards)
7. [Security & Privacy](#security--privacy)
8. [Performance Standards](#performance-standards)
9. [Emergency Procedures](#emergency-procedures)
10. [Compliance Checklist](#compliance-checklist)

---

## Project Overview

### Project Context
- **Project**: BTM Utility - Comprehensive Laundromat Management System
- **Type**: Mobile-first Progressive Web Application (PWA)
- **Timeline**: 3-week development cycle (July 27 - August 17, 2025)
- **Technology Stack**: HTML5, CSS3, JavaScript, PWA technologies
- **Target Users**: 5 internal stakeholders managing 3 BTM Inc. locations

### Core Principles
1. **Mobile-First Design**: All interfaces must be optimized for smartphone use
2. **Reliability Over Features**: System stability is paramount for business operations
3. **Data Accuracy**: Zero tolerance for calculation errors in money collection
4. **Field Usability**: All features must work reliably in laundromat environments
5. **Integration Focus**: Seamless connection with Google Workspace and external APIs

---

## Development Workflow Rules

### 1. Linear Development Process
**RULE**: Follow strict sequential development - no parallel task execution
- **Phase I (Days 1-3)**: MVP Core Features
- **Phase II (Days 4-17)**: Enhanced Features & Integrations  
- **Phase III (Ongoing)**: Optimization & Production Readiness

### 2. Single Task Focus
**RULE**: Work on exactly ONE feature/component at a time
- **PROHIBITION**: Never start a second task while the first is incomplete
- **DEFINITION OF COMPLETE**: Feature is coded, tested, documented, and committed
- **EXCEPTION**: Only move to next task if current task is blocked and documented

### 3. Pre-Development Requirements
**RULE**: Complete all planning before writing any code
- [ ] Requirements documented and approved
- [ ] Architecture designed and diagrammed
- [ ] API contracts defined
- [ ] UI/UX mockups created
- [ ] Test cases planned

### 4. Development Order
**RULE**: Follow this exact sequence for each feature:
1. **Design**: Plan specific implementation
2. **Code**: Write core functionality
3. **Test**: Create and run tests
4. **Document**: Add inline and external documentation
5. **Commit**: Version control with descriptive message

---

## Code Quality Standards

### 1. Code Organization
- **File Structure**: Follow established `css/`, `js/`, `data/` organization
- **Naming Conventions**: Use descriptive, camelCase for variables and functions
- **Modular Design**: Each feature in separate, reusable modules
- **Error Handling**: Comprehensive try-catch blocks for all external operations

### 2. JavaScript Standards
```javascript
// REQUIRED: JSDoc documentation for all functions
/**
 * Processes money collection data from QR codes
 * @param {string} qrData - Raw QR code data
 * @param {Object} location - Location information
 * @returns {Object} Processed collection data
 * @throws {Error} If QR data is invalid
 */
function processMoneyCollection(qrData, location) {
    // Implementation
}

// REQUIRED: Input validation
if (!qrData || typeof qrData !== 'string') {
    throw new Error('Invalid QR data provided');
}

// REQUIRED: Error handling
try {
    // Operation
} catch (error) {
    console.error('Operation failed:', error);
    // Handle gracefully
}
```

### 3. CSS Standards
- **Mobile-First**: All styles start with mobile breakpoints
- **Responsive Design**: Must work on all screen sizes (320px+)
- **Accessibility**: Minimum 4.5:1 contrast ratio, keyboard navigation
- **Performance**: Minimize CSS file size, use efficient selectors

### 4. HTML Standards
- **Semantic HTML**: Use appropriate tags (`<main>`, `<section>`, `<nav>`)
- **Accessibility**: ARIA labels, alt text for images, proper heading hierarchy
- **PWA Requirements**: Manifest file, service worker registration
- **SEO**: Meta tags, structured data where applicable

---

## UI/UX Guidelines

### 1. Branding Standards
- **Primary Brand**: BTM Inc
- **Color Scheme**: Blue background (#FF6B35) with white lettering (#FFFFFF)
- **Typography**: Clear, readable fonts optimized for mobile screens
- **Logo Usage**: Consistent placement and sizing across all interfaces

### 2. Mobile-First Design Rules
- **Touch Targets**: Minimum 44px × 44px for all interactive elements
- **Gesture Support**: Swipe, pinch, and tap gestures where appropriate
- **Offline Capability**: Core functions must work without internet connection
- **Loading States**: Clear feedback for all async operations

### 3. User Experience Requirements
- **Task Completion**: 95% success rate without assistance after training
- **Response Time**: All critical functions responsive within 3 seconds
- **Error Prevention**: Clear validation messages and confirmation dialogs
- **Help System**: Contextual help and tooltips for complex features

### 4. Interface Components
- **Navigation**: Bottom navigation bar for primary functions
- **Forms**: Single-column layout, clear labels, inline validation
- **Data Display**: Card-based layouts, clear hierarchy, readable fonts
- **Actions**: Prominent call-to-action buttons, clear visual feedback

---

## Testing Requirements

### 1. Test Coverage
- **Minimum Coverage**: 80% of all code paths
- **Required Tests**:
  - Happy path functionality
  - Edge cases and boundary conditions
  - Error conditions and error handling
  - Integration points with external APIs
  - Mobile device compatibility

### 2. Testing Methodology
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API integrations and data flow
- **User Acceptance Tests**: Test complete user workflows
- **Performance Tests**: Verify 3-second response time requirement

### 3. Testing Tools
- **Browser Testing**: Chrome, Firefox, Safari, Edge
- **Device Testing**: iOS Safari, Android Chrome
- **Network Testing**: 3G, 4G, WiFi, offline scenarios
- **Accessibility Testing**: Screen readers, keyboard navigation

### 4. Test Documentation
- **Test Cases**: Document all test scenarios
- **Test Results**: Record pass/fail status and performance metrics
- **Bug Reports**: Detailed reproduction steps and expected behavior
- **Regression Testing**: Verify fixes don't break existing functionality

---

## Documentation Standards

### 1. Code Documentation
- **Inline Comments**: Explain complex logic and business rules
- **JSDoc**: Document all functions, parameters, and return values
- **README Files**: Project overview, setup instructions, usage examples
- **API Documentation**: Endpoint descriptions, request/response formats

### 2. Task List Formatting
- **Checkmark Placement**: Always place checkmarks `[x]` at the front of completed tasks
- **Incomplete Tasks**: Use `[ ]` for incomplete tasks
- **Format Consistency**: Maintain format: `[x] Task Number - Task Description`
- **Prohibition**: Never place checkmarks at the end of task descriptions
- **Example**: `[x] 1.4 - Implement responsive CSS framework` (correct)
- **Example**: `[ ] 1.4 - Implement responsive CSS framework [x]` (incorrect)

### 3. User Documentation
- **User Manual**: Step-by-step instructions for all features
- **Training Materials**: Screenshots and video tutorials
- **FAQ**: Common questions and troubleshooting
- **Release Notes**: Changes and new features for each version

### 4. Technical Documentation
- **Architecture Diagrams**: System components and data flow
- **Database Schema**: Data models and relationships
- **Deployment Guide**: Server setup and configuration
- **Maintenance Procedures**: Backup, updates, and monitoring

---

## Security & Privacy

### 1. Data Protection
- **Encryption**: All sensitive data encrypted in transit and at rest
- **Access Control**: Role-based permissions for different user types
- **Audit Logging**: Track all data access and modifications
- **Data Retention**: Clear policies for data storage and deletion

### 2. API Security
- **Authentication**: Secure API key management
- **Rate Limiting**: Prevent abuse and ensure fair usage
- **Input Validation**: Sanitize all user inputs and API parameters
- **Error Handling**: Don't expose sensitive information in error messages

### 3. Privacy Compliance
- **Data Minimization**: Only collect necessary information
- **User Consent**: Clear privacy policy and consent mechanisms
- **Data Portability**: Allow users to export their data
- **Breach Response**: Plan for data breach notification and response

---

## Performance Standards

### 1. Response Time Requirements
- **Critical Functions**: < 3 seconds response time
- **Page Load**: < 5 seconds initial load time
- **Image Loading**: Optimized images with lazy loading
- **API Calls**: < 2 seconds for data retrieval

### 2. Resource Optimization
- **Bundle Size**: Minimize JavaScript and CSS file sizes
- **Image Optimization**: Use WebP format, appropriate compression
- **Caching**: Implement browser and service worker caching
- **CDN Usage**: Use content delivery networks for static assets

### 3. Mobile Performance
- **Battery Usage**: Minimize background processing
- **Data Usage**: Optimize for limited data plans
- **Memory Usage**: Efficient memory management for mobile devices
- **Offline Functionality**: Core features work without internet

---

## Emergency Procedures

### 1. Critical Bug Response
**TRIGGER**: System failure affecting business operations
**IMMEDIATE ACTIONS**:
1. Stop all development work
2. Assess impact and severity
3. Implement immediate fix or rollback
4. Test fix thoroughly
5. Deploy fix
6. Resume normal development only after resolution

### 2. Data Loss Prevention
- **Backup Strategy**: Daily automated backups
- **Recovery Procedures**: Documented restore processes
- **Data Validation**: Regular integrity checks
- **Disaster Recovery**: Off-site backup and recovery plan

### 3. Scope Creep Management
**RULE**: Reject scope changes during active development
**PROCESS**:
1. Complete current task entirely
2. Document proposed scope change
3. Assess impact on timeline and architecture
4. Update requirements document
5. Begin scope change as new planned task

---

## Compliance Checklist

### Daily Development Checklist
- [ ] Following single-task focus
- [ ] Testing as code is written
- [ ] Documenting as code is written
- [ ] Using structured development prompts
- [ ] Maintaining mobile-first design principles
- [ ] Following EZ Rolloff branding guidelines

### Feature Completion Checklist
- [ ] All tests pass
- [ ] Code is documented
- [ ] Integration works correctly
- [ ] Mobile compatibility verified
- [ ] Performance requirements met
- [ ] Security requirements satisfied
- [ ] Committed to version control
- [ ] Progress log updated

### Weekly Review Checklist
- [ ] Review adherence to linear workflow
- [ ] Identify common sources of backtracking
- [ ] Assess performance against 3-second requirement
- [ ] Verify security and privacy compliance
- [ ] Update rules based on observed patterns
- [ ] Plan improvements for following week

### Project Milestone Checklist
- [ ] Phase I MVP complete and tested
- [ ] Phase II enhancements implemented
- [ ] Phase III optimization complete
- [ ] User training materials ready
- [ ] Production deployment successful
- [ ] Post-launch monitoring established

---

## Quick Reference

### Development Commands
```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

### Key Performance Indicators
- **User Adoption**: 100% of stakeholders using system within 1 week
- **Data Accuracy**: <1% error rate in calculations
- **Performance**: All critical functions <3 seconds
- **Reliability**: 99.5% uptime during business hours
- **Usability**: 95% task completion rate without assistance

### Contact Information
- **Project Manager**: Brian McClee
- **Technical Lead**: Development Team
- **Stakeholders**: 5 internal BTM Inc. users
- **Support**: Documented escalation procedures

---

**Last Updated**: July 27, 2025
**Version**: 1.0
**Next Review**: August 3, 2025 