# BTM Utility - Test Plan

## Test Plan Overview

**Document Version**: 1.0  
**Project**: BTM Utility - Laundromat Management System  
**Test Manager**: Brian McClee  
**Created**: July 27, 2025  
**Last Updated**: July 27, 2025

## Testing Objectives

### Primary Objectives
1. **Functional Verification**: Ensure all features work as specified in requirements
2. **User Experience Validation**: Confirm usability meets field work demands
3. **Integration Testing**: Verify seamless operation with external APIs and services
4. **Performance Validation**: Meet response time and reliability requirements
5. **Security Assurance**: Protect sensitive data and system access
6. **Device Compatibility**: Function correctly across target mobile devices

### Success Criteria
- **Functionality**: 100% of critical features pass acceptance tests
- **Performance**: 95% of operations complete within 3-second target
- **Compatibility**: Works on iOS Safari and Android Chrome
- **Usability**: 95% task completion rate by stakeholders without assistance
- **Reliability**: Zero data loss during testing scenarios
- **Security**: No unauthorized access to sensitive functions

## Test Scope

### In Scope
**Phase I - MVP Testing**
- QR code scanning and machine identification
- Money collection workflow with calculations
- Basic to-do list functionality
- Emergency contact directory
- SMS notification delivery
- Security camera portal basic viewing
- Temperature monitoring and basic thermostat control
- Configuration system functionality

**Phase II - Enhanced Testing**
- Google Services integration (Gmail, Sheets, Drive, Calendar)
- Voice recognition and task creation
- Gmail purchase monitoring and parts inventory
- Equipment troubleshooting system
- VOIP communications
- Make.com workflow automation
- Advanced camera features (recording, motion detection)
- Climate control scheduling and optimization

**Cross-Phase Testing**
- Mobile device compatibility
- Offline functionality and data sync
- Security and authentication
- Performance under load
- User acceptance testing

### Out of Scope
- Load testing beyond normal usage patterns
- Penetration testing (basic security validation only)
- Cross-browser testing beyond iOS Safari and Android Chrome
- Testing with simulated data only (no production data during testing)

## Test Types and Strategy

### 1. Unit Testing
**Scope**: Individual functions and components  
**Responsibility**: Developer (Brian)  
**Tools**: Manual testing, browser console  
**Schedule**: Continuous during development

**Focus Areas**:
- QR code parsing logic
- Counter value calculations
- Data validation functions
- API integration modules
- Local storage operations

### 2. Integration Testing
**Scope**: Component interactions and external API integrations  
**Responsibility**: Developer (Brian)  
**Tools**: Manual testing, API testing tools  
**Schedule**: After each component completion

**Focus Areas**:
- Google Workspace API connections
- Twilio SMS delivery
- Camera system API integration
- HVAC/thermostat API communication
- Make.com webhook triggers
- VAPI voice processing

### 3. System Testing
**Scope**: End-to-end workflows and complete feature sets  
**Responsibility**: Developer + stakeholders  
**Tools**: Manual testing on actual devices  
**Schedule**: End of each phase

**Focus Areas**:
- Complete money collection workflow
- Voice-to-task creation process
- Parts inventory and purchasing workflow
- Security monitoring procedures
- Climate control operations

### 4. User Acceptance Testing (UAT)
**Scope**: Real-world usage scenarios by actual users  
**Responsibility**: All stakeholders  
**Tools**: Production-like environment  
**Schedule**: Phase completion and pre-deployment

**Focus Areas**:
- Field worker usability
- Admin configuration tasks
- Emergency procedures
- Daily operational workflows

### 5. Performance Testing
**Scope**: Response times, resource usage, scalability  
**Responsibility**: Developer (Brian)  
**Tools**: Browser dev tools, mobile device testing  
**Schedule**: Continuous monitoring

**Focus Areas**:
- Mobile app loading times
- Camera feed streaming performance
- Voice recognition response time
- API call latency
- Offline/online synchronization

### 6. Security Testing
**Scope**: Authentication, authorization, data protection  
**Responsibility**: Developer (Brian)  
**Tools**: Manual testing, browser security tools  
**Schedule**: After security features implemented

**Focus Areas**:
- API key protection
- User authentication
- Camera access security
- Data encryption validation
- Session management

## Test Environment Setup

### Device Requirements
**Primary Test Devices**:
- iPhone 12/13/14 (iOS 15+) with Safari
- Samsung Galaxy S21/S22 (Android 11+) with Chrome
- iPad (for desktop interface testing)

**Network Conditions**:
- WiFi (high-speed)
- 4G LTE (typical field conditions)
- 3G (poor connectivity simulation)
- Offline mode

### Test Data Setup
**QR Codes**: Generate test QR codes for each machine/hopper combination
- Peacock: 3 changers × 1 hopper = 3 QR codes
- Dover: 3 changers × 1 hopper = 3 QR codes  
- Massillon: 2 changers × 2 hoppers = 4 QR codes
- Total: 10 unique QR codes for testing

