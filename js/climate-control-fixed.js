/**
 * Climate Control Monitoring System
 * Handles temperature, humidity tracking, and HVAC controls
 * Version: 1.0.4 - Fixed syntax error
 */

import { config } from './config.js?v=1.0.3';
import { logger } from './logger.js';
import { errorHandler } from './error-handler.js';
import { storageUtils } from './storage.js';
import { generateId, formatDate, debounce, throttle } from './utils.js';

export class ClimateControl {
    constructor() {
        this.sensors = [];
        this.readings = [];
        this.alerts = [];
        this.settings = {
            temperature: {
                min: 65,
                max: 75,
                target: 70,
                unit: 'fahrenheit'
            },
            humidity: {
                min: 30,
                max: 60,
                target: 45,
                unit: 'percent'
            },
            hvac: {
                mode: 'auto', // auto, heat, cool, off
                fan: 'auto', // auto, on, off
                schedule: {
                    enabled: true,
                    periods: [
                        { start: '06:00', end: '22:00', temp: 70, mode: 'auto' },
                        { start: '22:00', end: '06:00', temp: 68, mode: 'heat' }
                    ]
                }
            }
        };
        
        this.sensorConfigs = [
            {
                id: 'sensor-1',
                name: 'Main Floor',
                location: 'Center of laundromat',
                type: 'temperature-humidity',
                status: 'online',
                position: { x: 0, y: 0 }
            },
            {
                id: 'sensor-2',
                name: 'Entrance Area',
                location: 'Near front door',
                type: 'temperature-humidity',
                status: 'online',
                position: { x: 1, y: 0 }
            },
            {
                id: 'sensor-3',
                name: 'Equipment Room',
                location: 'Behind washers',
                type: 'temperature-humidity',
                status: 'online',
                position: { x: 0, y: 1 }
            },
            {
                id: 'sensor-4',
                name: 'Storage Area',
                location: 'Back storage room',
                type: 'temperature-humidity',
                status: 'offline',
                position: { x: 1, y: 1 }
            }
        ];
        
        this.hvacUnits = [
            {
                id: 'hvac-1',
                name: 'Main HVAC Unit',
                type: 'heat-pump',
                status: 'online',
                mode: 'auto',
                fan: 'auto',
                efficiency: 85
            },
            {
                id: 'hvac-2',
                name: 'Dehumidifier',
                type: 'dehumidifier',
                status: 'online',
                mode: 'auto',
                fan: 'auto',
                efficiency: 90
            }
        ];
        
        this.init();
    }

    async init() {
        try {
            logger.info('Initializing Climate Control module');
            
            // Load existing data
            await this.loadData();
            
            // Initialize UI
            this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start monitoring
            this.startMonitoring();
            
            logger.info('Climate Control module initialized successfully');
            
        } catch (error) {
            logger.error('Failed to initialize Climate Control module', null, error);
            errorHandler.handleError(error);
        }
    }

