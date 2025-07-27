# BTM Utility - API Contract & Endpoints

## **1. API Architecture Overview**

### **1.1 Base Configuration**
```
Base URL: https://brianmickley.com/util/api/v1
Authentication: Bearer tokens for external APIs, OAuth 2.0 for Google services
Content-Type: application/json
Rate Limiting: 100 requests/minute per user
```

### **1.2 Response Format Standards**
```json
{
  "status": "success|error",
  "data": {},
  "message": "Human readable message",
  "timestamp": "2025-07-27T15:30:00Z",
  "version": "1.0"
}
```

### **1.3 Error Response Format**
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": {
      "field": "counter_value",
      "reason": "Must be a positive number"
    }
  },
  "timestamp": "2025-07-27T15:30:00Z"
}
```

---

## **2. Authentication & Configuration**

### **2.1 Configuration Management**
```
POST /config/auth
Description: Store encrypted API credentials
Request Body:
{
  "service": "twilio|gmail|vapi|make",
  "credentials": {
    "api_key": "encrypted_key",
    "api_secret": "encrypted_secret",
    "additional_params": {}
  }
}

Response:
{
  "status": "success",
  "data": {
    "service": "twilio",
    "configured": true,
    "last_updated": "2025-07-27T15:30:00Z"
  }
}
```

### **2.2 Health Check**
```
GET /health
Description: System status and service connectivity
Response:
{
  "status": "success",
  "data": {
    "services": {
      "database": "online",
      "gmail": "online",
      "twilio": "online",
      "google_sheets": "online",
      "make_com": "online"
    },
    "last_sync": "2025-07-27T15:25:00Z",
    "uptime": "5d 12h 30m"
  }
}
```

---

## **3. Money Collection API**

### **3.1 QR Code Recognition**
```
POST /collection/scan-qr
Description: Process QR code and identify machine
Request Body:
{
  "qr_data": "BTM_PEACOCK_CH1_HA",
  "image_data": "base64_encoded_image",
  "timestamp": "2025-07-27T15:30:00Z"
}

Response:
{
  "status": "success",
  "data": {
    "location": "Peacock",
    "machine_type": "changer",
    "machine_number": 1,
    "hopper": "A",
    "counting_mode": "dollars", // or "quarters"
    "last_collection": "2025-07-20T14:00:00Z"
  }
}
```

### **3.2 Counter Value Processing**
```
POST /collection/ocr-reading
Description: Extract counter value from camera image
Request Body:
{
  "image_data": "base64_encoded_image",
  "machine_id": "PEACOCK_CH1_HA",
  "expected_digits": 6
}

Response:
{
  "status": "success",
  "data": {
    "counter_value": 1234,
    "confidence": 0.95,
    "raw_text": "001234",
    "suggestions": [1234, 1235]
  }
}
```

### **3.3 Collection Submission**
```
POST /collection/submit
Description: Submit money collection data
Request Body:
{
  "machine_id": "PEACOCK_CH1_HA",
  "counter_value": 1234,
  "counting_mode": "dollars",
  "collector": "Brian",
  "comments": "Filter replaced during collection",
  "coins_to_office": true,
  "collection_time": "2025-07-27T15:30:00Z",
  "location": {
    "lat": 40.7589,
    "lng": -73.9851
  }
}

Response:
{
  "status": "success",
  "data": {
    "collection_id": "COL_2025_0727_001",
    "amount_collected": 1234.00,
    "previous_reading": 1100,
    "difference": 134.00,
    "sms_sent": true,
    "sheet_updated": true
  }
}
```

### **3.4 Collection History**
```
GET /collection/history
Query Parameters:
- location: string (optional)
- machine_id: string (optional)  
- start_date: ISO date
- end_date: ISO date
- collector: string (optional)

Response:
{
  "status": "success",
  "data": {
    "collections": [
      {
        "collection_id": "COL_2025_0727_001",
        "machine_id": "PEACOCK_CH1_HA",
        "amount": 134.00,
        "collector": "Brian",
        "timestamp": "2025-07-27T15:30:00Z",
        "comments": "Filter replaced"
      }
    ],
    "summary": {
      "total_amount": 2345.67,
      "collection_count": 15,
      "average_per_collection": 156.38
    }
  }
}
```

---

## **4. To-Do List & Task Management**

### **4.1 Voice-to-Text Processing**
```
POST /tasks/voice-to-text
Description: Convert voice recording to text and parse task
Request Body:
{
  "audio_data": "base64_encoded_audio",
  "format": "webm",
  "user": "Brian"
}

