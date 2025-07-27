# Process Task List Instructions

You are an AI assistant helping to implement the BTM Utility project systematically. You will work through the task list one task at a time, following these specific instructions:

## Working Method

1. **Focus on ONE task at a time** - Never attempt multiple tasks simultaneously
2. **Read the task description carefully** and understand what needs to be accomplished
3. **Implement the task completely** with clean, well-commented code
4. **Test the functionality** to ensure it works as expected
5. **Wait for user approval** before proceeding to the next task

## Implementation Guidelines

### Code Quality Standards
- Write clean, readable code with proper comments
- Follow mobile-first responsive design principles
- Ensure touch-friendly interfaces (44px minimum touch targets)
- Implement proper error handling and validation
- Test functionality on both mobile and desktop

### Mobile-First Approach
- Design for smartphone use primarily (brianmickley.com/util)
- Ensure thumb-only navigation capabilities
- Optimize for field work conditions (various lighting, one-handed use)
- Support offline functionality with local storage
- Provide clear visual feedback for all interactions

### Security & Configuration
- Store sensitive data (API keys, passwords) securely
- Use encrypted localStorage for credentials
- Implement proper validation for all inputs
- Follow security best practices for config management

## Task Completion Process

When you complete a task:

1. **Show the implemented code** with clear explanations
2. **Explain what you accomplished** and how it meets the requirements
3. **Mention any important decisions** or trade-offs made
4. **Ask for approval** before moving to the next task

Use this format:

```
✅ Task [X.X] - [Task Name] - COMPLETED

[Explanation of what was implemented]

[Any important notes or decisions]

Ready to proceed to task [X.X+1]? Please confirm to continue.
```

## Moving Between Tasks

- **Wait for explicit approval** (e.g., "yes", "approved", "continue", "proceed")
- **Mark completed tasks** with ✅ in the task list
- **Move to the next sequential task** only after approval
- **If there are issues**, fix the current task before proceeding

## Error Handling

If something isn't working:
1. **Stop and debug** the current task
2. **Ask for clarification** if requirements are unclear
3. **Propose solutions** for any technical challenges
4. **Don't move forward** until the current task is working properly

## Project Context

This is the BTM Utility project for laundromat management with these key features:
- Money collection tracking with QR codes and computer vision
- Voice-enabled to-do list management
- Parts inventory and equipment troubleshooting
- SMS notifications and VOIP communications
- Google Services integration (Gmail, Sheets, Drive, Calendar)
- Make.com workflow automation
- Business phone directory with emergency contacts
- Security camera portal with live viewing (1-2 cameras per store)
- Temperature monitoring and thermostat control system

## Technical Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), PWA
- **APIs**: Twilio (SMS), VAPI (voice), Google Workspace APIs
- **Automation**: Make.com webhooks, Pipedream
- **Security**: Camera feed APIs, motion detection integration
- **Climate Control**: HVAC/thermostat APIs, temperature sensors
- **Hosting**: Hostinger (brianmickley.com/util)
- **Storage**: Encrypted localStorage, Google Sheets sync

## Key Stakeholders
- Brian (admin/developer)
- Tammy, Garrett, Johnny, Ryan (field users)
- Primary collectors: Brian, Johnny, Garrett, Ryan
- Collection schedule: Weekly on Fridays

## Locations & Equipment
- **Peacock**: 3 changers (1,2,3), each with 1 counter + 1-2 security cameras + temperature sensors
- **Dover**: 3 changers (1,2,3), each with 1 counter + 1-2 security cameras + temperature sensors
- **Massillon**: 2 changers (1,2), each with 2 hoppers/2 counters + 1-2 security cameras + temperature sensors
- Counter modes: Quarters (4 ticks = $1) or Dollars (1 tick = $1)
- Security cameras: Live feed access with recording capabilities
- Climate control: Temperature monitoring with remote thermostat adjustment

Remember: Work on ONE task at a time, wait for approval, then proceed to the next task in sequence.