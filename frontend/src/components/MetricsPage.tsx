import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  TextField,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';
import { getInsights, getAdSets, Insight, AdSet } from '../services/facebookAdsApi';

interface MetricsPageProps {
  projectId: number;
  campaignId?: string;
  adSetId?: string;
}

export const MetricsPage: React.FC<MetricsPageProps> = ({ projectId, campaignId, adSetId }) => {
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);
  const [since, setSince] = useState<string>(today);
  const [until, setUntil] = useState<string>(today);
  const [selectedAdSetId, setSelectedAdSetId] = useState<string>('all');
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [loadingAdSets, setLoadingAdSets] = useState<boolean>(false);

  const [data, setData] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  // Update selected ad set when prop changes
  useEffect(() => {
    if (adSetId) {
      setSelectedAdSetId(adSetId);
    } else {
      setSelectedAdSetId('all');
    }
  }, [adSetId]);

  // Fetch AdSets when campaign is selected
  useEffect(() => {
    if (!campaignId) return;
    
    const fetchAdSets = async () => {
      setLoadingAdSets(true);
      try {
        const adSetsData = await getAdSets(campaignId);
        setAdSets(adSetsData);
      } catch (e: any) {
        console.error("Failed to load ad sets:", e);
      } finally {
        setLoadingAdSets(false);
      }
    };
    
    fetchAdSets();
  }, [campaignId]);

  // Fetch insights when filters change
  useEffect(() => {
    if (!campaignId) {
      return;
    }
    setLoading(true);
    
    const fetchInsights = async () => {
      try {
        // If an ad set is selected, we would ideally fetch insights for that specific ad set
        // For now, we're just fetching campaign insights as that's what the backend supports
        const insights = await getInsights(campaignId, since, until);
        setData(insights);
        setError(undefined);
      } catch (e: any) {
        setError(e.message || 'Veri alınamadı');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInsights();
  }, [campaignId, since, until, selectedAdSetId]);

  const handleAdSetChange = (event: SelectChangeEvent) => {
    setSelectedAdSetId(event.target.value);
  };

  if (loading) return <Box textAlign="center"><CircularProgress/></Box>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!campaignId) return <Typography>No campaign selected</Typography>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Metrikler – Kampanya: {campaignId}
        {selectedAdSetId !== 'all' && ` | Ad Set: ${adSets.find(a => a.id === selectedAdSetId)?.name || selectedAdSetId}`}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
            label="Başlangıç"
            type="date"
            value={since}
            onChange={e => setSince(e.target.value)}
            InputLabelProps={{ shrink: true }}
        />
        <TextField
            label="Bitiş"
            type="date"
            value={until}
            onChange={e => setUntil(e.target.value)}
            InputLabelProps={{ shrink: true }}
        />
        {!adSetId && (
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="ad-set-select-label">Ad Set</InputLabel>
            <Select
              labelId="ad-set-select-label"
              value={selectedAdSetId}
              onChange={handleAdSetChange}
              label="Ad Set"
              disabled={loadingAdSets || adSets.length === 0}
            >
              <MenuItem value="all">All Ad Sets</MenuItem>
              {adSets.map((adSet) => (
                <MenuItem key={adSet.id} value={adSet.id}>
                  {adSet.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <Button variant="contained" onClick={() => {/* useEffect will trigger */}}>
          Yenile
        </Button>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            {['Date','Impressions','Reach','Spend','CPI'].map(h=>(
                <TableCell key={h}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length > 0 ? (
            data.map((d,i)=>(
              <TableRow key={i}>
                <TableCell>{d.date}</TableCell>
                <TableCell align="right">{d.impressions.toLocaleString()}</TableCell>
                <TableCell align="right">{d.reach.toLocaleString()}</TableCell>
                <TableCell align="right">{d.spend.toFixed(2)}</TableCell>
                <TableCell align="right">{d.cpi > 0 ? d.cpi.toFixed(2) : '-'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center">No data available</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
};
