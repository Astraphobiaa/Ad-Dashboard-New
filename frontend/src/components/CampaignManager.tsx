import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCampaigns, Campaign } from '../services/facebookAdsApi';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import BarChartIcon from '@mui/icons-material/BarChart';
import AddIcon from '@mui/icons-material/Add';

const CampaignManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const navigate = useNavigate();

  const fetchCampaigns = () => {
    setLoading(true);
    getCampaigns()
      .then(data => setCampaigns(data))
      .catch(err => setError(err.message || 'Unable to fetch campaign list'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'success';
      case 'PAUSED':
        return 'warning';
      case 'ARCHIVED':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleCreateNewAd = () => {
    navigate('/create-all');
  };

  const handleViewMetrics = (campaignId: string) => {
    navigate(`/metrics/${campaignId}`);
  };

  if (loading && campaigns.length === 0) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <CircularProgress />
    </Box>
  );

  if (error) return (
    <Paper sx={{ p: 3, mt: 2, bgcolor: '#fff4f4' }}>
      <Typography color="error" variant="h6">Error</Typography>
      <Typography color="error">{error}</Typography>
      <Button variant="outlined" color="primary" onClick={fetchCampaigns} sx={{ mt: 2 }}>
        Try Again
      </Button>
    </Paper>
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5">Kampanyalarım</Typography>
        <Box>
          <Tooltip title="Refresh campaigns">
            <IconButton onClick={fetchCampaigns} disabled={loading} sx={{ mr: 1 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleCreateNewAd}
          >
            Create Ad
          </Button>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!loading && campaigns.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No campaigns found
          </Typography>
          <Typography color="textSecondary" paragraph>
            Create your first campaign to get started
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleCreateNewAd}
            startIcon={<AddIcon />}
          >
            Create Ad
          </Button>
        </Paper>
      )}

      <Grid container spacing={3}>
        {campaigns.map(campaign => (
          <Grid key={campaign.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }} title={campaign.name}>
                    {campaign.name}
                  </Typography>
                  <Chip 
                    label={campaign.status} 
                    size="small" 
                    color={getStatusColor(campaign.status) as any}
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography color="textSecondary" gutterBottom>
                  ID: {campaign.id}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<BarChartIcon />}
                    onClick={() => handleViewMetrics(campaign.id)}
                  >
                    View Metrics
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CampaignManager;
