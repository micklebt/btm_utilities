# Product Requirements Document (PRD)

## Document Information
- **Product Name:** BTM Utility
- **Version:** 1.0
- **Date:** July 27, 2025
- **Author:** Brian McClee
- **Stakeholders:** Brian, Tammy, Garrett, Johnny, and Ryan
- **Status:** Draft

---

## Executive Summary

BTM Utility is a comprehensive mobile-first application designed to streamline laundromat operations by consolidating three critical business functions into a single, unified platform. The application combines weekly money collection tracking from laundromats and coin changers, incorporates a field-ready to-do list system, and integrates BTM Inc. Communications functionality with webhook-triggered audio announcements via store loudspeakers.

The primary driver for this solution is to replace the current fragile Google Sheets-based money collection system that is prone to formula errors and requires manual copying of calculations. The current system breaks easily with clumsy editing and creates operational inefficiencies during money collection rounds.

The application will feature QR code-enabled data entry using mobile phone cameras to automatically identify coin hoppers and machines, with computer vision to read counter values directly from the camera feed. The interface will be designed for thumb-only navigation without requiring typed input, ensuring seamless field operations. By consolidating three separate single-page HTML applications into one cohesive system, BTM Utility will provide a clean, simple, and reliable solution for daily laundromat management tasks.

---

## 1. Problem Statement

### 1.1 Current State
BTM Inc. currently operates laundromats using three separate systems:
- A fragile Google Sheets-based money collection system that requires manual formula copying and is prone to breaking with editing errors
- A standalone HTML-based communications page for triggering audio announcements through store loudspeakers
- A basic to-do list system for field operations

These disparate systems require users to switch between multiple applications, creating inefficiency and potential for errors during daily operations.

### 1.2 Problem Definition
**Primary Problems:**
1. **Fragile Money Collection System**: The current Google Sheets system breaks when formulas are not properly copied down, leading to calculation errors and operational delays
2. **System Fragmentation**: Three separate single-page HTML applications create workflow inefficiencies and increase cognitive load for field workers
3. **Input Inefficiency**: Current systems require manual data entry and typing, which is cumbersome for mobile field work
4. **Error-Prone Data Collection**: Manual entry of coin hopper values leads to transcription errors and inconsistent data quality

### 1.3 Evidence
- Current Google Sheets system requires manual formula copying that frequently fails
- Field workers must juggle multiple applications during money collection rounds
- Manual data entry creates bottlenecks and accuracy issues in financial tracking
- Existing systems are not optimized for mobile/field use cases

---

## 2. Goals and Objectives

### 2.1 Business Goals
- **Primary:** Create a reliable, unified system that eliminates calculation errors in money collection tracking
- **Secondary:** Reduce operational time spent on data entry and system switching during field work
- **Tertiary:** Improve data accuracy and consistency across all laundromat operations

### 2.2 User Goals
- Seamlessly collect and track weekly money from laundromats and coin changers without manual calculations
- Access and manage to-do lists efficiently while in the field
- Trigger store audio communications quickly and reliably
- Complete all tasks using thumb-only navigation on mobile devices

### 2.3 Success Metrics
| Metric | Current State | Target | Timeline |
|--------|---------------|--------|----------|
| Data Entry Errors | High (frequent formula breaks) | < 1% error rate | 3 months post-launch |
| Time per Money Collection Round | [Current baseline TBD] | 25% reduction | 6 months post-launch |
| System Consolidation | 3 separate applications | 1 unified application | Launch |
| Mobile Usability Score | Not optimized | 90%+ thumb-navigation success | Launch |

---

## 3. Target Audience

### 3.1 Primary Users
- **BTM Inc. Stakeholders (Field Workers):** Brian, Tammy, Garrett, Johnny, and Ryan
  - Demographics: Business owners/operators managing multiple laundromat locations
  - Behaviors: Currently perform weekly money collection rounds, manage day-to-day operations, handle customer communications
  - Pain Points: Fragile calculation systems, multiple app switching, manual data entry on mobile devices
  - Goals: Accurate money tracking, efficient field operations, reliable store communication system

### 3.2 Secondary Users
- **Future BTM Inc. employees or contractors** who may be brought on to handle field operations
- **Audit/accounting personnel** who may need to review money collection data