Response:
{
  "status": "success",
  "data": {
    "transcription": "Replace filter at Dover changer 2 next Friday",
    "parsed_task": {
      "action": "Replace filter",
      "location": "Dover",
      "machine": "changer 2",
      "due_date": "2025-08-01",
      "priority": "medium"
    },
    "confidence": 0.89
  }
}
```

### **4.2 Task Creation**
```
POST /tasks
Description: Create new task
Request Body:
{
  "title": "Replace filter at Dover changer 2",
  "description": "Monthly filter replacement",
  "assigned_to": "Brian",
  "due_date": "2025-08-01",
  "priority": "medium",
  "location": "Dover",
  "machine_id": "DOVER_CH2",
  "tags": ["maintenance", "filter"],
  "source": "voice" // or "manual"
}

Response:
{
  "status": "success",
  "data": {
    "task_id": "TASK_2025_0727_001",
    "title": "Replace filter at Dover changer 2",
    "created_at": "2025-07-27T15:30:00Z",
    "calendar_event_id": "cal_event_123",
    "sms_sent": true
  }
}
```

### **4.3 Task Management**
```
GET /tasks
Query Parameters:
- status: string (pending|completed|overdue)
- assigned_to: string
- location: string
- priority: string (low|medium|high)
- due_date_from: ISO date
- due_date_to: ISO date

PUT /tasks/{task_id}
Description: Update existing task
Request Body:
{
  "status": "completed",
  "completion_notes": "Filter replaced successfully",
  "completed_by": "Brian",
  "completed_at": "2025-07-27T16:00:00Z"
}

DELETE /tasks/{task_id}
Description: Delete task (soft delete)
```

### **4.4 Google Calendar Integration**
```
POST /tasks/{task_id}/sync-calendar
Description: Sync task with Google Calendar
Response:
{
  "status": "success",
  "data": {
    "calendar_event_id": "cal_event_123",
    "calendar_url": "https://calendar.google.com/...",
    "synced_at": "2025-07-27T15:30:00Z"
  }
}
```

---

## **5. Parts & Inventory Management**

### **5.1 Gmail Purchase Monitoring**
```
POST /parts/monitor-email
Description: Parse purchase email and extract part information
Request Body:
{
  "email_id": "gmail_message_123",
  "subject": "Order Confirmation - Alliance Laundry",
  "body": "email_body_text",
  "from": "orders@alliancelaundry.com"
}

Response:
{
  "status": "success",
  "data": {
    "purchase_id": "PURCH_2025_0727_001",
    "supplier": "Alliance Laundry",
    "items": [
      {
        "part_number": "9379-183-012",
        "description": "Water Valve 120V",
        "quantity": 2,
        "unit_price": 67.50,
        "total_price": 135.00
      }
    ],
    "order_total": 135.00,
    "order_date": "2025-07-27",
    "tracking_number": "1Z999AA1234567890"
  }
}
```

### **5.2 Inventory Management**
```
GET /parts/inventory
Query Parameters:
- category: string (valve|belt|seal|motor)
- low_stock: boolean
- supplier: string

POST /parts/inventory
Description: Add or update inventory item
Request Body:
{
  "part_number": "9379-183-012",
  "description": "Water Valve 120V Viton",
  "category": "valve",
  "current_stock": 5,
  "reorder_level": 2,
  "unit_cost": 67.50,
  "supplier": "Alliance Laundry",
  "compatible_machines": ["DEXTER_EXPRESS", "DEXTER_C_SERIES"]
}

PUT /parts/inventory/{part_id}/adjust-stock
Description: Adjust stock levels (usage, receipt, adjustment)
Request Body:
{
  "adjustment_type": "usage|receipt|adjustment",
  "quantity": -1,
  "reason": "Used for Dover Changer 2 repair",
  "machine_id": "DOVER_CH2",
  "adjusted_by": "Brian"
}
```

### **5.3 Parts Lookup & Compatibility**
```
GET /parts/lookup/{part_number}
Response:
{
  "status": "success",
  "data": {
    "part_number": "9379-183-012",
    "description": "Water Valve 120V Viton",
    "current_stock": 3,
    "reorder_level": 2,
    "suppliers": [
      {
        "name": "Alliance Laundry",
        "price": 67.50,
        "availability": "in_stock",
        "shipping": "same_day"
      }
    ],
    "compatible_machines": ["DEXTER_EXPRESS"],
    "replacement_frequency": "2-3 years",
    "installation_guide": "https://dexter.com/guides/valve-install"
  }
}

