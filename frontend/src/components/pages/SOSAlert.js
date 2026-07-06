import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SOSAlert() {
  const navigate = useNavigate();
  React.useEffect(() => {
    // automatically redirect to dashboard which has the button
    navigate('/dashboard');
  }, [navigate]);

  return null;
}