---

## 4. Market Analysis

### 4.1 Market Size
**Internal Application**: BTM Utility is designed specifically for BTM Inc.'s internal operations across multiple laundromat locations (Mass Coin Laundry, Dover Coin Laundry, Peacock Coin Laundry). Market size is defined by operational efficiency gains rather than external market penetration.

### 4.2 Competitive Landscape
**Internal System Comparison:**
| Current System | Strengths | Weaknesses | Replacement Priority |
|------------|-----------|------------|--------------|
| Google Sheets Money Tracking | Familiar interface, cloud-based | Fragile formulas, manual copying required, error-prone | High |
| HTML Communications Page | Simple interface, direct webhook integration | Standalone system, not mobile-optimized | Medium |
| Existing To-Do System | Basic functionality | Separate from main workflows | Low |

### 4.3 Competitive Advantage
- **Unified Platform**: Single application replacing three separate systems
- **QR Code + Computer Vision**: Automated data entry reduces human error
- **Mobile-First Design**: Thumb-only navigation optimized for field work
- **Industry-Specific Features**: Custom-built for laundromat operations workflow

---

## 5. Product Overview

### 5.1 Solution Summary
BTM Utility is a mobile-first Progressive Web Application that consolidates money collection tracking, to-do list management, store communications, parts inventory management, and equipment troubleshooting into a single, touch-optimized interface. The application uses QR codes and computer vision to automate coin hopper value entry, integrates with existing business systems (Gmail, Google Sheets, Google Drive), and provides comprehensive parts tracking and documentation access while eliminating manual data entry errors.

### 5.2 Key Features
1. **QR Code + Computer Vision Money Collection**: Automated recognition of coin machine counters and hoppers using mobile camera with QR code identification, including confirmation workflows and comment capabilities
2. **Integrated Parts Tracking & Troubleshooting**: Real-time parts inventory management with direct links to equipment documentation and supplier information
3. **Gmail Purchase Monitoring**: Automated tracking of online parts purchases from Gmail with item extraction and inventory updates
4. **Voice-Enabled To-Do Management**: Microphone interface for hands-free to-do list entry with Google Calendar integration
5. **Audio Communication Hub**: Integrated webhook triggers for store loudspeaker announcements across all locations
6. **Business Phone Directory**: Frequently called business numbers with quick-dial functionality
7. **Configuration Management**: Secure ENV settings for API keys, user credentials, and system integrations

### 5.3 User Journey
**Primary Workflow - Weekly Money Collection:**
1. User opens BTM Utility on mobile device
2. Navigates to money collection module
3. Scans QR code on coin machine/hopper using phone camera
4. Application automatically reads counter values from camera feed
5. System prompts for confirmation of quarter vs. dollar counting mode
6. User adds comments about coin collection status
7. Confirms coins brought to office
8. Data is recorded with automatic calculations applied
9. User continues to next machine/location

**Secondary Workflows:**
- Voice-activated to-do list entries synchronized with Google Calendar
- Parts lookup and troubleshooting guide access
- Quick business phone number dialing
- Purchase monitoring and inventory updates from Gmail integration

---

## 6. Detailed Requirements

### 6.1 Location and Equipment Configuration

#### 6.1.1 Store Locations
1. **Peacock (Peacock Coin Laundry - 622 2nd Street Northwest)**
   - 3 changers (labeled 1, 2, 3)
   - Each changer has 1 counter (odometer-style)
   - Counter types: Some track quarters (4 ticks = $1), others track dollars (1 tick = $1)

2. **Dover (Dover Coin Laundry - 931 North Worcester Ave)**
   - 3 changers (labeled 1, 2, 3)
   - Each changer has 1 counter (odometer-style)

3. **Massillon (Massillon Coin Laundry - 2348 Lincoln Way East)**
   - 2 changers (labeled 1, 2)
   - Each changer has 2 hoppers with 2 counters per changer

#### 6.1.2 Emergency Contact Information
| Location | Police Department | Non-Emergency Phone | Address |
|----------|-------------------|-------------------|---------|
| Massillon | Massillon Police Department | (330) 832-9811 | 2348 Lincoln Way East |
| Dover | Dover Police Department | (330) 343-6726 | 931 North Worcester Ave |
| Peacock | Carrollton Police Department | (330) 627-2858 | 622 2nd Street Northwest |

