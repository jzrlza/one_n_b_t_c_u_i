const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');
const util = require('util');
const pipeline = util.promisify(require('stream').pipeline);

class SimpleRotatingLogger {
    /**
     * Create a new rotating logger
     * @param {string} logDir - Directory to store log files
     * @param {string} filename - Base filename for logs
     * @param {Object} options - Configuration options
     * @param {number} options.maxSize - Max file size in bytes (default: 10MB)
     * @param {number} options.maxFiles - Number of rotated files to keep (default: 5)
     * @param {boolean} options.compress - Whether to compress old logs (default: true)
     * @param {string} options.level - Log level (debug, info, warn, error) (default: 'info')
     * @param {string} options.datePattern - Date pattern for rotation (default: 'YYYY-MM-DD')
     * @param {boolean} options.consoleOutput - Also output to console (default: false)
     */
    constructor(logDir, filename, options = {}) {
        this.logDir = logDir;
        this.filename = filename;
        this.logPath = path.join(logDir, filename);
        this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
        this.maxFiles = options.maxFiles || 5;
        this.compress = options.compress !== false; // Default true
        this.level = options.level || 'info';
        this.datePattern = options.datePattern || 'YYYY-MM-DD';
        this.consoleOutput = options.consoleOutput || false;
        
        // Log level priorities
        this.levelPriority = {
            'debug': 0,
            'info': 1,
            'warn': 2,
            'error': 3
        };
        
        this.currentSize = 0;
        this.writeQueue = [];
        this.isWriting = false;
        this.init();
    }

    /**
     * Initialize logger
     */
    async init() {
        try {
            // Ensure log directory exists
            await fs.mkdir(this.logDir, { recursive: true });
            
            // Check current log file size
            try {
                const stats = await fs.stat(this.logPath);
                this.currentSize = stats.size;
            } catch (err) {
                // File doesn't exist yet
                this.currentSize = 0;
            }
            
            // Start processing queue
            this.processQueue();
        } catch (err) {
            console.error('Logger init error:', err);
        }
    }

    /**
     * Format date for filename
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return this.datePattern
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }

    /**
     * Get current timestamp
     */
    getTimestamp() {
        const now = new Date();
        return now.toISOString();
    }

    /**
     * Rotate log files
     */
    async rotate() {
        try {
            const dateStr = this.formatDate(new Date());
            
            // Delete the oldest file if we're at maxFiles
            if (this.maxFiles > 0) {
                const oldestFile = path.join(this.logDir, `${this.filename}.${dateStr}.${this.maxFiles}${this.compress ? '.gz' : ''}`);
                await fs.unlink(oldestFile).catch(() => {});
            }

            // Shift existing rotated files
            for (let i = this.maxFiles - 1; i >= 1; i--) {
                const oldFile = path.join(this.logDir, `${this.filename}.${dateStr}.${i}${this.compress ? '.gz' : ''}`);
                const newFile = path.join(this.logDir, `${this.filename}.${dateStr}.${i + 1}${this.compress ? '.gz' : ''}`);
                await fs.rename(oldFile, newFile).catch(() => {});
            }

            // If compression is enabled, compress the current log
            if (this.compress) {
                const currentFile = this.logPath;
                const compressedFile = path.join(this.logDir, `${this.filename}.${dateStr}.1.gz`);
                
                // Create read stream and compress
                const readStream = require('fs').createReadStream(currentFile);
                const writeStream = require('fs').createWriteStream(compressedFile);
                const gzip = zlib.createGzip();
                
                await pipeline(readStream, gzip, writeStream);
                
                // Delete original file after compression
                await fs.unlink(currentFile);
            } else {
                // Just rename without compression
                await fs.rename(this.logPath, path.join(this.logDir, `${this.filename}.${dateStr}.1`));
            }
            
            this.currentSize = 0;
            
        } catch (err) {
            console.error('Rotate error:', err);
        }
    }

