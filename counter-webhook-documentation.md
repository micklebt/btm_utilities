# Counter Webhook Implementation

This document provides an overview of the counter webhook implementation for BTM Utility, which allows counter readings to be stored server-side and submitted to Make.com for integration with Google Sheets.

## Architecture

The counter webhook implementation consists of the following components:

1. **Server-side Storage**: Counter readings are stored in a JSON file on the server.
2. **API Endpoints**: The server provides RESTful API endpoints for retrieving and storing counter readings.
3. **Client-side Integration**: The web application includes a user interface for submitting counter readings and viewing previous readings.
4. **Make.com Integration**: Counter readings are forwarded to Make.com, which can then update Google Sheets.

## Server-side Components

### Data Storage

Counter readings are stored in `data/counter-readings.json` as a key-value object, where the key is a combination of the location ID and machine ID (`${locationId}_${machineId}`), and the value contains the counter reading data.

### API Endpoints

The server provides the following API endpoints:

- **GET /api/previous-reading**: Retrieves the previous reading for a specific location and machine.
  - Query parameters: `locationId`, `machineId`
  - Response: `{ status: 'success', data: { ... } }`

- **GET /api/all-readings**: Retrieves all counter readings.
  - Response: `{ status: 'success', data: [ ... ] }`

- **POST /api/counter-readings**: Submits a new counter reading.
  - Request body: `{ locationId, machineId, counterValue, countingMode, collectorName, comments, webhookUrl, sheetId }`
  - Response: `{ status: 'success', data: { ... }, make: { ... } }`

- **POST /api/webhook-proxy**: Proxies requests to Make.com to bypass CORS restrictions.
  - Request body: `{ webhookUrl, payload }`
  - Response: `{ status: 'success', httpStatus: 200, timestamp: '...' }`

## Client-side Components

### Counter Webhook Handler

The `CounterWebhookHandler` class (`js/counter-webhook-handler.js`) manages the client-side interaction with the server API and provides methods for submitting counter readings and retrieving previous readings.

Key methods:
- `init()`: Initializes the handler and loads previous readings from the server.
- `submitCounterReading(data)`: Submits a counter reading to the server.
- `getAllReadings()`: Retrieves all counter readings from the server.
- `getPreviousReading(locationId, machineId)`: Retrieves the previous reading for a specific location and machine.

### User Interface

The counter readings UI is integrated into the Money Collection section of the main application as a separate tab. It includes:

1. **Form**: Fields for location, machine, counter value, collector, and comments.
2. **Previous Readings**: A table showing recent counter readings.
3. **View All Readings**: A button to view all counter readings.

## Make.com Integration

Counter readings are forwarded to Make.com via the `/api/webhook-proxy` endpoint, which handles the CORS restrictions that would otherwise prevent direct API calls from the browser.

The Make.com scenario can then process the data and update Google Sheets accordingly.

## Counting Modes

The system supports two counting modes:

1. **Quarters Mode**: 4 counter increments = $1 (conversion factor: 0.25)
2. **Dollars Mode**: 1 counter increment = $1 (conversion factor: 1.0)

The counting mode is determined by the machine configuration in `js/location-config.js`.

## Data Flow

1. User submits a counter reading via the UI.
2. The client-side code sends the reading to the server via the `/api/counter-readings` endpoint.
3. The server stores the reading in `data/counter-readings.json`.
4. The server calculates the difference between the current and previous readings.
5. The server forwards the reading to Make.com via the webhook URL.
6. Make.com processes the data and updates Google Sheets.
7. The server returns the result to the client.
8. The client updates the UI to show the new reading and any previous readings.

## Testing

To test the counter webhook implementation:

1. Start the server: `node server.js`
2. Open the application in a browser: `http://localhost:3000`
3. Navigate to the Money Collection section and select the Counter Readings tab.
4. Fill out the form and submit a counter reading.
5. Verify that the reading appears in the Previous Readings table.
6. Click "View All Readings" to see all readings.
7. Check the server logs to verify that the reading was forwarded to Make.com.
8. Check Google Sheets to verify that the reading was added.

## Troubleshooting

Common issues and solutions:

- **"Failed to fetch" error**: This usually indicates a CORS issue. Make sure the server is running and the webhook proxy endpoint is working correctly.
- **"Unexpected end of JSON input" error**: This can occur if Make.com returns an empty response. The server has been configured to handle this case by returning a simplified JSON object.
- **Missing previous readings**: Check that the `data/counter-readings.json` file exists and has the correct permissions.
- **Incorrect counting mode**: Verify that the machine configuration in `js/location-config.js` has the correct `countingMode` property for each machine.