### 6.2 Functional Requirements

#### 6.2.1 Money Collection Module
| Feature | Description | Priority | Acceptance Criteria |
|---------|-------------|----------|-------------------|
| QR Code Recognition | Camera-based QR code scanning to identify specific changer/hopper | High | System accurately identifies machine and location from QR code |
| Computer Vision Counter Reading | Automatic reading of odometer-style counter values from camera feed | High | System reads counter values with 99%+ accuracy |
| Quarter vs Dollar Mode Confirmation | User confirmation of counting mode (quarters=4 ticks/$1, dollars=1 tick/$1) | High | Clear visual prompts prevent counting errors |
| Comment Input | Text field for collection notes and coin status | High | Comments saved with each collection record |
| Coin Office Confirmation | Checkbox to confirm coins brought to office | High | Required confirmation before submission |
| Automatic Calculations | Replace fragile Google Sheets formulas with robust calculation engine | High | All calculations are accurate and automatic without manual intervention |
| Data Persistence | Maintain all input values until submission | High | Form data remains sticky in local storage until submitted |
| SMS Notifications | Send SMS for time entries and dollar value submissions | Medium | SMS sent immediately upon successful submission |

#### 6.2.2 Parts Tracking & Troubleshooting Module
| Feature | Description | Priority | Acceptance Criteria |
|---------|-------------|----------|-------------------|
| Real-Time Parts Inventory | Track current stock levels and reorder points | High | Accurate inventory counts with low-stock alerts |
| Equipment Documentation Links | Direct access to manufacturer troubleshooting guides | High | Links function and load relevant documentation quickly |
| Purchase Order Integration | Monitor Gmail for online parts purchases and auto-update inventory | High | Automatic extraction of item number, quantity, source, date, cost |
| Parts Cost Tracking | Historical cost analysis and budget forecasting | Medium | Cost trends and supplier comparison reports |
| Air Filter Replacement Schedule | Track filter sizes and replacement frequencies | Medium | Automated reminders based on equipment schedules |
| Supplier Contact Directory | Quick access to parts supplier information and pricing | Medium | Searchable database with contact details and current pricing |

#### 6.2.3 Voice-Enabled To-Do Management Module
| Feature | Description | Priority | Acceptance Criteria |
|---------|-------------|----------|-------------------|
| Microphone Input | Voice-to-text for hands-free to-do item creation | High | 95%+ accuracy in voice recognition |
| Google Calendar Integration | Sync to-do items with calendar events and deadlines | High | Bidirectional sync with Google Calendar |
| CRUD Operations | Create, Read, Update, Delete to-do items | Medium | All operations function properly with data persistence |
| Priority Assignment | Voice or touch-based priority setting | Medium | Clear priority indicators and sorting |

#### 6.2.4 Business Phone Directory Module
| Feature | Description | Priority | Acceptance Criteria |
|---------|-------------|----------|-------------------|
| Contact Management | Maintain frequently called business numbers | Medium | Add, edit, delete contacts with categorization |
| Quick Dial | One-touch dialing for stored contacts | Medium | Direct phone app integration |
| Emergency Contacts | Prioritized list of critical business contacts | High | Quick access to police, suppliers, service technicians |
| Feature | Description | Priority | Acceptance Criteria |
|---------|-------------|----------|-------------------|
| Employee Selection | Single-select dropdown for Johnny, Garrett, Thelma, Brian, Ryan | High | Dropdown includes all 5 names, selection is sticky |
| Date Entry | Date input defaulting to current day | High | Always defaults to today's date |
| Time Calculation | Auto-calculate hours from start/end time | High | Accurate calculation: end time - start time = hours worked |
| Sticky User Preferences | Remember selected employee name in local memory | High | Last selected name persists across sessions |

#### 6.2.5 Time Tracking Module
| Feature | Description | Priority | Acceptance Criteria |
|---------|-------------|----------|-------------------|
| VOIP Endpoint Triggers | Webhook-triggered audio announcements | High | Successfully trigger audio at correct store locations |
| Location-Specific Audio | Separate audio controls for Mass, Dover, Peacock Inner/Outer | High | Audio plays only at intended location |
| Formal/Informal Notifications | Support for both robo-voice and Brian's voice recordings | Medium | Clear categorization of announcement types |
| Emergency Alerts | STOP + bell + siren functionality | High | Emergency alerts override other audio and function immediately |