GET /parts/compatibility/{machine_model}
Description: Get all compatible parts for a machine model
```

---

## **6. Equipment & Troubleshooting**

### **6.1 Equipment Database**
```
GET /equipment/machines
Response:
{
  "status": "success",
  "data": {
    "machines": [
      {
        "machine_id": "PEACOCK_CH1",
        "location": "Peacock",
        "type": "changer",
        "make": "Dexter",
        "model": "C-Series",
        "serial_number": "DEX123456",
        "install_date": "2020-03-15",
        "last_service": "2025-06-15",
        "hoppers": [
          {
            "hopper_id": "A",
            "counting_mode": "dollars",
            "capacity": 5000
          }
        ]
      }
    ]
  }
}
```

### **6.2 Troubleshooting Guides**
```
GET /equipment/troubleshooting
Query Parameters:
- machine_type: string
- make: string
- model: string
- issue_category: string

Response:
{
  "status": "success",
  "data": {
    "guides": [
      {
        "title": "Water Valve Replacement - Dexter Express",
        "url": "https://dexter.com/support/troubleshooting/",
        "category": "repair",
        "difficulty": "medium",
        "estimated_time": "30 minutes",
        "required_parts": ["9379-183-012"],
        "tools_needed": ["Phillips screwdriver", "Adjustable wrench"]
      }
    ]
  }
}
```

### **6.3 Maintenance Scheduling**
```
POST /equipment/maintenance-schedule
Description: Schedule routine maintenance
Request Body:
{
  "machine_id": "PEACOCK_CH1",
  "maintenance_type": "filter_replacement",
  "frequency": "quarterly",
  "next_due": "2025-10-01",
  "assigned_to": "Brian",
  "notes": "Check air filter size: 16x25x1"
}

GET /equipment/maintenance-due
Description: Get overdue and upcoming maintenance tasks
```

---

## **7. Communications & VOIP**

### **7.1 VOIP Trigger System**
```
POST /communications/trigger-audio
Description: Trigger store audio announcement
Request Body:
{
  "location": "massillon|dover|peacock_inner|peacock_outer",
  "announcement_type": "formal|informal|emergency",
  "message_id": "welcome|non_paying_visitors|control_children",
  "custom_message": "Optional custom text for TTS",
  "triggered_by": "Brian"
}

Response:
{
  "status": "success",
  "data": {
    "trigger_id": "AUDIO_2025_0727_001",
    "location": "massillon",
    "message_played": "Welcome - store is monitored",
    "duration": "15 seconds",
    "triggered_at": "2025-07-27T15:30:00Z"
  }
}
```

### **7.2 Available Audio Messages**
```
GET /communications/messages
Response:
{
  "status": "success",
  "data": {
    "formal_messages": [
      {
        "id": "welcome",
        "text": "Welcome - store is monitored",
        "type": "robo_voice"
      },
      {
        "id": "non_paying_visitors",
        "text": "Non-paying visitors must leave",
        "type": "robo_voice"
      }
    ],
    "informal_messages": [
      {
        "id": "kids_move_along",
        "text": "Kids if not doing laundry, please move along",
        "type": "brian_voice"
      }
    ],
    "emergency_alerts": [
      {
        "id": "stop_audio",
        "text": "STOP audio playing",
        "type": "immediate"
      }
    ]
  }
}
```

---

## **8. Business Directory & Contacts**

### **8.1 Contact Management**
```
GET /contacts
Query Parameters:
- category: string (emergency|supplier|service)
- location: string

POST /contacts
Description: Add new business contact
Request Body:
{
  "name": "Alliance Laundry Systems",
  "category": "supplier",
  "phone": "1-800-555-0123",
  "email": "sales@alliancelaundry.com",
  "address": "123 Business Ave",
  "notes": "Primary parts supplier - same day shipping",
  "emergency_contact": false
}

