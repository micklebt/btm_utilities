# BTM Utility - Project Charter

## Project Information

- **Project Title**: BTM Utility - Comprehensive Laundromat Management System
- **Project Code**: BTM-UTIL-2025
- **Project Sponsor**: Brian McClee (BTM Inc.)
- **Project Manager**: Brian McClee
- **Charter Date**: July 27, 2025
- **Planned Start Date**: July 27, 2025
- **Planned Completion Date**: August 17, 2025 (3 weeks)

## Project Description

BTM Utility is a mobile-first Progressive Web Application designed to consolidate and modernize BTM Inc.'s laundromat operations management. The system will replace fragile Google Sheets-based processes with a unified platform combining money collection tracking, task management, parts inventory, equipment monitoring, security camera access, and climate control.

## Business Justification

### Current Problems

1. **Operational Inefficiency**: Three separate HTML applications create workflow fragmentation
2. **Data Integrity Issues**: Fragile Google Sheets formulas break frequently, causing calculation errors
3. **Manual Process Dependencies**: Heavy reliance on manual data entry leads to transcription errors
4. **Limited Field Usability**: Current systems not optimized for mobile field work
5. **Security & Climate Blind Spots**: No centralized monitoring of store security cameras or temperature control

### Expected Benefits

- **Operational Efficiency**: 25% reduction in money collection round time
- **Data Accuracy**: 90% reduction in calculation errors vs current Google Sheets
- **Cost Savings**: Reduced labor hours and improved inventory management
- **Enhanced Security**: Real-time camera monitoring and motion detection alerts
- **Energy Efficiency**: Smart temperature control and usage optimization
- **Improved Compliance**: Better audit trail and data retention

### Return on Investment

- **Development Cost**: ~40 hours @ $50/hour = $2,000
- **Annual Labor Savings**: 2 hours/week × 52 weeks × $25/hour = $2,600
- **Error Reduction Value**: Estimated $1,200/year in prevented losses
- **Energy Savings**: Estimated $800/year through smart climate control
- **Net Annual Benefit**: $4,600 - $500 (maintenance) = $4,100
- **ROI**: 205% in first year

## Project Objectives

### Primary Objectives

1. **Consolidate Systems**: Replace 3 separate applications with 1 unified platform
2. **Eliminate Calculation Errors**: Robust calculation engine replacing fragile spreadsheets
3. **Mobile Optimization**: Field-ready interface optimized for smartphone use
4. **Automate Data Entry**: QR code scanning and computer vision for counter reading
5. **Integrate Business Systems**: Seamless connection with Google Workspace and external APIs
6. **Enhance Security Monitoring**: Live camera feeds and motion detection alerts
7. **Optimize Climate Control**: Remote temperature management and energy efficiency

### Success Criteria

- **User Adoption**: 100% of stakeholders (5 people) actively using system within 1 week
- **Data Accuracy**: <1% error rate in money collection calculations
- **Performance**: All critical functions responsive within 3 seconds on mobile
- **Reliability**: 99.5% uptime during business hours
- **Usability**: 95% task completion rate without assistance after training

## Project Scope

### In Scope

**Phase I - MVP (3 Days)**

- QR code-based money collection with computer vision counter reading
- Voice-enabled to-do list management
- Emergency contact directory with quick-dial
- Basic SMS notifications
- Security camera portal with live viewing
- Temperature monitoring and basic thermostat control
- Configuration system for API keys and settings

**Phase II - Enhanced (2 Weeks)**

- Google Services integration (Gmail, Drive, Sheets, Calendar)
- Gmail purchase monitoring and parts inventory tracking
- Equipment troubleshooting documentation system
- VOIP communications for store announcements
- Make.com workflow automation
- Advanced camera features (recording, motion detection)
- Climate control scheduling and energy optimization

**Phase III - Production (Ongoing)**

- Performance optimization and security hardening
- Comprehensive documentation and training materials
- API development for future third-party integrations
- Advanced analytics and reporting capabilities

### Out of Scope

- Multi-tenant support for other companies (future consideration)
- Native mobile app development (PWA sufficient for current needs)
- Advanced AI/ML features beyond basic computer vision
- Integration with accounting software (beyond Google Sheets)
- Customer-facing features or public interfaces

### Boundaries

- **Geographic**: Limited to 3 BTM Inc. locations (Peacock, Dover, Massillon)
- **Users**: Internal stakeholders only (5 primary users)
- **Technology**: Web-based application, no desktop software
- **Data**: Business operational data only, no customer personal data

## Key Stakeholders

### Primary Stakeholders

| Name         | Role                      | Responsibilities                                             | Contact     |
| ------------ | ------------------------- | ------------------------------------------------------------ | ----------- |
| Brian McClee | Project Sponsor/Developer | Overall project leadership, development, admin configuration | Primary     |
| Tammy        | Field Operations          | User acceptance testing, process validation                  | Stakeholder |
| Garrett      | Field Operations          | Money collection testing, feedback                           | Stakeholder |
| Johnny       | Field Operations          | Money collection testing, feedback                           | Stakeholder |
| Ryan         | Field Operations          | User testing, process feedback                               | Stakeholder |

### Secondary Stakeholders