#### 6.2.6 Communications Module
| Feature | Description | Priority | Acceptance Criteria |
|---------|-------------|----------|-------------------|
| Basic CRUD Operations | Create, Read, Update, Delete to-do items | Medium | All CRUD operations function properly |
| Mobile-Optimized Interface | Thumb-only navigation | High | No typed input required, touch-friendly interface |
| Field-Ready Design | Simple, uncluttered interface for field use | High | Interface is usable in various lighting conditions |

#### 6.2.5 QR Code Reference Module
| Feature | Description | Priority | Acceptance Criteria |
|---------|-------------|----------|-------------------|
| Quick Response Checklists | QR codes for common procedures and checklists | Medium | QR codes generate and display properly |
| Machine-Specific Codes | Unique QR codes for each changer/hopper combination | High | Each code uniquely identifies location and machine |

#### 6.2.6 Equipment Documentation Module
| Feature | Description | Priority | Acceptance Criteria |
|---------|-------------|----------|-------------------|
| Machine Inventory | List machine number, make/model, store location | Medium | Complete inventory of all equipment |
| Troubleshooting Links | Direct links to manufacturer troubleshooting guides | Medium | Links function and lead to relevant documentation |
| Equipment Categories | Organized by type: washers, dryers, changers | Low | Logical categorization for easy navigation |

**Equipment Types and Documentation Links:**
- **Dexter Express Washers (Old/New)**: Official Dexter troubleshooting guide and customer support
- **Dexter Stacked Dryers (Old/New)**: Dexter troubleshooting and parts lookup
- **Huebsch Washers and Horizon Soft Mount Washers**: Huebsch commercial washer troubleshooting and tech support
- **Huebsch Stack Dryers and 80-pound Dryers**: Huebsch support and error code references

#### 6.2.9 Configuration & Environment Management Module
| Feature | Description | Priority | Acceptance Criteria |
|---------|-------------|----------|-------------------|
| Secure Credential Storage | Store API keys, passwords, and tokens securely | High | Encrypted local storage with access controls |
| Integration Settings | Configure Make.com, Gmail, Google Drive, Twilio, VAPI, Pipedream | High | All integrations function properly with stored credentials |
| User Profile Management | Username, preferences, and access permissions | High | Secure login and profile persistence |
| Environment Configuration | Development, staging, production environment settings | Medium | Easy switching between environments for testing |

#### 6.2.10 Air Filter Maintenance Tracking
| Filter Size | Equipment Type | Replacement Frequency | Estimated Cost |
|-------------|---------------|----------------------|----------------|
| 16x25x1 | Standard washers/dryers | Every 3 months | $8-15 each |
| 20x25x1 | Large capacity units | Every 3 months | $12-20 each |
| 24x24x1 | Commercial dryers | Every 2-3 months | $15-25 each |
| 16x20x1 | Exhaust systems | Every 3-4 months | $10-18 each |
| HEPA filters | Specialized equipment | Every 6 months | $25-45 each |
| Feature | Description | Priority | Acceptance Criteria |
|---------|-------------|----------|-------------------|
| Parts Inventory Tracking | Track parts on hand, reorder levels, supplier information | Medium | Real-time inventory levels with low-stock alerts |
| Supplier Directory | Organized list of parts suppliers with contact info and pricing | Medium | Searchable database with supplier comparison tools |
| Cost Tracking | Monitor parts costs and maintenance expenses per machine | Medium | Historical cost analysis and budget forecasting |
| Reorder Automation | Automated alerts when parts reach minimum stock levels | Low | Configurable reorder points and supplier notifications |

### 6.6 User Stories

#### 6.5.1 Primary Equipment Parts Suppliers

**Dexter Laundry Parts:**
- Official Dexter Genuine Parts through authorized distributors
- Alliance Laundry Systems Distribution: Same-day shipping on in-stock parts
- Western State Design: Authorized Dexter distributor with large inventory
- Laundry Owners Warehouse: Online parts with free shipping over $145

