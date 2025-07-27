# BTM Utility - Product Requirements Document

## Executive Summary

**Product Name**: BTM Utility  
**Version**: 1.0  
**Target Launch**: 3-day MVP, 2-week enhanced version  
**Primary Users**: Brian, Tammy, Garrett, Johnny, Ryan (BTM Inc. stakeholders)

BTM Utility is a mobile-first Progressive Web Application that consolidates three critical laundromat business functions: money collection tracking, task management, and store communications. The application replaces a fragile Google Sheets system with automated QR code scanning, computer vision, and voice-enabled workflows, while integrating with existing business systems.

## Core Problems Being Solved

1. **Fragile Money Collection System**: Current Google Sheets breaks with manual formula copying, causing calculation errors and operational delays
2. **System Fragmentation**: Three separate HTML applications create workflow inefficiencies 
3. **Manual Data Entry Errors**: Confusion about changer numbering, incorrect counter readings, quarter vs dollar counting modes
4. **Field Usability Issues**: Current systems not optimized for mobile field work with gloves/one-handed operation

## Key Features & Capabilities

### Primary Features
- **QR Code + Computer Vision Money Collection** with automatic counter reading and validation
- **Voice-Enabled To-Do Management** with Google Calendar integration  
- **Parts Inventory Tracking** with Gmail purchase monitoring and supplier integration
- **Equipment Troubleshooting** with direct manufacturer documentation links
- **Business Communications** with VOIP webhook triggers for store announcements
- **Emergency Contact Directory** with quick-dial functionality
- **Security Camera Portal** with live viewing of 1-2 primary cameras per store location
- **Temperature Monitoring & Control** with real-time readings and thermostat adjustment capability

### Technical Integration
- **Google Workspace**: Gmail, Drive, Sheets, Calendar synchronization
- **SMS Notifications**: Twilio integration for real-time alerts
- **Voice Processing**: VAPI and Web Speech API for hands-free operation
- **Workflow Automation**: Make.com and Pipedream for business process automation
- **Security Camera System**: Live camera feeds and recording access integration
- **HVAC Control System**: Thermostat monitoring and remote temperature adjustment
- **Secure Configuration**: Encrypted storage for API keys and credentials

## User Personas & Workflows

### Primary User: Field Collector (Brian, Johnny, Garrett, Ryan)
**Weekly Money Collection Workflow**:
1. Open BTM Utility on mobile device
2. Scan QR code to identify machine (location + changer + hopper)
3. Application reads counter values via computer vision
4. Confirm quarter vs dollar counting mode
5. Add collection comments and confirm coins brought to office
6. Automatic calculations and SMS notifications sent
7. Data synced to Google Sheets in real-time

### Secondary Workflows
- Voice-activated task creation: "Replace filter at Dover changer 2 next Friday"
- Parts lookup and supplier contact for emergency orders
- Store communication triggers for customer announcements
- Equipment troubleshooting guide access during repairs
- Live camera monitoring for security and operational oversight
- Temperature adjustment and HVAC control from mobile device

## Technical Requirements

### Mobile-First Design
- **Touch Optimization**: 44px minimum touch targets, thumb-friendly navigation
- **Field-Ready**: High contrast for various lighting, one-handed operation
- **Limited Text Input**: Voice and camera preferred over typing
- **Offline Capability**: Local storage with sync when connected

### Performance Requirements  
- QR code recognition: <2 seconds
- Counter OCR reading: <3 seconds  
- Voice transcription: <2 seconds
- SMS delivery: <30 seconds
- Form submission: <1 second

### Security & Privacy
- Encrypted localStorage for API credentials
- OAuth 2.0 for Google services
- Secure webhook authentication
- Audit logging for sensitive operations

## Location & Equipment Configuration

### Store Locations
- **Peacock** (622 2nd Street Northwest): 3 changers, 1 counter each + 1-2 security cameras + temperature sensors
- **Dover** (931 North Worcester Ave): 3 changers, 1 counter each + 1-2 security cameras + temperature sensors
- **Massillon** (2348 Lincoln Way East): 2 changers, 2 hoppers/2 counters each + 1-2 security cameras + temperature sensors

