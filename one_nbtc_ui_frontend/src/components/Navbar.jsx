import React from 'react';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar-public">
      <div className="nav-brand-public">NBTC Learn and Grow Registration</div>
      <div className="nav-user-public">
        กรอกข้อมูลเพื่อลงทะเบียน
      </div>
    </nav>
  );
};

export default Navbar;