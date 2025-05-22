import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Stack,
  FormControl, 
  InputLabel, 
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { getCampaigns, getAdSets, Campaign, AdSet } from '../services/facebookAdsApi';
import { MetricsPage } from './MetricsPage';

interface DashboardProps {
  projectId: number;
}

const Dashboard: React.FC<DashboardProps> = ({ projectId }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedAdSetId, setSelectedAdSetId] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAdSets, setLoadingAdSets] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch campaigns on mount
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const campaignsData = await getCampaigns();
        setCampaigns(campaignsData);
        
        // Auto-select first campaign if available
        if (campaignsData.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(campaignsData[0].id);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Fetch ad sets when campaign selection changes
  useEffect(() => {
    if (!selectedCampaignId) return;
    
    const fetchAdSets = async () => {
      setLoadingAdSets(true);
      try {
        const adSetsData = await getAdSets(selectedCampaignId);
        setAdSets(adSetsData);
        // Reset ad set selection to "All" when campaign changes
        setSelectedAdSetId('all');
      } catch (e: any) {
        console.error("Failed to load ad sets:", e);
      } finally {
        setLoadingAdSets(false);
      }
    };
    
    fetchAdSets();
  }, [selectedCampaignId]);

  const handleCampaignChange = (event: SelectChangeEvent) => {
    setSelectedCampaignId(event.target.value);
  };

  const handleAdSetChange = (event: SelectChangeEvent) => {
    setSelectedAdSetId(event.target.value);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const campaignsData = await getCampaigns();
      setCampaigns(campaignsData);
      
      if (selectedCampaignId) {
        const adSetsData = await getAdSets(selectedCampaignId);
        setAdSets(adSetsData);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && campaigns.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>Campaign Dashboard</Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2} 
          sx={{ width: '100%' }}
        >
          <Box sx={{ width: { xs: '100%', md: '33%' } }}>
            <FormControl fullWidth>
              <InputLabel id="campaign-select-label">Campaign</InputLabel>
              <Select
                labelId="campaign-select-label"
                value={selectedCampaignId}
                onChange={handleCampaignChange}
                label="Campaign"
                disabled={loading || campaigns.length === 0}
              >
                {campaigns.map((campaign) => (
                  <MenuItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: { xs: '100%', md: '33%' } }}>
            <FormControl fullWidth>
              <InputLabel id="ad-set-select-label">Ad Set</InputLabel>
              <Select
                labelId="ad-set-select-label"
                value={selectedAdSetId}
                onChange={handleAdSetChange}
                label="Ad Set"
                disabled={loadingAdSets || adSets.length === 0 || !selectedCampaignId}
              >
                <MenuItem value="all">All Ad Sets</MenuItem>
                {adSets.map((adSet) => (
                  <MenuItem key={adSet.id} value={adSet.id}>
                    {adSet.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: { xs: '100%', md: '33%' } }}>
            <Button 
              variant="contained" 
              onClick={handleRefresh}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </Box>
        </Stack>
      </Paper>

      {selectedCampaignId && (
        <Box>
          <MetricsPage 
            projectId={projectId} 
            campaignId={selectedCampaignId}
            adSetId={selectedAdSetId !== 'all' ? selectedAdSetId : undefined}
          />
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;