**Huebsch Laundry Parts:**
- Alliance Laundry Systems: Official Huebsch parts with same-day shipping
- OEM Laundry Parts: Official Huebsch parts with 30-day return policy
- Parts Town: Same-day shipping before 9 PM ET, Monday-Friday
- Laundry Parts: Discounted Huebsch commercial parts

#### 6.5.2 Common Replacement Parts and Estimated Costs

**High-Frequency Replacement Parts:**
| Part Category | Dexter Price Range | Huebsch Price Range | Replacement Frequency |
|---------------|-------------------|-------------------|----------------------|
| Water Valves | $45-$85 | $50-$90 | 2-3 years |
| Drain Valves | $65-$120 | $70-$125 | 2-4 years |
| Door Gaskets/Seals | $25-$75 | $30-$80 | 3-5 years |
| Coin Drop Mechanisms | $85-$150 | $90-$160 | 3-7 years |
| Drive Belts | $15-$45 | $20-$50 | 1-2 years |
| Pressure Switches | $35-$65 | $40-$70 | 2-4 years |

**Medium-Frequency Replacement Parts:**
| Part Category | Dexter Price Range | Huebsch Price Range | Replacement Frequency |
|---------------|-------------------|-------------------|----------------------|
| Water Pumps | $125-$300 | $140-$325 | 4-6 years |
| Motors (Wash/Spin) | $250-$650 | $275-$700 | 8-12 years |
| Control Boards | $200-$500 | $225-$550 | 6-10 years |
| Transmissions | $400-$800 | $450-$850 | 10-15 years |
| Agitators | $150-$400 | $175-$425 | 8-12 years |

**Low-Frequency Major Components:**
| Part Category | Dexter Price Range | Huebsch Price Range | Replacement Frequency |
|---------------|-------------------|-------------------|----------------------|
| Tub Assembly | $800-$1,500 | $900-$1,600 | 15-20 years |
| Complete Door Assembly | $300-$600 | $350-$650 | 10-15 years |
| Frame/Chassis Parts | $200-$1,000 | $250-$1,100 | 20+ years |

#### 6.5.3 Annual Maintenance Cost Estimates
- Annual maintenance costs: $500-$1,500 per machine
- Service call costs: $120-$500 per visit
- Preventive maintenance: $200-$400 per machine annually
- Emergency repairs: $300-$800 per incident

#### 6.5.4 Supplier Contact Information and Ordering

**Alliance Laundry Systems Distribution**
- Website: parts.alliancelaundry.com
- Same-day shipping before 4:00 PM PST
- Genuine OEM parts for both Dexter and Huebsch
- Volume discounts available

**OEM Laundry Parts**
- Phone: (904) 240-0211
- Website: oemlaundryparts.com
- 30-day return policy on unused parts
- Free shipping on orders over specified amounts

**Parts Town**
- Website: partstown.com
- Same-day shipping before 9 PM ET
- Comprehensive parts lookup by serial number
- Mobile app available for ordering

**Laundry Owners Warehouse**
- Website: lowlaundry.com
- Free shipping over $145
- Used equipment and parts available
- Warranty options on certified used parts

#### 6.5.5 Emergency Parts Inventory Recommendations
**Critical Stock Items (Always Keep On Hand):**
- Water inlet valves (2-3 units)
- Drain valves (2 units)
- Door seals/gaskets (1-2 per machine type)
- Drive belts (2-3 units)
- Coin mechanisms (1-2 backup units)

**Seasonal/Scheduled Replacement Items:**
- Annual: Pressure switches, minor seals
- Bi-annual: Water filters, cleaning supplies
- As needed: Control board components, motors

#### 6.5.6 Cost Optimization Strategies
- **Bulk Purchasing**: Volume discounts through collective buying
- **Preventive Maintenance**: Regular servicing to extend part life
- **Genuine vs. Aftermarket**: Balance cost savings with reliability
- **Local vs. National Suppliers**: Compare shipping costs and delivery times
- **Annual Contracts**: Negotiate maintenance agreements with suppliers