POST /contacts/{contact_id}/call
Description: Initiate phone call and log activity
Response:
{
  "status": "success",
  "data": {
    "call_id": "CALL_2025_0727_001",
    "contact": "Alliance Laundry",
    "phone_number": "1-800-555-0123",
    "initiated_at": "2025-07-27T15:30:00Z"
  }
}
```

### **8.2 Emergency Contacts**
```
GET /contacts/emergency
Response:
{
  "status": "success",
  "data": {
    "police_departments": [
      {
        "location": "Massillon",
        "department": "Massillon Police Department",
        "phone": "(330) 832-9811",
        "address": "2348 Lincoln Way East",
        "jurisdiction": "Massillon Coin Laundry"
      }
    ],
    "suppliers": [
      {
        "name": "Alliance Laundry - Emergency",
        "phone": "1-800-555-HELP",
        "availability": "24/7"
      }
    ]
  }
}
```

---

## **9. Notifications & SMS**

### **9.1 SMS Notifications**
```
POST /notifications/sms
Description: Send SMS notification
Request Body:
{
  "recipients": ["Brian", "current_user"],
  "message_type": "collection|task|alert|parts",
  "content": {
    "template": "money_collection",
    "variables": {
      "collector": "Brian",
      "location": "Peacock",
      "amount": 134.00,
      "machine": "Changer 1 Hopper A"
    }
  },
  "priority": "normal|high|urgent"
}

Response:
{
  "status": "success",
  "data": {
    "message_id": "SMS_2025_0727_001",
    "recipients_sent": 2,
    "delivery_status": "sent",
    "estimated_delivery": "30 seconds"
  }
}
```

### **9.2 Notification Templates**
```
GET /notifications/templates
Response:
{
  "status": "success",
  "data": {
    "templates": {
      "money_collection": "💰 Collection: {collector} collected ${amount} from {location} {machine}",
      "task_completed": "✅ Task: {task_title} completed by {user}",
      "parts_low_stock": "⚠️ Low Stock: {part_name} down to {quantity} units",
      "maintenance_due": "🔧 Maintenance: {machine} {maintenance_type} due {due_date}"
    }
  }
}
```

---

## **10. Data Synchronization**

### **10.1 Google Sheets Integration**
```
POST /sync/google-sheets
Description: Sync data to Google Sheets
Request Body:
{
  "sheet_type": "collections|inventory|tasks",
  "data": [
    {
      "date": "2025-07-27",
      "location": "Peacock",
      "machine": "Changer 1 Hopper A",
      "amount": 134.00,
      "collector": "Brian"
    }
  ],
  "append": true
}

GET /sync/status
Description: Get synchronization status for all services
Response:
{
  "status": "success",
  "data": {
    "last_sync": {
      "google_sheets": "2025-07-27T15:25:00Z",
      "google_calendar": "2025-07-27T15:20:00Z",
      "gmail": "2025-07-27T15:30:00Z"
    },
    "sync_status": {
      "google_sheets": "success",
      "google_calendar": "success", 
      "gmail": "pending"
    },
    "pending_operations": 3
  }
}
```

### **10.2 Make.com Webhook Integration**
```
POST /webhooks/make-com
Description: Trigger Make.com workflow
Request Body:
{
  "workflow_type": "collection_submitted|task_created|parts_ordered|maintenance_due",
  "data": {
    "event": "money_collection",
    "payload": {
      "collection_id": "COL_2025_0727_001",
      "location": "Peacock",
      "amount": 134.00,
      "collector": "Brian",
      "timestamp": "2025-07-27T15:30:00Z"
    }
  },
  "webhook_url": "https://hook.make.com/your-scenario-webhook"
}

Response:
{
  "status": "success",
  "data": {
    "webhook_id": "WEBHOOK_2025_0727_001",
    "make_scenario_triggered": true,
    "response_time": "250ms"
  }
}
```

### **10.3 Data Export**
```
GET /export/collections
Query Parameters:
- format: json|csv|xlsx
- start_date: ISO date
- end_date: ISO date
- location: string

Response:
{
  "status": "success",
  "data": {
    "export_id": "EXPORT_2025_0727_001",
    "format": "csv",
    "download_url": "https://brianmickley.com/util/exports/collections_2025_0727.csv",
    "expires_at": "2025-07-28T15:30:00Z",
    "record_count": 150
  }
}
```

---

## **11. Analytics & Reporting**

### **11.1 Collection Analytics**
```
GET /analytics/collections
Query Parameters:
- period: daily|weekly|monthly|yearly
- location: string (optional)
- start_date: ISO date
- end_date: ISO date

