const express = require('express');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { getConnection } = require('../config/database');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();
const SimpleRotatingLogger = require('../SimpleRotatingLogger');

const SPEAKEASY_SECRET_STR = process.env.TWOFACTOR_SPEAKEASY_SECRET_STR;
const JWT_SECRET_STR = process.env.JWT_SECRET;

const fs = require('fs');
const path = require('path');
const logDir = process.env.LOG_PATH || path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const generateJWTToken = (user) => {
  if (!JWT_SECRET_STR) {
    return null;
  }
  return jwt.sign(
      user, // Store user info here
      JWT_SECRET_STR,
      { expiresIn: '1h' } // Token expires in 1 hour
    );
}

const logger = new SimpleRotatingLogger(logDir, 'backend-auth.js-access.log', {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    compress: true,
    level: 'info'//,
   // consoleOutput: process.env.NODE_ENV !== 'production'
});

const logFile = (req) => {
    //let date_now = new Date().toISOString();
    //const logEntry = `${date_now} - ${req.method} ${req.url} - ${req.ip} - ${req.get('User-Agent')}\n`;
    
    // Write to rotating stream instead of direct append
    logger.info('API Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
}

// Login (real, proxy to avoid CORS)
router.post('/login', async (req, res) => {
  try {
    logFile(req);
    const { username, password } = req.body;
    const connection = await getConnection();

    const AD_API_URL = process.env.AD_API_URL;
    const AD_API_KEY = process.env.AD_API_KEY;

    if (!AD_API_URL || !AD_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // Step 1: Get access token from AD API
    const tokenResponse = await axios.post(`${AD_API_URL}/token`, {
      api_key: AD_API_KEY
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!tokenResponse.data.access_token) {
      return res.status(500).json({
        success: false,
        error: 'การเชื่อมระบบ AD api_key ผิดพลาดในหลังบ้าน'
      });
    }

    // Step 2: Get user info from AD API
    const userResponse = await axios.post(`${AD_API_URL}/user-info`, {
      username: username,
      password: password,
      token: tokenResponse.data.access_token,
      api_key: AD_API_KEY
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.data) {
      return res.status(401).json({ success: false, error: 'ชื่อหรือรหัสผ่านผิดพลาด' });
    }

    const userAD = userResponse.data;
    /*
     looks like this
      {
      "code": 200,
      "CN": "",
      "email": ""
      }
    */

    //now check user authen
    const [users] = await connection.execute(
      'SELECT id, username, employee_id, is_2fa_enabled, is_deleted, created_at, type FROM users WHERE username = ? AND is_deleted = 0', 
      [username]
    );
    if (users.length <= 0) {
      //create and 2fa
      return res.status(401).json({ success: false, error: 'ขออภัย ไม่พบ Username ในฐานข้อมูล' });
    }
      //simply login, if 2fa, setup or use
    const user = users[0];

    if (user.is_2fa_enabled) {
      // 2FA is enabled, require code
      return res.json({ 
        requires2FA: true, 
        message: '2FA code required',
        userId: user.id,
        userAD: userAD
      });
    }

    const token = generateJWTToken(user);
    if (!token) {
      return res.status(500).json({ error: 'JWT Secret ยังไม่ได้ตั้งค่า' });
    }

    // Login successful without 2FA
    res.json({
      success: true,
      user: {...user, ...userAD},
      requires2FA: false,
      token: token
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// Verify 2FA Code
router.post('/verify-2fa', async (req, res) => {
  try {
    logFile(req);
    const { userId, username, userAD, code } = req.body;
    const connection = await getConnection();
    
    const [users] = await connection.execute(
      'SELECT id, username, employee_id, is_2fa_enabled, is_deleted, created_at, two_factor_secret, type FROM users WHERE username = ? AND is_deleted = 0', 
      [username]
    );
    if (users.length <= 0) {
      //create and 2fa
      return res.status(401).json({ success: false, error: 'ขออภัย ไม่พบ Username ในฐานข้อมูล' });
    }
    const user = users[0];

    await connection.end();
    
    if (!user.two_factor_secret) {
      return res.status(400).json({ error: '2FA ยังไม่ได้ตั้งค่า' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    delete user['two_factor_secret']; //never make this public or send to front end at all
    const token = generateJWTToken(user);
    if (!token) {
      return res.status(500).json({ error: 'JWT Secret ยังไม่ได้ตั้งค่า' });
    }

    if (verified) {
      res.json({
        success: true,
        user: {...user, ...userAD},
        token: token
      });
    } else {
      res.status(401).json({ error: 'รหัส 2FA code ผิด' });
    }

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// Setup 2FA
router.post('/setup-2fa', async (req, res) => {
  try {
    logFile(req);
    const { userId, username } = req.body;
    const connection = await getConnection();
    
    const secret = speakeasy.generateSecret({
      name: `${SPEAKEASY_SECRET_STR} : ${username}`
    });

    // Update user with 2FA secret
    await connection.execute(
      'UPDATE users SET two_factor_secret = ?, is_2fa_enabled = 1 WHERE id = ?',
      [secret.base32, userId]
    );
    
    await connection.end();

    // Generate QR code
    QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        return res.status(500).json({ error: 'QR generation failed' });
      }
      
      res.json({
        success: true,
        secret: secret.base32,
        qrCode: data_url
      });
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;