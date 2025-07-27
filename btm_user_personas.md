# BTM Utility - User Personas

## Primary User Personas

### Persona 1: Brian McClee - The Tech-Savvy Owner/Administrator

**Demographics**
- Age: 45
- Role: Business Owner & System Administrator
- Location: Ohio (multiple locations)
- Device: iPhone 14 Pro, MacBook Pro
- Technical Skill: High (Developer/IT background)

**Background & Context**
Brian is the owner of BTM Inc. and the primary technical person. He currently manages three separate HTML applications and a fragile Google Sheets system. He's frustrated with the manual processes and calculation errors that occur during money collection rounds.

**Goals & Motivations**
- Eliminate calculation errors and system fragmentation
- Reduce time spent on manual data entry and formula fixes
- Have real-time visibility into all locations' operations
- Maintain control over system configuration and security
- Monitor security cameras and climate control remotely

**Pain Points & Frustrations**
- Google Sheets formulas break when colleagues copy them incorrectly
- Switching between multiple applications during field work
- Manual entry errors leading to financial discrepancies
- No real-time monitoring of store conditions
- Time-consuming troubleshooting of broken spreadsheet calculations

**Technology Usage**
- Smartphone: Primary device for field work
- Desktop: Configuration and administrative tasks
- Browser: Chrome/Safari, comfortable with web applications
- Voice: Uses Siri regularly, comfortable with voice commands
- Apps: Prefers web apps over native apps for business use

**User Journey Priorities**
1. **Quick Setup**: Wants to configure the system once and have it work reliably
2. **Administrative Control**: Needs ability to modify settings and view all data
3. **Real-time Monitoring**: Wants instant alerts and status updates
4. **Cross-device Access**: Must work seamlessly on phone and desktop

**Success Metrics**
- Zero calculation errors in money collection
- 50% reduction in time spent on system maintenance
- Real-time visibility into all locations' status
- Single source of truth for all operational data

---

### Persona 2: Johnny & Garrett - The Primary Field Collectors

**Demographics**
- Age: 30-40
- Role: Field Operations Team
- Location: Ohio (travel between locations)
- Device: Android/iPhone (mid-range models)
- Technical Skill: Medium (comfortable with smartphones, apps)

**Background & Context**
Johnny and Garrett are responsible for weekly money collection rounds every Friday. They currently struggle with the existing Google Sheets system and manual calculations. They need a system that works reliably in the field with minimal typing.

**Goals & Motivations**
- Complete money collection rounds quickly and accurately
- Avoid manual calculation errors that cause problems later
- Easy task management for maintenance and repairs
- Quick access to emergency contacts and supplier information
- Confidence that their data entry is correct

**Pain Points & Frustrations**
- Confusion about which machine is "Changer 1" vs "Changer 2"
- Difficulty determining if counter counts quarters or dollars
- Manual entry on small phone keyboards while wearing work gloves
- Uncertainty about whether calculations are correct
- Time wasted fixing broken spreadsheet formulas

**Technology Usage**
- Smartphone: Primary device for all field work
- Voice: Comfortable with voice assistants for simple commands
- Touch: Prefers large buttons and minimal typing
- Camera: Uses phone camera regularly for documentation
- Apps: Prefers simple, intuitive interfaces

**Typical Use Context**
- **Environment**: Noisy laundromat, potentially poor lighting
- **Physical**: May be wearing work gloves, using one hand
- **Time Pressure**: Want to complete rounds efficiently
- **Accuracy Critical**: Mistakes cause problems later

**User Journey Priorities**
1. **QR Code Scanning**: Quick machine identification without confusion
2. **Visual Confirmation**: Clear indicators for quarter vs dollar mode
3. **Voice Input**: Hands-free task creation while working
4. **Error Prevention**: System prevents common mistakes

**Success Metrics**
- Zero confusion about machine identification
- 95% accuracy in first-attempt data entry
- 30% faster collection rounds
- Confidence in data accuracy

---

### Persona 3: Tammy & Ryan - The Operational Support Team

**Demographics**
- Age: 35-50
- Role: Operations Support & Maintenance
- Location: Ohio (occasional field work)
- Device: iPhone/Android (various models)
- Technical Skill: Medium-Low (basic smartphone usage)

**Background & Context**
Tammy and Ryan provide operational support including task management, supplier coordination, and occasional money collection backup. They need access to parts information, equipment troubleshooting, and communication tools.

**Goals & Motivations**
- Quickly access equipment troubleshooting information
- Manage maintenance tasks and schedules
- Contact suppliers for emergency parts orders
- Monitor store conditions and security
- Support field operations team when needed

**Pain Points & Frustrations**
- Difficulty finding equipment manuals and troubleshooting guides
- Managing supplier contact information across multiple sources
- Coordinating maintenance schedules and parts inventory
- No visibility into current store conditions
- Complex systems requiring too much training

**Technology Usage**
- Smartphone: Primary device but prefers simple interfaces
- Voice: Limited use, prefers touch for most interactions
- Reading: Comfortable reading information on phone screen
- Calls: Frequently makes business phone calls
- Apps: Prefers familiar, consistent interfaces

**User Journey Priorities**
1. **Information Access**: Quick access to equipment documentation
2. **Contact Management**: Easy access to supplier and emergency contacts
3. **Task Visibility**: Clear view of what needs to be done
4. **Status Monitoring**: Simple dashboard showing store conditions

**Success Metrics**
- 50% faster access to troubleshooting information
- Reduced time spent searching for supplier contacts
- Better coordination of maintenance activities
- Improved visibility into operational status

---

## Secondary Personas

### Persona 4: Future Field Worker - The New Team Member

**Demographics**
- Age: 25-35
- Role: Potential future employee/contractor
- Technical Skill: Medium-High (smartphone native)

**Relevance**
This persona represents future scalability needs. The system should be intuitive enough for new team members to learn quickly without extensive training.

**Requirements**
- Self-explanatory interface requiring minimal training
- Built-in help and guidance
- Error prevention and recovery
- Consistent interaction patterns

---

## Persona Usage Guidelines

### Design Priorities by Persona
1. **Brian (Admin)**: Security, control, comprehensive data access
2. **Johnny/Garrett (Field)**: Speed, accuracy, error prevention
3. **Tammy/Ryan (Support)**: Information access, communication tools

### Cross-Persona Requirements
- **Mobile-First**: All personas primarily use smartphones
- **High Contrast**: Readable in various lighting conditions
- **Large Touch Targets**: Accommodate gloves and one-handed use
- **Voice Support**: Hands-free operation when possible
- **Offline Capability**: Must work without internet connection

### Accessibility Considerations
- **Vision**: High contrast mode, large text support
- **Motor**: Large touch targets, voice alternatives
- **Cognitive**: Simple navigation, error prevention
- **Connectivity**: Offline capability, slow network tolerance

### Testing Strategy by Persona
- **Brian**: Admin functions, configuration, desktop/mobile switching
- **Johnny/Garrett**: Field scenarios, gloved hands, poor lighting
- **Tammy/Ryan**: Information lookup, multi-tasking scenarios

These personas should guide all design and development decisions, ensuring the BTM Utility system meets the real-world needs of its actual users in their specific work contexts.