    /**
     * Write to log file with queue to prevent concurrent writes
     */
    async _write(level, message, data = {}) {
        // Check log level
        if (this.levelPriority[level] < this.levelPriority[this.level]) {
            return; // Skip logging if level is too low
        }

        const timestamp = this.getTimestamp();
        const dataStr = Object.keys(data).length ? ` ${JSON.stringify(data)}` : '';
        const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}\n`;
        
        // Add to queue
        this.writeQueue.push(logLine);
        
        // Trigger queue processing if not already processing
        if (!this.isWriting) {
            this.processQueue();
        }

        // Console output if enabled
        if (this.consoleOutput) {
            if (level === 'error') {
                console.error(logLine.trim());
            } else {
                console.log(logLine.trim());
            }
        }
    }

    /**
     * Process write queue
     */
    async processQueue() {
        if (this.isWriting || this.writeQueue.length === 0) {
            return;
        }

        this.isWriting = true;

        while (this.writeQueue.length > 0) {
            const logLine = this.writeQueue.shift();
            const lineSize = Buffer.byteLength(logLine);

            try {
                // Check if we need to rotate
                if (this.currentSize + lineSize > this.maxSize && this.currentSize > 0) {
                    await this.rotate();
                }

                // Write to file
                await fs.appendFile(this.logPath, logLine);
                this.currentSize += lineSize;
            } catch (err) {
                console.error('Write error:', err);
            }
        }

        this.isWriting = false;
    }

    // Public logging methods
    debug(message, data = {}) {
        this._write('debug', message, data);
    }

    info(message, data = {}) {
        this._write('info', message, data);
    }

    warn(message, data = {}) {
        this._write('warn', message, data);
    }

    error(message, data = {}) {
        this._write('error', message, data);
    }

    /**
     * Log HTTP request
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {number} duration - Request duration in ms
     */
    logRequest(req, res, duration) {
        const data = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id || 'anonymous'
        };
        
        const level = res.statusCode >= 500 ? 'error' : 
                     res.statusCode >= 400 ? 'warn' : 'info';
        
        this._write(level, 'HTTP Request', data);
    }

    /**
     * Create Express middleware
     */
    middleware() {
        return (req, res, next) => {
            const start = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                this.logRequest(req, res, duration);
            });
            
            next();
        };
    }

    /**
     * Get log files list
     */
    async getLogFiles() {
        try {
            const files = await fs.readdir(this.logDir);
            return files
                .filter(file => file.startsWith(this.filename))
                .map(file => ({
                    name: file,
                    path: path.join(this.logDir, file),
                    size: 0 // Will be filled below
                }));
        } catch (err) {
            console.error('Error reading log directory:', err);
            return [];
        }
    }

    /**
     * Get log file stats
     */
    async getStats() {
        const files = await this.getLogFiles();
        
        for (const file of files) {
            try {
                const stats = await fs.stat(file.path);
                file.size = stats.size;
                file.created = stats.birthtime;
                file.modified = stats.mtime;
            } catch (err) {
                console.error(`Error getting stats for ${file.name}:`, err);
            }
        }
        
        return {
            currentFile: this.logPath,
            currentSize: this.currentSize,
            maxSize: this.maxSize,
            maxFiles: this.maxFiles,
            files: files.sort((a, b) => b.modified - a.modified)
        };
    }

    /**
     * Clean up old logs manually
     * @param {number} daysToKeep - Number of days to keep logs for
     */
    async cleanOldLogs(daysToKeep = 30) {
        try {
            const files = await this.getLogFiles();
            const now = Date.now();
            const cutoff = now - (daysToKeep * 24 * 60 * 60 * 1000);
            
            for (const file of files) {
                const stats = await fs.stat(file.path);
                if (stats.mtime.getTime() < cutoff) {
                    await fs.unlink(file.path);
                    console.log(`Deleted old log: ${file.name}`);
                }
            }
        } catch (err) {
            console.error('Error cleaning old logs:', err);
        }
    }
}

// Export the class
module.exports = SimpleRotatingLogger;

// Also export a factory function for convenience
module.exports.createLogger = (logDir, filename, options) => {
    return new SimpleRotatingLogger(logDir, filename, options);
};