Response:
{
  "status": "success",
  "data": {
    "summary": {
      "total_collections": 52,
      "total_amount": 12450.75,
      "average_per_collection": 239.44,
      "trend": "increasing"
    },
    "by_location": [
      {
        "location": "Peacock",
        "total_amount": 5200.30,
        "collection_count": 20,
        "average": 260.02
      }
    ],
    "by_machine": [
      {
        "machine_id": "PEACOCK_CH1_HA",
        "total_amount": 2100.15,
        "collection_count": 8,
        "last_collection": "2025-07-27T15:30:00Z"
      }
    ],
    "trend_data": [
      {
        "date": "2025-07-20",
        "amount": 1850.25
      }
    ]
  }
}
```

### **11.2 Parts Usage Analytics**
```
GET /analytics/parts-usage
Query Parameters:
- period: monthly|quarterly|yearly
- category: string (optional)

Response:
{
  "status": "success",
  "data": {
    "top_used_parts": [
      {
        "part_number": "9379-183-012",
        "description": "Water Valve 120V",
        "usage_count": 8,
        "total_cost": 540.00,
        "average_replacement_interval": "3.2 months"
      }
    ],
    "cost_analysis": {
      "total_parts_cost": 2340.50,
      "by_category": {
        "valves": 810.00,
        "belts": 145.60,
        "seals": 234.90
      }
    },
    "maintenance_trends": {
      "preventive_vs_reactive": {
        "preventive": 75,
        "reactive": 25
      }
    }
  }
}
```

---

## **12. File Upload & Processing**

### **12.1 Image Upload**
```
POST /upload/image
Description: Upload images for QR scanning or OCR processing
Request Headers:
Content-Type: multipart/form-data

Request Body:
{
  "image": "binary_image_data",
  "purpose": "qr_scan|ocr_reading|documentation",
  "machine_id": "PEACOCK_CH1_HA" (optional),
  "metadata": {
    "timestamp": "2025-07-27T15:30:00Z",
    "location": "Peacock",
    "user": "Brian"
  }
}

Response:
{
  "status": "success",
  "data": {
    "upload_id": "IMG_2025_0727_001",
    "file_url": "https://brianmickley.com/util/uploads/img_001.jpg",
    "processed": true,
    "results": {
      "qr_data": "BTM_PEACOCK_CH1_HA",
      "ocr_text": "001234",
      "confidence": 0.95
    }
  }
}
```

### **12.2 Audio Upload (Voice Recording)**
```
POST /upload/audio
Description: Upload voice recordings for transcription
Request Headers:
Content-Type: multipart/form-data

Request Body:
{
  "audio": "binary_audio_data",
  "format": "webm|mp3|wav",
  "duration": 5.2,
  "purpose": "task_creation|voice_command",
  "user": "Brian"
}

Response:
{
  "status": "success",
  "data": {
    "upload_id": "AUD_2025_0727_001",
    "transcription": "Replace filter at Dover changer 2 next Friday",
    "confidence": 0.89,
    "processing_time": "1.2s",
    "parsed_intent": {
      "action": "create_task",
      "parameters": {
        "task": "Replace filter",
        "location": "Dover",
        "machine": "changer 2",
        "due_date": "2025-08-01"
      }
    }
  }
}
```

---

## **13. User Management & Preferences**

### **13.1 User Profiles**
```
GET /users/profile
Response:
{
  "status": "success",
  "data": {
    "user_id": "USR_BRIAN_001",
    "name": "Brian",
    "role": "admin",
    "preferences": {
      "default_location": "Massillon",
      "notification_methods": ["sms", "email"],
      "voice_language": "en-US",
      "theme": "light"
    },
    "permissions": {
      "money_collection": true,
      "parts_management": true,
      "configuration": true,
      "user_management": false
    }
  }
}

PUT /users/profile
Description: Update user preferences
Request Body:
{
  "preferences": {
    "default_location": "Dover",
    "notification_methods": ["sms"],
    "voice_language": "en-US",
    "theme": "dark"
  }
}
```

### **13.2 Activity Logging**
```
GET /users/activity
Query Parameters:
- start_date: ISO date
- end_date: ISO date
- activity_type: string (optional)

