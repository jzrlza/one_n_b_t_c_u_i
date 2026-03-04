import React from 'react';
import bannerImage from '../res/LOGO.png';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar-public">
      <div className="nav-brand-public">
      <img className="img-banner" src={bannerImage} 
            alt={
              `null image currently`
            } 
          /></div>
      <div className="nav-user-public">
        กรอกข้อมูลเพื่อลงทะเบียน
      </div>
    </nav>
  );
};

export default Navbar;