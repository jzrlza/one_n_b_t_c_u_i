import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="nav-left">
        <div className="nav-brand">ONE NBTC</div>
        <div className="nav-tabs">
          <button 
            onClick={() => navigate('/')}
            className={`nav-tab ${location.pathname === '/' ? 'active' : ''}`}
          >
            พนักงาน
          </button>
          <button 
            onClick={() => navigate('/attendance')}
            className={`nav-tab ${location.pathname === '/attendance' ? 'active' : ''}`}
          >
            การลงทะเบียนเข้าร่วมงาน
          </button>
        </div>
      </div>
      <div className="nav-user">
        ยินดีต้อนรับ, {user?.username} 
        <button onClick={onLogout} className="logout-btn">ออกจากระบบ</button>
      </div>
    </nav>
  );
};

export default Navbar;