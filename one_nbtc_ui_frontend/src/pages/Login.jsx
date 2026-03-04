import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from '../components/Modal';

const Login = ({ onLogin }) => {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userAD, setUserAD] = useState(null);
  const [code, setCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: '', message: '' });
  const navigate = useNavigate();

  const showModal = (type, message) => {
    setModal({ isOpen: true, type, message });
  };

  const closeModal = () => {
    setModal({ isOpen: false, type: '', message: '' });
  };

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
        setUserId(response.data.userId || null);
        setUserAD(response.data.userAD || null);
      } else {
        onLogin(response.data.user, response.data.token);
        navigate('/');
      }
    } catch (error) {
      showModal('error', 'Login failed: ' + (error.response?.data?.error || error.message));
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
        username,
        userAD,
        code
      });
      
      onLogin(response.data.user, response.data.token);
      navigate('/');
    } catch (error) {
      showModal('error','2FA verification failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const setup2FA = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/setup-2fa`, {
        userId, username
      });
      
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setShowSetup2FA(true);
    } catch (error) {
      showModal('error','2FA setup failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secret);
    showModal('success', 'Secret key copied to clipboard!');
  };

  const handleModalClose = () => {
    closeModal();
  };

  // หน้าตั้งค่า 2FA
if (showSetup2FA) {
  return (
    <div className="login-container">
      <h2>ตั้งค่าการยืนยันสองขั้นตอน</h2>
      <div className="setup-2fa">
        <p>สแกน QR Code นี้ด้วยแอปยืนยันตัวตนของคุณ:</p>
        
        {qrCode && (
          <div className="qr-code-container">
            <img src={qrCode} alt="QR Code" className="qr-code" />
          </div>
        )}
        
        <div className="secret-container">
          <p>หรือป้อนคีย์ลับนี้ด้วยตนเอง:</p>
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
          หลังจากตั้งค่าแล้ว กรุณาป้อนรหัส 6 หลักจากแอปยืนยันตัวตน:
        </p>
        
        <form onSubmit={verify2FA}>
          <input
            className="login-input"
            type="password"
            placeholder="ป้อนรหัส 6 หลัก"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
          />
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'กำลังตรวจสอบ...' : 'ยืนยันและตั้งค่าให้เสร็จสิ้น'}
          </button>
        </form>
      </div>

      <Modal 
        isOpen={modal.isOpen} 
        onClose={handleModalClose}
        title={modal.type === 'success' ? 'สำเร็จ' : 'ข้อผิดพลาด'}
      >
        <p>{modal.message}</p>
        <div className="modal-actions">
          <button onClick={handleModalClose} className="modal-btn primary">ปิด</button>
        </div>
      </Modal>
    </div>
  );
}

// หน้าตรวจสอบ 2FA
if (requires2FA) {
  return (
    <div className="login-container">
      <h2>การยืนยันสองขั้นตอน</h2>
      
      <div className="auth-options">
        <p>ป้อนรหัส 6 หลักจากแอปยืนยันตัวตน</p>
        <br/>
        
        <form onSubmit={verify2FA}>
          <input
            className="login-input"
            type="password"
            placeholder="ป้อนรหัส 6 หลัก"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
          />
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'กำลังตรวจสอบ...' : 'ยืนยัน'}
          </button>
        </form>
        
        <div className="setup-prompt">
          <p>ยังไม่ได้ตั้งค่า 2FA?</p>
          <button 
            type="button" 
            onClick={setup2FA}
            disabled={loading}
            className="setup-btn"
          >
            ตั้งค่า 2FA ทันที
          </button>
        </div>
      </div>

      <Modal 
        isOpen={modal.isOpen} 
        onClose={handleModalClose}
        title={modal.type === 'success' ? 'สำเร็จ' : 'ข้อผิดพลาด'}
      >
        <p>{modal.message}</p>
        <div className="modal-actions">
          <button onClick={handleModalClose} className="modal-btn primary">ปิด</button>
        </div>
      </Modal>
    </div>
  );
}

  // Initial Login Screen
  return (
    <div className="login-container">
      <h2>ลงชื่อเข้าใช้งานสำหรับผู้ดูแลระบบ</h2>
      <form onSubmit={handleLogin}>
        <input
          className="login-input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="login-btn" type="submit" disabled={loading}>
          {loading ? 'กำลังดำเนินการ...' : 'ลงชื่อเข้าใช้'}
        </button>
      </form>

      <Modal 
        isOpen={modal.isOpen} 
        onClose={handleModalClose}
        title={modal.type === 'success' ? 'สำเร็จ' : 'ข้อผิดพลาด'}
      >
        <p>{modal.message}</p>
        <div className="modal-actions">
          <button onClick={handleModalClose} className="modal-btn primary">ปิด</button>
        </div>
      </Modal>
    </div>
  );
};

export default Login;