Response:
{
  "status": "success",
  "data": {
    "activities": [
      {
        "activity_id": "ACT_2025_0727_001",
        "user": "Brian",
        "action": "money_collection",
        "details": "Collected $134 from Peacock Ch1 HopperA",
        "timestamp": "2025-07-27T15:30:00Z",
        "ip_address": "192.168.1.100",
        "user_agent": "Mobile Safari"
      }
    ],
    "summary": {
      "total_activities": 245,
      "collections": 52,
      "tasks_created": 23,
      "parts_ordered": 8
    }
  }
}
```

---

## **14. System Administration**

### **14.1 System Configuration**
```
GET /admin/config
Description: Get system configuration (admin only)
Response:
{
  "status": "success",
  "data": {
    "api_keys": {
      "twilio": "configured",
      "gmail": "configured",
      "vapi": "configured",
      "make_com": "configured"
    },
    "webhooks": [
      {
        "name": "make_com_collection",
        "url": "https://hook.make.com/scenario1",
        "active": true,
        "last_triggered": "2025-07-27T15:30:00Z"
      }
    ],
    "sync_settings": {
      "google_sheets_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      "calendar_id": "primary",
      "auto_sync": true,
      "sync_interval": "5_minutes"
    }
  }
}

PUT /admin/config
Description: Update system configuration
Request Body:
{
  "webhooks": [
    {
      "name": "make_com_collection",
      "url": "https://hook.make.com/new-scenario",
      "active": true,
      "events": ["collection_submitted", "task_created"]
    }
  ],
  "sync_settings": {
    "auto_sync": true,
    "sync_interval": "3_minutes"
  }
}
```

### **14.2 System Logs**
```
GET /admin/logs
Query Parameters:
- level: debug|info|warn|error
- start_date: ISO date
- end_date: ISO date
- component: string (api|sync|webhook|sms)

Response:
{
  "status": "success",
  "data": {
    "logs": [
      {
        "timestamp": "2025-07-27T15:30:00Z",
        "level": "info",
        "component": "api",
        "message": "Money collection submitted successfully",
        "details": {
          "collection_id": "COL_2025_0727_001",
          "user": "Brian",
          "amount": 134.00
        }
      }
    ],
    "summary": {
      "total_logs": 1250,
      "by_level": {
        "error": 5,
        "warn": 23,
        "info": 1200,
        "debug": 22
      }
    }
  }
}
```

---

## **15. Error Codes & Status Responses**

### **15.1 HTTP Status Codes**
```
200 OK - Request successful
201 Created - Resource created successfully
400 Bad Request - Invalid request data
401 Unauthorized - Authentication required
403 Forbidden - Insufficient permissions
404 Not Found - Resource not found
409 Conflict - Duplicate entry or constraint violation
422 Unprocessable Entity - Validation errors
429 Too Many Requests - Rate limit exceeded
500 Internal Server Error - Server error
502 Bad Gateway - External service unavailable
503 Service Unavailable - Temporary service issue
```

### **15.2 Application Error Codes**
```
AUTH_001 - Invalid API key
AUTH_002 - Expired token
AUTH_003 - Insufficient permissions

VALIDATION_001 - Missing required field
VALIDATION_002 - Invalid data format
VALIDATION_003 - Value out of range

BUSINESS_001 - Duplicate collection entry
BUSINESS_002 - Machine not found
BUSINESS_003 - Invalid counting mode

INTEGRATION_001 - Google API quota exceeded
INTEGRATION_002 - Twilio delivery failed
INTEGRATION_003 - Make.com webhook timeout
INTEGRATION_004 - Gmail parsing error

SYSTEM_001 - Database connection failed
SYSTEM_002 - File upload failed
SYSTEM_003 - OCR processing failed
SYSTEM_004 - Voice recognition failed
```

### **15.3 Rate Limiting**
```
Response Headers:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643723400

Rate Limit Exceeded Response:
{
  "status": "error",
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Limit: 100/minute",
    "retry_after": 60
  }
}
```

---

## **16. Webhook Specifications**

### **16.1 Outgoing Webhooks (to Make.com)**
```
Collection Submitted Webhook:
POST {make_com_webhook_url}
{
  "event": "collection_submitted",
  "timestamp": "2025-07-27T15:30:00Z",
  "data": {
    "collection_id": "COL_2025_0727_001",
    "location": "Peacock",
    "machine_id": "PEACOCK_CH1_HA",
    "amount": 134.00,
    "collector": "Brian",
    "counting_mode": "dollars",
    "comments": "Filter replaced"
  }
}