- **Equipment Suppliers**: Alliance Laundry, Parts Town, OEM Laundry Parts (integration testing)
- **Service Providers**: Twilio (SMS), Google (Workspace), Make.com (automation)
- **Hostinger**: Web hosting and domain management

## High-Level Timeline

### Phase I - MVP (Days 1-3)

- **Day 1**: Project setup, core UI framework, QR scanning
- **Day 2**: Money collection module, to-do list, contacts
- **Day 3**: SMS integration, security portal, climate control, testing

### Phase II - Enhanced (Days 4-17)

- **Week 1**: Google integrations, voice features, parts tracking
- **Week 2**: Equipment docs, communications, advanced camera/climate features

### Phase III - Production (Days 18-21)

- **Days 18-19**: Performance optimization, security hardening
- **Days 20-21**: Documentation, training, final deployment

### Key Milestones

- **Day 3**: MVP functional and deployed
- **Day 10**: All Google integrations operational
- **Day 17**: Full feature set complete
- **Day 21**: Production ready with documentation

## Budget Estimate

### Development Costs

- **Labor**: 120 hours × $50/hour = $6,000
- **API Services**: $50/month × 12 months = $600
- **Hosting**: $100/year = $100
- **Domain/SSL**: $50/year = $50
- **Development Tools**: $200
- **Testing Devices**: $300
- **Total Project Cost**: $7,250

### Ongoing Operational Costs

- **API Services**: $50/month = $600/year
- **Hosting**: $100/year
- **Maintenance**: 10 hours/year × $50/hour = $500/year
- **Total Annual Cost**: $1,200/year

## Major Risks and Assumptions

### High-Risk Items

| Risk                                 | Probability | Impact | Mitigation Strategy                               |
| ------------------------------------ | ----------- | ------ | ------------------------------------------------- |
| Google API rate limiting             | Medium      | High   | Implement caching, retry logic, backup processes  |
| Camera system integration complexity | Medium      | Medium | Start with basic viewing, enhance iteratively     |
| Voice recognition accuracy in field  | High        | Medium | Provide touch alternatives, iterative improvement |
| User adoption resistance             | Low         | High   | Comprehensive training, gradual rollout           |

### Medium-Risk Items

| Risk                          | Probability | Impact | Mitigation Strategy                            |
| ----------------------------- | ----------- | ------ | ---------------------------------------------- |
| HVAC API compatibility issues | Medium      | Medium | Research APIs early, have manual fallback      |
| Mobile browser compatibility  | Low         | Medium | Cross-browser testing, progressive enhancement |
| Network connectivity in field | Medium      | Low    | Offline capability, local storage              |

### Key Assumptions

- **Technical**: Current camera and HVAC systems have accessible APIs
- **Business**: All stakeholders have smartphones capable of running the application
- **Operational**: Weekly Friday collection schedule will continue
- **Integration**: Google Workspace access will remain available
- **Infrastructure**: Hostinger hosting will provide adequate performance

## Project Constraints

### Technical Constraints

- **Browser Support**: Modern mobile browsers only (iOS Safari, Android Chrome)
- **Offline Capability**: Must function without internet for core features
- **Performance**: 3-second response time maximum on 4G mobile connection
- **Security**: Must protect API keys and sensitive configuration data

### Business Constraints

- **Budget**: Maximum $7,500 total project cost
- **Timeline**: Must have MVP working within 3 days
- **Resources**: Single developer (Brian) with stakeholder testing support
- **Availability**: Development work around operational business needs

### Regulatory Constraints

- **Data Privacy**: Comply with basic business data protection practices
- **Financial Data**: Maintain audit trail for money collection records
- **Security**: Secure camera access and climate control to prevent unauthorized use

## Success Metrics

### Quantitative Metrics

- **Error Reduction**: <1% calculation errors (vs ~10% current rate)
- **Time Savings**: 25% reduction in collection round duration
- **User Adoption**: 100% active usage within 1 week of Phase II completion
- **System Uptime**: 99.5% availability during business hours
- **Performance**: 95% of actions complete within 3 seconds
- **Energy Savings**: 10% reduction in HVAC costs through smart scheduling

### Qualitative Metrics

- **User Satisfaction**: >4.0/5.0 rating from all stakeholders
- **Process Improvement**: Elimination of manual formula copying
- **Data Integrity**: Consistent, reliable financial reporting
- **Operational Confidence**: Reduced stress and uncertainty in field operations
- **Future Readiness**: Platform suitable for business expansion

## Approval and Authorization

### Project Authorization

This project is authorized to proceed based on the business case presented above. The project sponsor (Brian McClee) has authority to make decisions regarding scope, timeline, and resource allocation within the constraints outlined.

### Change Control

Any changes to scope, timeline, or budget exceeding $500 or 5 hours of effort must be approved by the project sponsor. Changes will be documented and communicated to all stakeholders.

### Next Steps

1. **Immediate**: Begin Phase I development (Task 1.1 - Project setup)
2. **Day 1**: Stakeholder kickoff meeting to review charter and expectations
3. **Day 3**: MVP demonstration and feedback collection
4. **Weekly**: Progress reviews with stakeholder input

---

**Charter Approval**

**Project Sponsor**: Brian McClee  
**Date**: July 27, 2025  
**Signature**: [Digital Approval]

This charter represents the official authorization to begin the BTM Utility project as outlined above.