#### 6.2.7 Payment System Integration
| Feature | Description | Priority | Acceptance Criteria |
|---------|-------------|----------|-------------------|
| PayRange Integration | Link to PayRange management system | Low | Direct link to PayRange cashless payment platform for laundromats |
| ClearToken Integration | Link to ClearToken management system | Low | Direct link to ClearToken cashless payment system |
- **As a** field worker, **I want** to scan a QR code and have the system automatically read counter values **so that** I can collect money data without manual entry or calculation errors
- **As a** field worker, **I want** to enter my time worked with simple date/time inputs **so that** my hours are accurately tracked and calculated
- **As a** store operator, **I want** to trigger audio announcements at specific locations **so that** I can communicate with customers remotely
- **As a** field worker, **I want** access to equipment troubleshooting guides **so that** I can resolve issues quickly without calling support
- **As a** maintenance worker, **I want** to check parts inventory and pricing **so that** I can order replacements quickly and stay within budget
- **As a** business owner, **I want** to track maintenance costs per machine **so that** I can make informed decisions about repairs vs. replacement
- **As a** field technician, **I want** quick access to supplier contact information **so that** I can order emergency parts with same-day shipping
- **As a** manager, **I want** automated reorder alerts **so that** critical parts are always in stock and don't cause downtime

### 6.4 Non-Functional Requirements

#### 6.4.1 Performance
- QR code recognition: < 2 seconds from camera activation to code identification
- Counter value reading: < 3 seconds from image capture to value extraction
- Voice recognition: < 2 seconds from speech to text conversion
- Form submission: < 1 second for local data persistence
- SMS delivery: < 30 seconds from submission to message receipt
- Gmail purchase monitoring: < 5 minutes from email receipt to inventory update

#### 6.4.2 Mobile Optimization
- Touch-optimized navigation: Primary interactions designed for touch with limited data input capability
- Minimal text input: Voice input preferred where possible, touch input for corrections
- Touch targets: Minimum 44px touch targets for accessibility
- Screen orientation: Support both portrait and landscape modes
- One-handed operation: Critical functions accessible with single hand

#### 6.4.3 Data Persistence & Integration
- Local storage: All form data persists until successful submission
- Google Services Integration: Seamless sync with Gmail, Google Drive, Google Sheets, Google Calendar
- User preferences: Employee name selection and settings stored securely
- Offline capability: Core functions work without internet, sync when reconnected
- Data integrity: No data loss during session interruptions or system failures

#### 6.4.4 Security & Privacy
- API key encryption: All credentials encrypted and stored securely
- SMS security: Phone numbers encrypted and stored securely
- Local data protection: Sensitive information cleared after submission
- VOIP authentication: Secure webhook authentication for audio triggers
- QR code security: Unique, non-guessable QR codes for each machine
- OAuth integration: Secure authentication with Google services

#### 6.4.5 Usability
- Field-ready design: High contrast, readable in various lighting conditions
- Voice feedback: Audio confirmation of voice commands and critical actions
- Error prevention: Clear visual feedback and confirmation dialogs for all user actions
- Recovery: Easy correction of mistakes without data loss
- Accessibility: Support for users with disabilities including voice navigation

---

## 7. Technical Considerations

### 7.1 Architecture Overview
Progressive Web Application (PWA) built with mobile-first responsive design, featuring:
- Client-side QR code recognition and computer vision processing
- Voice recognition using Web Speech API
- Integration with Make.com for workflow automation
- Google Workspace integration (Gmail, Drive, Sheets, Calendar)
- Local storage for data persistence and offline capability
- RESTful API integration for SMS notifications and VOIP webhooks
- Modular component architecture for easy maintenance and updates

### 7.2 Technology Stack
- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Progressive Web App (PWA)
- **Computer Vision:** JavaScript-based OCR library (TesseractJS)
- **QR Code Processing:** qr-scanner.js library
- **Voice Recognition:** Web Speech API (SpeechRecognition)
- **Local Storage:** Browser localStorage API with encryption for sensitive data
- **Automation Platform:** Make.com for workflow automation and integrations
- **Google Services:** Gmail API, Google Drive API, Google Sheets API, Google Calendar API
- **SMS Integration:** Twilio API for notifications
- **Voice Integration:** VAPI for advanced voice processing
- **Workflow Automation:** Pipedream for additional integration capabilities

