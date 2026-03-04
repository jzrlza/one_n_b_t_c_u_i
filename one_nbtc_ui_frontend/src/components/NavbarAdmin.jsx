import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavbarAdmin = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when navigating
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-header">
          <div className="nav-brand">สำหรับผู้ดูแลระบบ</div>
        </div>

        {/* Desktop horizontal navigation (visible on large screens) */}
        <div className="nav-tabs-container desktop">
          <div className="nav-tabs">
            <button 
              onClick={() => handleNavigation('/employee')}
              className={`nav-tab ${location.pathname === '/employee' ? 'active' : ''}`}
            >
              หน้าพนักงาน
            </button>
            <button 
              onClick={() => handleNavigation('/attendance')}
              className={`nav-tab ${location.pathname === '/attendance' ? 'active' : ''}`}
            >
              หน้าการลงทะเบียน
            </button>
            {parseInt(user?.type) === 1 ? 
            <button 
              onClick={() => handleNavigation('/username')}
              className={`nav-tab ${location.pathname === '/username' ? 'active' : ''}`}
            >
              หน้าผู้ใช้งาน
            </button> : ""}
          </div>
        </div>

        {/* Hamburger menu button */}
          <button 
            className={`hamburger-btn ${isMenuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

        <div className="nav-user">
          <span className="user-greeting">{user?.CN}</span>
          <button onClick={onLogout} className="logout-btn">
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Vertical Mobile Menu - slides in when hamburger is clicked */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : 'mobile-menu-closed'}`}>
        <div className="mobile-menu-header">
          <span className="mobile-user-greeting">เลือกหน้า</span>
          <button className="mobile-close-btn" onClick={() => setIsMenuOpen(false)}>
            ✕
          </button>
        </div>
        <div className="mobile-menu-items">
          <button 
            onClick={() => handleNavigation('/employee')}
            className={`mobile-menu-item ${location.pathname === '/employee' ? 'active' : ''}`}
          >
            หน้าพนักงาน
          </button>
          <button 
            onClick={() => handleNavigation('/attendance')}
            className={`mobile-menu-item ${location.pathname === '/attendance' ? 'active' : ''}`}
          >
            หน้าการลงทะเบียน
          </button>
          {parseInt(user?.type) === 1 ? 
          <button 
            onClick={() => handleNavigation('/username')}
            className={`mobile-menu-item ${location.pathname === '/username' ? 'active' : ''}`}
          >
            หน้าผู้ใช้งาน
          </button> : ""}
        </div>
        <div className="mobile-menu-footer">
        <span className="mobile-user-greeting">{user?.CN}</span><br/><br/>
          <button onClick={onLogout} className="logout-btn mobile-logout-btn">
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Overlay when mobile menu is open */}
      <div className={`menu-overlay ${isMenuOpen ? 'open' : 'mobile-menu-closed'}`} onClick={() => setIsMenuOpen(false)} />
    </nav>
  );
};

export default NavbarAdmin;