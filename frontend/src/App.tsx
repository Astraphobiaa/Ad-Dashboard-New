// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CampaignManager from './components/CampaignManager';
import CampaignForm from './components/CampaignForm';
import AdSetForm from './components/AdSetForm';
import AdForm from './components/AdForm';
import { MetricsPage } from './components/MetricsPage';
import VideoManager from './components/VideoManager';
import Dashboard from './components/Dashboard';
import FacebookCredentialsTest from './components/FacebookCredentialsTest';
import FullCampaignForm from './components/FullCampaignForm';

const App: React.FC = () => {
    const projectId = 1; // sabit proje ID

    return (
        <Router>
            <nav style={{ padding: 16, borderBottom: '1px solid #ddd' }}>
                <Link to="/" style={{ marginRight: 16 }}>Kampanyalarım</Link>
                <Link to="/create-all" style={{ marginRight: 16 }}>Create Ad</Link>
                <Link to="/videos" style={{ marginRight: 16 }}>Videolar</Link>
                <Link to="/metrics" style={{ marginRight: 16 }}>Metrikler</Link>
                <Link to="/facebook-credentials">FB Credentials</Link>
            </nav>
            <div style={{ padding: 16 }}>
                <Routes>
                    {/* 1) Kampanyalarım */}
                    <Route path="/" element={<CampaignManager />} />

                    {/* 2) Create Ad (All-in-One Form) */}
                    <Route path="/create-all" element={<FullCampaignForm projectId={projectId} />} />

                    {/* Hidden but still available routes */}
                    <Route path="/create" element={<CampaignForm projectId={projectId} />} />
                    <Route path="/create-adset" element={<AdSetForm projectId={projectId} />} />
                    <Route path="/create-ad" element={<AdForm projectId={projectId} />} />
                    <Route path="/adset/:adSetId/ads" element={<AdForm projectId={projectId} />} />
                    
                    {/* 3) Metrikler (kampanya seçildikten sonra) */}
                    <Route path="/metrics/:campaignId" element={<MetricsPage projectId={projectId} />} />
                    <Route path="/metrics" element={<MetricsPage projectId={projectId} />} />

                    {/* 4) Video Yönetimi */}
                    <Route path="/videos" element={<VideoManager />} />
                    
                    {/* 5) Facebook Credentials Test */}
                    <Route path="/facebook-credentials" element={<FacebookCredentialsTest />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;