### 7.3 Integration Requirements
- **Make.com Workflows:** Automated data processing and cross-platform integrations
- **Gmail Integration:** OAuth authentication for purchase monitoring and email parsing
- **Google Drive/Sheets:** Real-time data synchronization and storage
- **Google Calendar:** Bidirectional sync for to-do list management
- **Twilio SMS:** Notification delivery service
- **VAPI Integration:** Voice command processing and audio feedback
- **Pipedream Workflows:** Additional automation for complex business logic
- **Current HTML Applications:** Import/migrate functionality from three existing single-page applications

### 7.4 Data Requirements
- **Local Encrypted Storage:** User credentials, API keys, sensitive configuration data
- **Google Sheets Integration:** Real-time data sync replacing fragile formula system
- **Gmail Parsing:** Automated extraction of purchase data (item number, quantity, source, date, cost)
- **Drive Storage:** Document management and file synchronization
- **Calendar Integration:** To-do list and scheduling data
- **External APIs:** SMS delivery, VOIP webhook triggers, voice processing

---

## 8. Design Requirements

### 8.1 User Interface
- **Clean and Simple:** Uncluttered interface with minimal visual elements
- **High Contrast:** Readable in various lighting conditions (indoor/outdoor field work)
- **Large Touch Targets:** Minimum 44px buttons optimized for thumb interaction
- **Mobile-First:** Designed specifically for mobile screens, desktop for setup only
- **Single-Hand Operation:** All primary functions accessible with one hand

### 8.2 User Experience
- **Thumb-Only Navigation:** No keyboard input required for field operations
- **Progressive Disclosure:** Show only relevant options at each step
- **Clear Visual Feedback:** Immediate confirmation of all user actions
- **Error Prevention:** Design that minimizes potential for user mistakes
- **Workflow Optimization:** Streamlined paths for common tasks (money collection, time entry)

### 8.3 Design Inspiration
Following the design intent from the existing BTM Intercoms application (brianmickley.com/intercoms_new.html):
- Simple button-based interface
- Clear categorization of functions
- Immediate action feedback
- Minimal text, maximum clarity

---

## 9. Implementation Plan

### 9.1 Project Timeline
| Phase | Deliverables | Timeline | Key Features |
|-------|--------------|----------|--------------|
| **MVP (Phase I)** | Basic functional application with core features | 3 days from start | QR code scanning, basic money collection, simple to-do list, emergency contacts |
| **Enhanced (Phase II)** | Full-featured application with integrations | 2 weeks from start | Gmail integration, voice input, parts tracking, complete communications module |
| **Final (Phase III)** | Production-ready with documentation | TBD after Phase II | Full optimization, comprehensive documentation, user training materials |

### 9.2 Phase I - MVP Deliverables (3 Days)
**Core Functionality:**
- QR code scanning and basic counter reading
- Manual money collection entry with quarter/dollar confirmation
- Simple to-do list with basic CRUD operations
- Emergency contact directory with police departments
- Basic SMS notifications via Twilio
- Configuration page for API keys and basic settings

**Technical Files:**
- index.html (main application)
- styles.css (mobile-first responsive design)
- app.js (core JavaScript functionality)
- config.js (environment and API configuration)
- Basic documentation (README.md, setup instructions)

### 9.3 Phase II - Enhanced Version Deliverables (2 Weeks)
**Full Feature Set:**
- Complete Gmail integration for purchase monitoring
- Voice-enabled to-do list with Web Speech API
- Full parts tracking and troubleshooting module
- Google Calendar integration
- Advanced configuration management
- Complete VOIP communications integration
- Air filter tracking and maintenance schedules

**Technical Files:**
- Modular JavaScript components (money-collection.js, parts-tracker.js, voice-input.js)
- Make.com workflow configurations
- Google API integration modules
- Enhanced documentation (technical specs, API documentation)
- User manual (basic)

### 9.4 Phase III - Final Version Deliverables
**Production Ready:**
- Performance optimization and testing
- Comprehensive error handling and recovery
- Advanced security implementations
- Complete user and technical documentation
- Deployment guides and troubleshooting
- Training materials and video guides

**Complete Documentation Package:**
- Technical documentation (architecture, API references, deployment)
- User documentation (operation manual, troubleshooting guide)
- Admin documentation (configuration, maintenance, security)
- Video tutorials for key functions
- Setup and installation guides

