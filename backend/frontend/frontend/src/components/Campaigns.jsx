import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import UniversalCampaigns from './StudentCampaigns';

const Campaigns = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);

  // Show the universal campaign interface for everyone
  return <UniversalCampaigns />;
};

export default Campaigns;