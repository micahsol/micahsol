import React, { useState } from 'react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';

function App() {
  const [user, setUser] = useState(null);
  return (
    <div>
      {user ? (
        user.role === 'admin' ? <AdminPanel token={user.token} /> : <Dashboard user={user} />
      ) : (
        <LoginForm setUser={setUser} />
      )}
    </div>
  );
}
export default App;