Task Created Webhook:
POST {make_com_webhook_url}
{
  "event": "task_created",
  "timestamp": "2025-07-27T15:30:00Z",
  "data": {
    "task_id": "TASK_2025_0727_001",
    "title": "Replace filter at Dover changer 2",
    "assigned_to": "Brian",
    "due_date": "2025-08-01",
    "priority": "medium",
    "source": "voice"
  }
}
```

### **16.2 Incoming Webhooks (from External Services)**
```
Gmail Push Notification:
POST /webhooks/gmail
{
  "message": {
    "messageId": "1234567890",
    "publishTime": "2025-07-27T15:30:00Z",
    "data": "base64_encoded_data"
  }
}

Google Calendar Event Update:
POST /webhooks/calendar
{
  "event_type": "task_updated",
  "event_id": "cal_event_123",
  "task_id": "TASK_2025_0727_001",
  "changes": {
    "due_date": "2025-08-02",
    "status": "completed"
  }
}
```

---

## **17. API Versioning & Backward Compatibility**

### **17.1 Version Management**
```
Current Version: v1
API Base URL: https://brianmickley.com/util/api/v1

Version Header:
Accept-Version: v1

Response Headers:
API-Version: v1
Supported-Versions: v1

Deprecation Notice:
Deprecation: date="Sun, 01 Jan 2026 00:00:00 GMT"
Sunset: date="Sun, 01 Jul 2026 00:00:00 GMT"
```

### **17.2 Future API Expansion**
```
Planned v2 Features:
- Multi-tenant support for multiple companies
- Advanced analytics and machine learning insights
- Mobile app API endpoints
- Real-time WebSocket connections
- Batch operation support
- Advanced search and filtering
- Custom field support
- Integration marketplace
```

---

## **19. Security Camera Portal**

### **19.1 Camera Feed Access**
```
GET /security/cameras
Query Parameters:
- location: string (massillon|dover|peacock)
- camera_id: string (optional)

Response:
{
  "status": "success",
  "data": {
    "location": "peacock",
    "cameras": [
      {
        "camera_id": "PEACOCK_CAM_01",
        "name": "Main Floor View",
        "stream_url": "https://camera-server.com/stream/peacock_01",
        "status": "online",
        "resolution": "1920x1080",
        "last_motion": "2025-07-27T15:25:00Z"
      },
      {
        "camera_id": "PEACOCK_CAM_02", 
        "name": "Entry View",
        "stream_url": "https://camera-server.com/stream/peacock_02",
        "status": "online",
        "resolution": "1280x720",
        "last_motion": "2025-07-27T15:30:00Z"
      }
    ]
  }
}
```

### **19.2 Camera Recording Access**
```
GET /security/recordings
Query Parameters:
- camera_id: string
- start_time: ISO datetime
- end_time: ISO datetime
- motion_only: boolean

Response:
{
  "status": "success",
  "data": {
    "recordings": [
      {
        "recording_id": "REC_2025_0727_001",
        "camera_id": "PEACOCK_CAM_01",
        "start_time": "2025-07-27T14:00:00Z",
        "duration": "00:05:30",
        "file_url": "https://camera-server.com/recordings/rec_001.mp4",
        "motion_detected": true,
        "file_size": "45MB"
      }
    ],
    "total_recordings": 24,
    "total_size": "1.2GB"
  }
}
```

### **19.3 Motion Detection Alerts**
```
POST /security/motion-alerts
Description: Configure motion detection settings
Request Body:
{
  "camera_id": "PEACOCK_CAM_01",
  "enabled": true,
  "sensitivity": "medium",
  "detection_zones": [
    {
      "name": "entry_area",
      "coordinates": [[100,100], [300,100], [300,300], [100,300]]
    }
  ],
  "notification_methods": ["sms", "email"],
  "active_hours": {
    "start": "18:00",
    "end": "08:00"
  }
}

Response:
{
  "status": "success",
  "data": {
    "alert_id": "ALERT_2025_0727_001",
    "camera_id": "PEACOCK_CAM_01",
    "settings_applied": true
  }
}
```

---

## **20. Climate Control & Temperature Management**

### **20.1 Temperature Monitoring**
```
GET /climate/temperature
Query Parameters:
- location: string (massillon|dover|peacock)
- period: string (current|hourly|daily)

