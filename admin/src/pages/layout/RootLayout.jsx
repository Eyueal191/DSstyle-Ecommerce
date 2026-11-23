import React from 'react';
import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TelegramWelcomeSplash from '../../components/TelegramWelcomeSplash.jsx';

function RootLayout() {
  return (
    <div>
      <TelegramWelcomeSplash />
      <Outlet />
      <ToastContainer />
    </div>
  );
}

export default RootLayout;
