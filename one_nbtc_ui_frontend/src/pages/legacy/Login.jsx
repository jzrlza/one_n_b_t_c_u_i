import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState(null);
  const [code, setCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password
      });

      if (response.data.requires2FA) {
        setRequires2FA(true);
        setUserId(response.data.userId);
      } else {
        onLogin(response.data.user);
        navigate('/');
      }
    } catch (error) {
      alert('เข้าสู่ระบบล้มเหลว: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-2fa`, {
        userId,
        code
      });
      
      onLogin(response.data.user);
      navigate('/');
    } catch (error) {
      alert('การยืนยันสองขั้นตอนล้มเหลว: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const setup2FA = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/setup-2fa`, {
        userId
      });
      
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setShowSetup2FA(true);
    } catch (error) {
      alert('การตั้งค่าสองขั้นตอนล้มเหลว: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secret);
    alert('คัดลอกรหัสลับไว้แล้ว!');
  };

  // 2FA Setup Screen
  if (showSetup2FA) {
    return (
      <div className="login-container">
        <h2>ตั้งค่าการยืนยันตัวตนสองขั้นตอน</h2>
        <div className="setup-2fa">
          <p>สแกน QR Code นี้ด้วยแอปยืนยันตัวตนของคุณ:</p>
          
          {qrCode && (
            <div className="qr-code-container">
              <img src={qrCode} alt="QR Code" className="qr-code" />
            </div>
          )}
          
          <div className="secret-container">
            <p>หรือป้อนรหัสลับนี้ด้วยตนเอง:</p>
            <div className="secret-display">
              <code>{secret}</code>
              <button 
                type="button" 
                onClick={copyToClipboard}
                className="copy-btn"
              >
                คัดลอก
              </button>
            </div>
          </div>
          
          <p className="instruction">
            หลังจากตั้งค่าแล้ว กรุณาป้อนรหัส 6 หลักจากแอปยืนยันตัวตนของคุณ:
          </p>
          
          <form onSubmit={verify2FA}>
            <input
              type="text"
              placeholder="ป้อนรหัส 6 หลัก"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={6}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'กำลังยืนยัน...' : 'ยืนยันและตั้งค่าเสร็จสิ้น'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2FA Verification Screen
  if (requires2FA) {
    return (
      <div className="login-container">
        <h2>การยืนยันตัวตนสองขั้นตอน</h2>
        
        <div className="auth-options">
          <p>ป้อนรหัส 6 หลักจากแอปยืนยันตัวตนของคุณ:</p>
          
          <form onSubmit={verify2FA}>
            <input
              type="text"
              placeholder="ป้อนรหัส 6 หลัก"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={6}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'กำลังยืนยัน...' : 'ยืนยัน'}
            </button>
          </form>
          
          <div className="setup-prompt">
            <p>ยังไม่ได้ตั้งค่าการยืนยันสองขั้นตอน?</p>
            <button 
              type="button" 
              onClick={setup2FA}
              disabled={loading}
              className="setup-btn"
            >
              ตั้งค่าการยืนยันสองขั้นตอนตอนนี้
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Initial Login Screen
  return (
    <div className="login-container">
      <h2>เข้าสู่ระบบ ONE NBTC</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="ชื่อผู้ใช้"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
};

export default Login;