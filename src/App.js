import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/auth/PrivateRoute';
import Signup from './components/auth/Signup';
import Login from './components/auth/Login';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Routes>
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