### Equipment Details
- **Counter Types**: Odometer-style displays
- **Counting Modes**: Quarters (4 ticks = $1) or Dollars (1 tick = $1)
- **QR Codes**: Unique identifiers for each machine/hopper combination
- **Equipment Brands**: Dexter (Express, C-Series) and Huebsch (commercial washers/dryers)
- **Security Cameras**: 1-2 primary monitoring cameras per location with live feed access
- **HVAC Systems**: Temperature sensors and thermostat control units for climate management

## Integration Specifications

### Google Services (OAuth 2.0)
- **Gmail API**: Purchase email monitoring and parsing
- **Google Sheets**: Real-time data synchronization  
- **Google Drive**: Document storage and access
- **Google Calendar**: Task scheduling and reminders

### External APIs
- **Twilio**: SMS notifications for collections and alerts
- **VAPI**: Enhanced voice processing and transcription
- **Make.com**: Workflow automation via HTTP webhooks
- **Pipedream**: Additional business process automation
- **Security Camera API**: Live camera feed integration and recording access
- **HVAC/Thermostat API**: Temperature monitoring and climate control system integration

### Hardware Integration
- **Camera**: QR scanning and OCR counter reading
- **Microphone**: Voice-to-text task creation
- **Phone**: Quick-dial contact functionality
- **Security Cameras**: Live video streaming and monitoring capabilities
- **Temperature Sensors**: Real-time climate monitoring at each location
- **Thermostat Controllers**: Remote temperature adjustment and scheduling

## Business Rules & Validation

### Money Collection Rules
- Prevent duplicate entries for same machine/day
- Mandatory confirmation of quarter vs dollar mode
- Required comment field for unusual readings
- "Coins to office" confirmation checkbox required
- SMS sent to Brian + current collector

### Task Management Rules  
- Voice commands create calendar events automatically
- Tasks assigned to collectors: Brian, Johnny, Garrett, Ryan
- Default due dates and priority levels based on task type
- Integration with maintenance schedules

### Parts & Inventory Rules
- Automatic stock updates from Gmail purchase confirmations
- Reorder alerts when inventory falls below thresholds
- Air filter replacement schedules by equipment type
- Supplier contact info with emergency numbers

## Success Metrics

### Primary Success Criteria (Post-Launch)
1. **Funds recorded appropriately**: 99%+ accuracy in money collection tracking
2. **Hours easily recorded**: 95%+ completion rate for time tracking
3. **Parts/docs easily accessed**: <3 second access time to troubleshooting resources

### Operational Metrics
- 90% reduction in calculation errors vs current Google Sheets
- 25% reduction in money collection round duration  
- 100% user adoption among 5 stakeholders within 1 week
- Real-time inventory accuracy with <5% variance

## Risk Assessment & Mitigation

### Technical Risks (Low Probability)
- **QR Code Recognition Issues**: Manual entry fallback + iterative improvement
- **Voice Recognition Accuracy**: Touch input alternatives + training data
- **API Rate Limiting**: Proper caching + retry logic
- **Integration Complexity**: Modular development + thorough testing

### Business Risks (Low Probability)  
- **User Adoption Resistance**: Comprehensive training + gradual rollout
- **Data Migration Issues**: Parallel systems during transition
- **System Downtime**: Offline capability + automated backups

**Primary Mitigation Strategy**: Iterative development with continuous stakeholder feedback

## Implementation Timeline

### Phase I - MVP (3 Days)
- Core QR scanning and money collection
- Basic to-do list functionality  
- Emergency contacts directory
- SMS notifications
- Configuration system

### Phase II - Enhanced (2 Weeks)
- Google Services integration
- Voice-enabled task management
- Parts inventory tracking  
- Equipment troubleshooting
- VOIP communications
- Gmail purchase monitoring

### Phase III - Production Ready
- Performance optimization
- Comprehensive documentation
- Security hardening
- API development for future expansion

## Hosting & Deployment

- **Platform**: Hostinger hosting
- **Domain**: brianmickley.com/util
- **Entry Point**: index.html
- **SSL**: Required for camera/microphone access
- **PWA**: Installable Progressive Web App
- **Monitoring**: Error tracking and performance monitoring

## Future Expansion Considerations

- Multi-tenant support for additional companies
- Advanced analytics and machine learning insights  
- Mobile app development
- Real-time WebSocket connections
- Integration marketplace for third-party tools

This PRD serves as the foundation for systematic development using the structured task-based approach, ensuring all stakeholder requirements are captured and technical specifications are clearly defined for implementation.