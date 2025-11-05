import React from 'react';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar">
      <div className="nav-brand">ONE NBTC</div>
      <div className="nav-user">
        Welcome, {user?.username} 
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;