### 9.5 Resource Requirements
- **Development Team:** 1 Full-stack developer (Brian McClee)
- **Design/UX:** Integrated with development
- **Testing:** Manual testing by stakeholders (Tammy, Garrett, Johnny, Ryan)
- **Integration Support:** As needed for Make.com, Google APIs, Twilio setup

### 9.6 Dependencies
- Google Workspace API access and OAuth setup
- Make.com account and workflow configuration
- Twilio account for SMS services
- VAPI account for voice processing
- Domain and hosting setup for PWA deployment

---

## 10. Risk Assessment

| Risk | Impact | Probability | Mitigation Strategy |
|------|---------|-------------|-------------------|
| QR Code Recognition Accuracy | Low | Low | Iterate until resolved - implement manual override options |
| Voice Recognition Performance | Low | Low | Iterate until resolved - provide touch input alternatives |
| Google API Rate Limiting | Low | Low | Iterate until resolved - implement proper caching and retry logic |
| Integration Complexity | Low | Low | Iterate until resolved - modular development approach |
| User Adoption Resistance | Low | Low | Iterate until resolved - comprehensive training and gradual rollout |
| Data Migration Issues | Low | Low | Iterate until resolved - maintain parallel systems during transition |

**Overall Risk Level:** Low Risk, Low Probability
**Primary Mitigation:** Iterative development approach with continuous stakeholder feedback and immediate issue resolution

---

## 11. Launch Strategy

### 11.1 Go-to-Market Plan
[How you'll introduce the product to market]

### 11.2 Marketing Strategy
[Key marketing channels and messaging]

### 11.3 Launch Phases
- **Alpha:** [Internal testing plan]
- **Beta:** [Limited external release]
- **General Availability:** [Full public release]

---

## 12. Post-Launch

### 12.1 Success Measurement
**Primary Success Criteria:**
1. **Funds are recorded appropriately** - 99%+ accuracy in money collection tracking with proper quarter/dollar mode identification
2. **Hours worked are easily and accurately recorded** - Time entry completion rate >95% with automatic calculation accuracy
3. **Repair parts and documentation links are orderly and easily accessed** - <3 second access time to troubleshooting resources

**Additional Metrics:**
- User adoption rate among 5 stakeholders: 100% within 1 week of Phase II deployment
- Error reduction in money collection: >90% decrease in calculation errors
- Time savings: 25% reduction in money collection round duration
- Parts inventory accuracy: Real-time tracking with <5% variance

### 12.2 Problem Resolution Tracking
**Addressed Issues:**
- **Changer/Hopper Numbering Confusion:** Clear visual QR code identification system with location/machine confirmation
- **Incorrect Number Entry:** Computer vision validation with manual override and confirmation prompts
- **Quarter vs Dollar Counting Confusion:** Mandatory confirmation of counting mode (4 ticks = quarters, 1 tick = dollars) with visual indicators
- **Coin Office Confirmation:** Required checkbox and comment system for collection accountability

### 12.3 Iteration Plan
**Continuous Improvement Process:**
- Weekly stakeholder feedback sessions during first month
- Monthly feature enhancement reviews
- Quarterly system performance assessments
- Annual technology stack and integration reviews

**Feedback Integration:**
- Real-time issue reporting through application
- Regular user experience surveys
- Performance monitoring and optimization
- Feature request tracking and prioritization

### 12.4 Maintenance & Support
**Ongoing Support Requirements:**
- Monthly system health checks and updates
- Quarterly integration testing (Gmail, Google Drive, APIs)
- Annual security audits and credential rotation
- 24/7 monitoring for critical business functions (money collection, communications)

**Technical Maintenance:**
- Regular backup verification and recovery testing
- API rate limit monitoring and optimization
- Performance metrics tracking and improvement
- Security patch management and updates

---

## 13. Appendices

### Appendix A: Research Data
[Link to user research, surveys, interviews]

### Appendix B: Technical Specifications
[Detailed technical documentation]

### Appendix C: Legal & Compliance
[Relevant legal considerations]

---

## Approval & Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Manager | [Name] | [Date] | [Signature] |
| Engineering Lead | [Name] | [Date] | [Signature] |
| Design Lead | [Name] | [Date] | [Signature] |
| Business Stakeholder | [Name] | [Date] | [Signature] |

---

*This document is a living document and will be updated as the product evolves.*