**Test Accounts**:
- Google Workspace test account with limited permissions
- Twilio development account for SMS testing
- Test camera system access
- Development HVAC API credentials

**Sample Data**:
- Historical money collection records
- Parts inventory test data
- Contact directory information
- Sample maintenance tasks

## Detailed Test Cases

### Test Suite 1: Money Collection Workflow

#### TC-001: QR Code Scanning and Machine Identification
**Objective**: Verify QR code scanning correctly identifies machines
**Priority**: Critical
**Preconditions**: Camera permissions enabled, QR codes available

**Test Steps**:
1. Open BTM Utility application
2. Navigate to Money Collection module
3. Tap QR Scanner button
4. Point camera at test QR code for Peacock Changer 1
5. Verify automatic code recognition
6. Confirm machine details display correctly

**Expected Results**:
- Camera activates within 2 seconds
- QR code recognized within 3 seconds
- Correct location, changer, and hopper information displayed
- Manual entry option available if scanning fails

**Test Data**: All 10 QR codes (3 Peacock, 3 Dover, 4 Massillon)
**Status**: Not Started

#### TC-002: Counter Value Reading and Validation
**Objective**: Verify counter value input and calculation accuracy
**Priority**: Critical
**Preconditions**: Machine identified via QR code

**Test Steps**:
1. Complete QR code scanning (TC-001)
2. Select counting mode (quarters vs dollars)
3. Enter counter value manually or via OCR
4. Add comments (optional)
5. Check "coins brought to office" box
6. Submit collection data

**Expected Results**:
- Counting mode clearly indicated with visual cues
- Counter value accepts only valid numeric input
- Calculations performed correctly (quarters: value ÷ 4, dollars: value × 1)
- Form validation prevents submission without required fields
- Success confirmation displayed after submission

**Test Data**: 
- Quarter mode: 1000 (= $250), 2400 (= $600)
- Dollar mode: 150 (= $150), 275 (= $275)
**Status**: Not Started

#### TC-003: Duplicate Collection Prevention
**Objective**: Verify system prevents duplicate collections for same machine/day
**Priority**: High
**Preconditions**: One collection already recorded for current day

**Test Steps**:
1. Complete valid money collection for Peacock Changer 1
2. Attempt second collection for same machine on same day
3. Verify duplicate prevention mechanism

**Expected Results**:
- System displays warning about existing collection
- Option to view previous collection details
- Option to override with admin approval
- Clear indication of last collection time

**Status**: Not Started

### Test Suite 2: Voice-Enabled To-Do Management

#### TC-004: Voice Recognition and Task Creation
**Objective**: Verify voice input creates tasks correctly
**Priority**: High
**Preconditions**: Microphone permissions enabled

**Test Steps**:
1. Navigate to To-Do List module
2. Tap microphone button
3. Speak: "Replace filter at Dover changer 2 next Friday"
4. Review transcription and parsed task details
5. Confirm or edit task information
6. Save task

**Expected Results**:
- Microphone activates with visual indicator
- Voice recorded and transcribed within 3 seconds
- Task details parsed correctly (action, location, machine, date)
- User can edit parsed information before saving
- Task appears in to-do list with correct details

**Test Data**: Multiple voice commands with different complexity levels
**Status**: Not Started

#### TC-005: Task Management Operations
**Objective**: Verify complete task lifecycle management
**Priority**: Medium
**Preconditions**: Tasks exist in system

**Test Steps**:
1. Create new task via voice or manual entry
2. Edit existing task details
3. Mark task as completed
4. Delete completed task
5. Filter tasks by status/priority

**Expected Results**:
- All CRUD operations function correctly
- Task status updates persist across sessions
- Completed tasks visually distinguished
- Filters work correctly

**Status**: Not Started

### Test Suite 3: Security Camera Portal

#### TC-006: Camera Feed Access and Viewing
**Objective**: Verify live camera feed functionality
**Priority**: High
**Preconditions**: Camera system configured and accessible

**Test Steps**:
1. Navigate to Security Portal
2. Select location (Peacock, Dover, or Massillon)
3. View Camera 1 feed
4. Switch to Camera 2 (if available)
5. Test feed quality and responsiveness

**Expected Results**:
- Camera selection interface loads quickly
- Live video feed displays within 5 seconds
- Video quality adequate for monitoring
- Camera switching works smoothly
- Feed remains stable during viewing

**Status**: Not Started

#### TC-007: Motion Detection and Alerts
**Objective**: Verify motion detection triggers alerts correctly
**Priority**: Medium
**Preconditions**: Motion detection configured, SMS notifications enabled

**Test Steps**:
1. Configure motion detection for test camera
2. Trigger motion in camera view
3. Verify alert generation and delivery
4. Check alert history and logs

**Expected Results**:
- Motion detection activates correctly
- SMS alerts sent to configured recipients
- Alert timestamp and camera ID recorded
- False positive rate acceptable (<10%)

**Status**: Not Started

### Test Suite 4: Climate Control System

#### TC-008: Temperature Monitoring
**Objective**: Verify temperature readings and display
**Priority**: Medium
**Preconditions**: Temperature sensors connected and configured