    async loadData() {
        try {
            let savedReadings = [];
            let savedAlerts = [];
            let savedSettings = null;
            
            try {
                if (storageUtils.readingsManager && storageUtils.readingsManager.load) {
                    savedReadings = await storageUtils.readingsManager.load();
                } else {
                    console.warn('storageUtils.readingsManager not available');
                    logger.warn('storageUtils.readingsManager not available');
                }
            } catch (error) {
                console.error('Failed to load readings:', error);
                logger.error('Failed to load readings', null, error);
            }
            
            try {
                if (storageUtils.alertsManager && storageUtils.alertsManager.load) {
                    savedAlerts = await storageUtils.alertsManager.load();
                } else {
                    console.warn('storageUtils.alertsManager not available');
                    logger.warn('storageUtils.alertsManager not available');
                }
            } catch (error) {
                console.error('Failed to load alerts:', error);
                logger.error('Failed to load alerts', null, error);
            }
            
            try {
                if (storageUtils.settingsManager && storageUtils.settingsManager.load) {
                    savedSettings = await storageUtils.settingsManager.load();
                } else {
                    console.warn('storageUtils.settingsManager not available');
                    logger.warn('storageUtils.settingsManager not available');
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
                logger.error('Failed to load settings', null, error);
            }
            
            this.readings = savedReadings || [];
            this.alerts = savedAlerts || [];
            if (savedSettings) {
                this.settings = { ...this.settings, ...savedSettings };
            }
            
            logger.info(`Loaded ${this.readings.length} readings and ${this.alerts.length} alerts`);
            
        } catch (error) {
            logger.error('Failed to load climate data', null, error);
            this.readings = [];
            this.alerts = [];
        }
    }

    initializeUI() {
        // Update displays
        this.updateSensorsDisplay();
        this.updateHVACDisplay();
        this.updateOverview();
        this.updateReadings();
        this.updateAlertsList();
    }

    setupEventListeners() {
        // Temperature control buttons
        const tempButtons = document.querySelectorAll('.temp-button');
        tempButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const card = e.currentTarget.closest('.climate-card');
                const location = card.querySelector('h3').textContent;
                
                if (action === 'increase') {
                    this.settings.temperature.target = Math.min(80, this.settings.temperature.target + 1);
                } else if (action === 'decrease') {
                    this.settings.temperature.target = Math.max(60, this.settings.temperature.target - 1);
                }
                
                this.updateSensorsDisplay();
                this.saveSettings();
                this.showNotification(`Temperature target updated for ${location}`, 'success');
            });
        });
        
        // Refresh button
        const refreshBtn = document.getElementById('refresh-climate');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshClimateData());
        }
    }

    startMonitoring() {
        // Update readings every 30 seconds
        setInterval(() => {
            try {
                this.updateReadings();
            } catch (error) {
                console.error('Failed to update readings:', error);
                logger.error('Failed to update readings', null, error);
            }
        }, 30000);
        
        // Check for maintenance alerts every 5 minutes
        setInterval(() => {
            try {
                this.hvacUnits.forEach(unit => {
                    if (unit.status === 'online' && Math.random() < 0.1) {
                        this.maintenanceAlert(unit.id);
                    }
                });
            } catch (error) {
                console.error('Failed to check maintenance alerts:', error);
                logger.error('Failed to check maintenance alerts', null, error);
            }
        }, 300000);
    }

    updateSensorsDisplay() {
        this.sensorConfigs.forEach(sensor => {
            const tempElement = document.getElementById(`temp-${sensor.id}`);
            const humidityElement = document.getElementById(`humidity-${sensor.id}`);
            
            if (tempElement) {
                if (sensor.status === 'online') {
                    const tempReading = this.generateTemperatureReading();
                    tempElement.textContent = `${tempReading}°F`;
                    tempElement.className = `reading-value ${this.getTemperatureClass(tempReading)}`;
                } else {
                    tempElement.textContent = '--';
                    tempElement.className = 'reading-value offline';
                }
            }
            
            if (humidityElement) {
                if (sensor.status === 'online') {
                    const humidityReading = this.generateHumidityReading();
                    humidityElement.textContent = `${humidityReading}%`;
                    humidityElement.className = `reading-value ${this.getHumidityClass(humidityReading)}`;
                } else {
                    humidityElement.textContent = '--';
                    humidityElement.className = 'reading-value offline';
                }
            }
        });
    }

    updateHVACDisplay() {
        // Update HVAC status displays
        this.hvacUnits.forEach(unit => {
            const statusElement = document.getElementById(`hvac-${unit.id}-status`);
            const modeElement = document.getElementById(`hvac-${unit.id}-mode`);
            const efficiencyElement = document.getElementById(`hvac-${unit.id}-efficiency`);
            
            if (statusElement) statusElement.textContent = unit.status;
            if (modeElement) modeElement.textContent = unit.mode;
            if (efficiencyElement) efficiencyElement.textContent = `${unit.efficiency}%`;
        });
        
        // Update overall HVAC status
        const hvacModeElement = document.getElementById('hvac-mode');
        const fanStatusElement = document.getElementById('fan-status');
        const efficiencyElement = document.getElementById('efficiency');
        
        if (hvacModeElement) hvacModeElement.textContent = this.settings.hvac.mode;
        if (fanStatusElement) fanStatusElement.textContent = this.settings.hvac.fan;
        if (efficiencyElement) efficiencyElement.textContent = '85%';
    }

    updateOverview() {
        const latestReadings = this.getLatestReadings();
        
        if (latestReadings.temperature !== null) {
            const tempElement = document.getElementById('overview-temp');
            if (tempElement) {
                tempElement.textContent = `${latestReadings.temperature}°F`;
                tempElement.className = `reading-value ${this.getTemperatureClass(latestReadings.temperature)}`;
            }
        }
        
        if (latestReadings.humidity !== null) {
            const humidityElement = document.getElementById('overview-humidity');
            if (humidityElement) {
                humidityElement.textContent = `${latestReadings.humidity}%`;
                humidityElement.className = `reading-value ${this.getHumidityClass(latestReadings.humidity)}`;
            }
        }
    }

    updateReadings() {
        // Simulate sensor readings
        this.sensorConfigs.forEach(sensor => {
            if (sensor.status === 'online') {
                const reading = {
                    id: generateId('reading'),
                    sensorId: sensor.id,
                    temperature: this.generateTemperatureReading(),
                    humidity: this.generateHumidityReading(),
                    timestamp: new Date().toISOString()
                };
                
                this.readings.push(reading);
                
                // Update sensor display
                const tempElement = document.getElementById(`temp-${sensor.id}`);
                const humidityElement = document.getElementById(`humidity-${sensor.id}`);
                
                if (tempElement) tempElement.textContent = `${reading.temperature}°F`;
                if (humidityElement) humidityElement.textContent = `${reading.humidity}%`;
                
                // Check for alerts
                this.checkAlerts(reading);
            }
        });
        
        // Save readings (keep only last 1000)
        if (this.readings.length > 1000) {
            this.readings = this.readings.slice(-1000);
        }
        
        // Save readings with null check
        try {
            if (storageUtils.readingsManager && storageUtils.readingsManager.save) {
                storageUtils.readingsManager.save(this.readings);
            } else {
                console.warn('storageUtils.readingsManager not available, skipping save');
                logger.warn('storageUtils.readingsManager not available, skipping save');
            }
        } catch (error) {
            console.error('Failed to save readings:', error);
            logger.error('Failed to save readings', null, error);
        }
        
        // Update overview
        this.updateOverview();
    }

    generateTemperatureReading() {
        // Generate realistic temperature reading around target
        const target = this.settings.temperature.target;
        const variation = (Math.random() - 0.5) * 4; // ±2 degrees
        return Math.round((target + variation) * 10) / 10;
    }

    generateHumidityReading() {
        // Generate realistic humidity reading around target
        const target = this.settings.humidity.target;
        const variation = (Math.random() - 0.5) * 10; // ±5 percent
        return Math.round(Math.max(20, Math.min(80, target + variation)));
    }

    checkAlerts(reading) {
        const alerts = [];
        
        // Temperature alerts
        if (reading.temperature < this.settings.temperature.min) {
            alerts.push({
                type: 'temperature',
                severity: 'warning',
                message: `Temperature too low: ${reading.temperature}°F`
            });
        } else if (reading.temperature > this.settings.temperature.max) {
            alerts.push({
                type: 'temperature',
                severity: 'warning',
                message: `Temperature too high: ${reading.temperature}°F`
            });
        }
        
        // Humidity alerts
        if (reading.humidity < this.settings.humidity.min) {
            alerts.push({
                type: 'humidity',
                severity: 'info',
                message: `Humidity too low: ${reading.humidity}%`
            });
        } else if (reading.humidity > this.settings.humidity.max) {
            alerts.push({
                type: 'humidity',
                severity: 'warning',
                message: `Humidity too high: ${reading.humidity}%`
            });
        }
        
        // Create alert objects
        alerts.forEach(alert => {
            const alertObj = {
                id: generateId('alert'),
                ...alert,
                sensorId: reading.sensorId,
                timestamp: new Date().toISOString(),
                status: 'active'
            };
            
            this.alerts.push(alertObj);
        });
        
        // Save alerts with null check
        if (alerts.length > 0) {
            try {
                if (storageUtils.alertsManager && storageUtils.alertsManager.save) {
                    storageUtils.alertsManager.save(this.alerts);
                } else {
                    console.warn('storageUtils.alertsManager not available, skipping save');
                    logger.warn('storageUtils.alertsManager not available, skipping save');
                }
            } catch (error) {
                console.error('Failed to save alerts:', error);
                logger.error('Failed to save alerts', null, error);
            }
            this.updateAlertsList();
        }
    }

    updateAlertsList() {
        const list = document.getElementById('alerts-list');
        if (!list) return;

        const recentAlerts = this.alerts
            .filter(alert => alert.status === 'active')
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

        if (recentAlerts.length === 0) {
            list.innerHTML = '<div class="no-alerts">No active alerts</div>';
        } else {
            list.innerHTML = recentAlerts.map(alert => `
                <div class="alert-item ${alert.severity}">
                    <div class="alert-icon">
                        ${this.getAlertIcon(alert.type)}
                    </div>
                    <div class="alert-content">
                        <div class="alert-message">${alert.message}</div>
                        <div class="alert-time">${formatDate(alert.timestamp)}</div>
                    </div>
                    <div class="alert-actions">
                        <button type="button" class="btn btn-sm btn-secondary" 
                                onclick="window.climateControl.dismissAlert('${alert.id}')">
                            ✓
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    getAlertIcon(type) {
        const icons = {
            temperature: '🌡️',
            humidity: '💧',
            maintenance: '🔧',
            system: '⚙️'
        };
        return icons[type] || '⚠️';
    }

    updateCharts() {
        // Chart update logic would go here
        console.log('Updating climate charts...');
    }

    setHVACMode(mode) {
        try {
            this.settings.hvac.mode = mode;
            
            // Update all HVAC units
            this.hvacUnits.forEach(unit => {
                if (unit.status === 'online') {
                    unit.mode = mode;
                }
            });
            
            // Update display
            this.updateHVACDisplay();
            
            // Save settings with null check
            try {
                if (storageUtils.settingsManager && storageUtils.settingsManager.save) {
                    storageUtils.settingsManager.save(this.settings);
                } else {
                    console.warn('storageUtils.settingsManager not available, skipping save');
                    logger.warn('storageUtils.settingsManager not available, skipping save');
                }
            } catch (error) {
                console.error('Failed to save settings:', error);
                logger.error('Failed to save settings', null, error);
            }
            
            this.showNotification(`HVAC mode changed to ${mode}`, 'success');
            logger.info(`HVAC mode changed to ${mode}`);
            
        } catch (error) {
            logger.error('Failed to set HVAC mode', null, error);
            this.showNotification('Failed to change HVAC mode', 'error');
        }
    }

    showSettingsModal() {
        const modal = document.getElementById('climate-settings-modal');
        if (modal) modal.classList.add('show');
    }

    hideSettingsModal() {
        const modal = document.getElementById('climate-settings-modal');
        if (modal) modal.classList.remove('show');
    }

    async saveSettings() {
        try {
            // Validate settings
            if (this.settings.temperature.target < this.settings.temperature.min ||
                this.settings.temperature.target > this.settings.temperature.max) {
                throw new Error('Temperature target out of range');
            }
            
            // Save to storage with null check
            try {
                if (storageUtils.settingsManager && storageUtils.settingsManager.save) {
                    await storageUtils.settingsManager.save(this.settings);
                } else {
                    console.warn('storageUtils.settingsManager not available, skipping save');
                    logger.warn('storageUtils.settingsManager not available, skipping save');
                }
            } catch (error) {
                console.error('Failed to save settings:', error);
                logger.error('Failed to save settings', null, error);
            }
            
            // Update displays
            this.updateSensorsDisplay();
            this.updateHVACDisplay();
            
            this.showNotification('Settings saved successfully', 'success');
            logger.info('Climate settings saved successfully');
            
        } catch (error) {
            logger.error('Failed to save settings', null, error);
            this.showNotification('Failed to save settings', 'error');
        }
    }

    getLatestReadings() {
        if (this.readings.length === 0) {
            return { temperature: null, humidity: null };
        }
        
        const latest = this.readings[this.readings.length - 1];
        return {
            temperature: latest.temperature,
            humidity: latest.humidity
        };
    }

    getTemperatureClass(temperature) {
        if (temperature < this.settings.temperature.min) return 'cold';
        if (temperature > this.settings.temperature.max) return 'hot';
        return 'normal';
    }

    getHumidityClass(humidity) {
        if (humidity < this.settings.humidity.min) return 'dry';
        if (humidity > this.settings.humidity.max) return 'humid';
        return 'normal';
    }

    calibrateSensor(sensorId) {
        const sensor = this.sensorConfigs.find(s => s.id === sensorId);
        if (sensor) {
            sensor.status = 'online';
            this.updateSensorsDisplay();
            this.showNotification(`Sensor ${sensor.name} calibrated`, 'success');
        }
    }

    maintenanceAlert(unitId) {
        const unit = this.hvacUnits.find(u => u.id === unitId);
        if (unit) {
            const alert = {
                id: generateId('alert'),
                type: 'maintenance',
                severity: 'warning',
                message: `Maintenance required for ${unit.name}`,
                unitId: unitId,
                timestamp: new Date().toISOString(),
                status: 'active'
            };
            
            this.alerts.push(alert);
            try {
                if (storageUtils.alertsManager && storageUtils.alertsManager.save) {
                    storageUtils.alertsManager.save(this.alerts);
                } else {
                    console.warn('storageUtils.alertsManager not available, skipping save');
                    logger.warn('storageUtils.alertsManager not available, skipping save');
                }
            } catch (error) {
                console.error('Failed to save alerts:', error);
                logger.error('Failed to save alerts', null, error);
            }
            this.updateAlertsList();
        }
    }

    dismissAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'dismissed';
            try {
                if (storageUtils.alertsManager && storageUtils.alertsManager.save) {
                    storageUtils.alertsManager.save(this.alerts);
                } else {
                    console.warn('storageUtils.alertsManager not available, skipping save');
                    logger.warn('storageUtils.alertsManager not available, skipping save');
                }
            } catch (error) {
                console.error('Failed to save alerts:', error);
                logger.error('Failed to save alerts', null, error);
            }
            this.updateAlertsList();
        }
    }

    refreshClimateData() {
        try {
            console.log('Refreshing climate data...');
            this.updateSensorsDisplay();
            this.updateHVACDisplay();
            this.updateOverview();
            this.updateReadings();
            this.updateAlertsList();
            
            this.sensorConfigs.forEach(sensor => {
                if (sensor.status === 'online') {
                    const tempReading = this.generateTemperatureReading();
                    const humidityReading = this.generateHumidityReading();
                    const tempElement = document.getElementById(`temp-${sensor.id}`);
                    const humidityElement = document.getElementById(`humidity-${sensor.id}`);
                    
                    if (tempElement) {
                        tempElement.textContent = `${tempReading}°F`;
                        tempElement.className = `reading-value ${this.getTemperatureClass(tempReading)}`;
                    }
                    
                    if (humidityElement) {
                        humidityElement.textContent = `${humidityReading}%`;
                        humidityElement.className = `reading-value ${this.getHumidityClass(humidityReading)}`;
                    }
                }
            });
            
            this.showNotification('Climate data refreshed successfully', 'success');
            logger.info('Climate data refreshed successfully');
            
        } catch (error) {
            console.error('Failed to refresh climate data:', error);
            logger.error('Failed to refresh climate data', null, error);
            this.showNotification('Failed to refresh climate data', 'error');
        }
    }

    showNotification(message, type = 'info') {
        try {
            if (window.app && window.app.notificationSystem) {
                window.app.notificationSystem.showNotification(message, type);
            } else {
                console.log(`[${type.toUpperCase()}] ${message}`);
            }
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    // Public API methods
    getSettings() {
        return { ...this.settings };
    }

    getReadings() {
        return [...this.readings];
    }

    getAlerts() {
        return [...this.alerts];
    }

    getSensors() {
        return [...this.sensorConfigs];
    }

    getHVACUnits() {
        return [...this.hvacUnits];
    }

    async exportData(format = 'json') {
        try {
            const data = {
                settings: this.settings,
                readings: this.readings,
                alerts: this.alerts,
                sensors: this.sensorConfigs,
                hvacUnits: this.hvacUnits,
                exportDate: new Date().toISOString()
            };
            
            if (format === 'csv') {
                return this.convertToCSV(data);
            }
            
            return JSON.stringify(data, null, 2);
            
        } catch (error) {
            logger.error('Failed to export climate data', null, error);
            throw error;
        }
    }

    convertToCSV(data) {
        // Simple CSV conversion for readings
        const headers = ['timestamp', 'sensorId', 'temperature', 'humidity'];
        const csvRows = [headers.join(',')];
        
        data.readings.forEach(reading => {
            csvRows.push([
                reading.timestamp,
                reading.sensorId,
                reading.temperature,
                reading.humidity
            ].join(','));
        });
        
        return csvRows.join('\n');
    }
} 