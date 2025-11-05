const express = require('express');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { getConnection } = require('../config/database');
const router = express.Router();

const SPEAKEASY_SECRET_STR = "ONE NBTC App"

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const connection = await getConnection();
    
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE username = ?', 
      [username]
    );
    
    await connection.end();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    
    // In real app, verify password with bcrypt
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (user.is_2fa_enabled) {
      // 2FA is enabled, require code
      return res.json({ 
        requires2FA: true, 
        message: '2FA code required',
        userId: user.id 
      });
    }

    // Login successful without 2FA
    res.json({
      success: true,
      user: { id: user.id, username: user.username, type: user.type },
      requires2FA: false
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// Verify 2FA Code
router.post('/verify-2fa', async (req, res) => {
  try {
    const { userId, code } = req.body;
    const connection = await getConnection();
    
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE id = ?', 
      [userId]
    );
    
    await connection.end();

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];
    
    if (!user.two_factor_secret) {
      return res.status(400).json({ error: '2FA not setup for user' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (verified) {
      res.json({
        success: true,
        user: { id: user.id, username: user.username, type: user.type }
      });
    } else {
      res.status(401).json({ error: 'Invalid 2FA code' });
    }

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// Setup 2FA (for demo)
router.post('/setup-2fa', async (req, res) => {
  try {
    const { userId } = req.body;
    const connection = await getConnection();
    
    const secret = speakeasy.generateSecret({
      name: SPEAKEASY_SECRET_STR
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