Response:
{
  "status": "success",
  "data": {
    "location": "peacock",
    "current_temperature": 72.5,
    "target_temperature": 74.0,
    "humidity": 45,
    "hvac_status": "heating",
    "last_updated": "2025-07-27T15:30:00Z",
    "sensor_readings": [
      {
        "sensor_id": "PEACOCK_TEMP_01",
        "location": "main_floor",
        "temperature": 72.5,
        "humidity": 45,
        "battery_level": 85
      }
    ]
  }
}
```

### **20.2 Thermostat Control**
```
POST /climate/thermostat
Description: Adjust thermostat settings
Request Body:
{
  "location": "peacock",
  "target_temperature": 76,
  "mode": "cool", // heat|cool|auto|off
  "fan_mode": "auto", // auto|on|circulate
  "hold": false,
  "schedule_override": {
    "enabled": true,
    "duration": "2 hours"
  }
}

Response:
{
  "status": "success",
  "data": {
    "control_id": "CLIMATE_2025_0727_001",
    "location": "peacock",
    "previous_temperature": 74,
    "new_temperature": 76,
    "mode_changed": true,
    "estimated_time_to_temp": "15 minutes"
  }
}
```

### **20.3 Temperature Scheduling**
```
PUT /climate/schedule
Description: Configure temperature schedules
Request Body:
{
  "location": "peacock",
  "schedule": {
    "weekdays": [
      {
        "time": "06:00",
        "temperature": 70,
        "mode": "heat"
      },
      {
        "time": "22:00", 
        "temperature": 65,
        "mode": "heat"
      }
    ],
    "weekends": [
      {
        "time": "08:00",
        "temperature": 72,
        "mode": "heat"
      },
      {
        "time": "23:00",
        "temperature": 68,
        "mode": "heat"
      }
    ]
  },
  "vacation_mode": {
    "enabled": false,
    "temperature": 60
  }
}

Response:
{
  "status": "success",
  "data": {
    "schedule_id": "SCHED_2025_0727_001",
    "location": "peacock",
    "schedule_applied": true,
    "next_adjustment": "2025-07-28T06:00:00Z"
  }
}
```

### **20.4 Climate Alerts & Notifications**
```
POST /climate/alerts
Description: Configure temperature alerts
Request Body:
{
  "location": "peacock",
  "alert_rules": [
    {
      "condition": "temperature_high",
      "threshold": 80,
      "notification_methods": ["sms"],
      "recipients": ["Brian"]
    },
    {
      "condition": "temperature_low",
      "threshold": 60,
      "notification_methods": ["sms", "email"],
      "recipients": ["Brian"]
    },
    {
      "condition": "hvac_failure",
      "notification_methods": ["sms"],
      "recipients": ["Brian"],
      "escalation": {
        "delay": "30 minutes",
        "secondary_recipients": ["service_tech"]
      }
    }
  ]
}

Response:
{
  "status": "success",
  "data": {
    "alert_config_id": "ALERTS_2025_0727_001",
    "rules_configured": 3,
    "monitoring_active": true
  }
}
```

### **20.5 Energy Usage Tracking**
```
GET /climate/energy-usage
Query Parameters:
- location: string
- period: daily|weekly|monthly
- start_date: ISO date
- end_date: ISO date

Response:
{
  "status": "success",
  "data": {
    "location": "peacock",
    "period": "weekly",
    "energy_usage": {
      "total_kwh": 245.6,
      "heating_kwh": 198.3,
      "cooling_kwh": 47.3,
      "estimated_cost": 32.45,
      "efficiency_rating": "good"
    },
    "daily_breakdown": [
      {
        "date": "2025-07-21",
        "kwh": 35.2,
        "cost": 4.65,
        "avg_temp": 68
      }
    ],
    "recommendations": [
      "Consider lowering nighttime temperature by 2°F to save $8/month",
      "HVAC filter replacement due in 2 weeks"
    ]
  }
}
```

### **18.1 API Key Management**
```
API Key Format: btm_live_1234567890abcdef
Environment Prefixes:
- btm_test_ (development/testing)
- btm_live_ (production)

Header Authentication:
Authorization: Bearer btm_live_1234567890abcdef

API Key Rotation:
POST /admin/api-keys/rotate
{
  "current_key": "btm_live_old_key",
  "reason": "scheduled_rotation"
}
```

### **18.2 OAuth 2.0 (Google Services)**
```
Authorization Flow:
1. GET /auth/google/authorize
2. User grants permissions
3. POST /auth/google/callback with authorization code
4. Store refresh token securely
5. Use access token for API calls

Token Refresh:
POST /auth/google/refresh
{
  "refresh_token": "encrypted_refresh_token"
}
```

This completes the comprehensive API contract document covering all endpoints, authentication, data formats, and integration specifications needed to implement the BTM Utility application.