**Test Steps**:
1. Navigate to Climate Control module
2. Select location
3. View current temperature and humidity
4. Check historical temperature data
5. Verify sensor status indicators

**Expected Results**:
- Current readings display within 3 seconds
- Data updates regularly (every 5 minutes)
- Historical data displays correctly
- Sensor offline status detected and shown

**Status**: Not Started

#### TC-009: Thermostat Control and Scheduling
**Objective**: Verify remote temperature control functionality
**Priority**: Medium
**Preconditions**: HVAC system API configured

**Test Steps**:
1. View current thermostat settings
2. Adjust target temperature using controls
3. Change HVAC mode (heat/cool/auto)
4. Set up temperature schedule
5. Verify changes take effect

**Expected Results**:
- Temperature adjustments sent to HVAC system
- Mode changes reflected in system status
- Schedule programming saves correctly
- Actual temperature changes occur (may take time)

**Status**: Not Started

### Test Suite 5: Integration Testing

#### TC-010: Google Services Integration
**Objective**: Verify seamless integration with Google Workspace
**Priority**: Critical
**Preconditions**: Google OAuth configured, test account available

**Test Steps**:
1. Authenticate with Google account
2. Test Gmail purchase monitoring
3. Verify Google Sheets data synchronization
4. Test Google Calendar task integration
5. Check Google Drive document access

**Expected Results**:
- OAuth authentication completes successfully
- Gmail parsing extracts purchase data correctly
- Sheets sync preserves data integrity
- Calendar events created for tasks
- Drive documents accessible from app

**Status**: Not Started

#### TC-011: SMS Notification Delivery
**Objective**: Verify SMS notifications sent correctly
**Priority**: High
**Preconditions**: Twilio configured, test phone numbers available

**Test Steps**:
1. Complete money collection submission
2. Create new task via voice
3. Trigger temperature alert condition
4. Verify SMS delivery to correct recipients

**Expected Results**:
- SMS sent within 30 seconds of trigger
- Message content accurate and informative
- Correct recipients receive notifications
- Delivery confirmation received

**Status**: Not Started

## Test Data Management

### Test Data Categories
**Configuration Data**:
- API keys and credentials (development versions)
- Machine/location mappings
- User preferences and settings

**Transaction Data**:
- Sample money collection records
- Parts inventory transactions
- Task creation and completion records

**Reference Data**:
- Contact directory information
- Equipment troubleshooting links
- Supplier information

### Data Privacy and Security
- Use only test/development accounts
- No production financial data in testing
- Sanitize any real customer information
- Secure storage of test credentials

## Test Schedule

### Phase I Testing (Days 1-3)
**Day 1**: Unit testing as components developed
**Day 2**: Integration testing for completed modules
**Day 3**: System testing and basic UAT

### Phase II Testing (Days 4-17)
**Week 1**: Integration testing for Google services and voice features
**Week 2**: Advanced feature testing, performance validation

### Phase III Testing (Days 18-21)
**Days 18-19**: Security testing, performance optimization
**Days 20-21**: Final UAT, deployment testing

### Ongoing Testing
**Weekly**: Regression testing of core functions
**Monthly**: Performance monitoring and optimization

## Defect Management

### Defect Classification
**Critical**: System crash, data loss, security breach
**High**: Major feature failure, incorrect calculations
**Medium**: Minor feature issues, usability problems
**Low**: Cosmetic issues, nice-to-have improvements

### Defect Resolution Targets
- **Critical**: Fix within 4 hours
- **High**: Fix within 24 hours
- **Medium**: Fix within 3 days
- **Low**: Fix in next release cycle

### Defect Tracking
- **Tool**: GitHub Issues or simple spreadsheet
- **Required Information**: Steps to reproduce, expected vs actual results, device/browser info
- **Status Tracking**: Open, In Progress, Fixed, Verified, Closed

## Acceptance Criteria

### Phase I MVP Acceptance
- [ ] All critical test cases pass (TC-001, TC-002, TC-003)
- [ ] Basic functionality works on primary test devices
- [ ] No critical or high-severity defects outstanding
- [ ] Stakeholder approval from at least 3 of 5 team members

### Phase II Enhanced Acceptance
- [ ] All high-priority test cases pass
- [ ] Google integrations functional
- [ ] Voice recognition accuracy >80% in test conditions
- [ ] Camera and climate control basic functions operational

### Production Deployment Acceptance
- [ ] All test cases pass except known low-priority issues
- [ ] Performance targets met (95% of operations <3 seconds)
- [ ] Security validation completed
- [ ] User documentation complete and tested
- [ ] Deployment procedures verified

## Test Deliverables

### Test Documentation
- Test execution reports (daily during testing phases)
- Defect summary reports
- Performance test results
- User acceptance sign-off documents

### Test Artifacts
- Test case execution logs
- Screenshots/videos of defects
- Performance measurement data
- Device compatibility matrix

This test plan ensures comprehensive validation of the BTM Utility system across all critical functionality while maintaining focus on real-world usage scenarios and performance requirements.