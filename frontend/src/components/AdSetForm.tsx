import React, { useState, useEffect } from 'react';
import { Button, Form, Alert, Card, Row, Col } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import * as facebookAdsApi from '../services/facebookAdsApi';
import { toast } from 'react-toastify';
import Select from 'react-select';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface VideoOption {
  value: string;
  label: string;
  thumbnail?: string;
}

interface CampaignOption {
  value: string;
  label: string;
}

interface AdSetFormProps {
  projectId: number;
}

const AdSetForm: React.FC<AdSetFormProps> = ({ projectId }) => {
  // Form state
  const [formData, setFormData] = useState({
    campaignId: '',
    name: '',
    status: 'PAUSED' as 'PAUSED' | 'ACTIVE',
    dailyBudget: 1000,
    billingEvent: 'IMPRESSIONS' as 'IMPRESSIONS' | 'LINK_CLICKS',
    optimizationGoal: 'IMPRESSIONS',
    startTime: null as Date | null,
    stopTime: null as Date | null,
    bidAmount: 100,
    bidStrategy: 'LOWEST_COST_WITH_BID_CAP' as 'LOWEST_COST_WITH_BID_CAP' | 'LOWEST_COST_WITHOUT_CAP' | 'COST_CAP',
    minimumRoasTarget: 2,
    targeting: {
      geoLocations: {
        countries: ['US'],
      },
      ageMin: 18,
      ageMax: 65,
      genders: [] as number[],
      devicePlatforms: [] as string[],
      publisherPlatforms: [] as string[],
      facebookPositions: [] as string[],
    },
    selectedVideoIds: [] as string[],
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [videos, setVideos] = useState<VideoOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);

  // Add state for debug payload and testing
  const [debugPayload, setDebugPayload] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<string>('');
  const [apiResponseVisible, setApiResponseVisible] = useState<boolean>(false);

  // Options for form selects
  const billingEvents = [
    { value: 'IMPRESSIONS', label: 'Impressions (CPM)' },
    { value: 'LINK_CLICKS', label: 'Link Clicks (CPC)' }
  ];

  const optimizationGoals = [
    { value: 'REACH', label: 'Reach' },
    { value: 'IMPRESSIONS', label: 'Impressions' },
    { value: 'LINK_CLICKS', label: 'Link Clicks' },
    { value: 'PAGE_LIKES', label: 'Page Likes' },
    { value: 'POST_ENGAGEMENT', label: 'Post Engagement' },
    { value: 'VIDEO_VIEWS', label: 'Video Views' },
    { value: 'LEAD_GENERATION', label: 'Lead Generation' },
    { value: 'APP_INSTALLS', label: 'App Installs' },
    { value: 'CONVERSIONS', label: 'Conversions' },
    { value: 'LANDING_PAGE_VIEWS', label: 'Landing Page Views' },
    { value: 'VALUE', label: 'Value (ROAS)' }
  ];

  const bidStrategyOptions = [
    { value: 'LOWEST_COST_WITH_BID_CAP' as const, label: 'Lowest Cost with Bid Cap' },
    { value: 'LOWEST_COST_WITHOUT_CAP' as const, label: 'Lowest Cost without Cap' },
    { value: 'COST_CAP' as const, label: 'Cost Cap' }
  ];

  const countries = [
    { value: 'US', label: 'United States' },
    { value: 'TR', label: 'Turkey' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'FR', label: 'France' },
    { value: 'DE', label: 'Germany' },
    { value: 'IT', label: 'Italy' },
    { value: 'ES', label: 'Spain' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
    { value: 'JP', label: 'Japan' }
  ];

  const genderOptions = [
    { value: 0, label: 'All' },
    { value: 1, label: 'Male' },
    { value: 2, label: 'Female' }
  ];

  const devicePlatformOptions = [
    { value: 'mobile', label: 'Mobile' },
    { value: 'desktop', label: 'Desktop' }
  ];

  const publisherPlatformOptions = [
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'audience_network', label: 'Audience Network' },
    { value: 'messenger', label: 'Messenger' }
  ];

  const facebookPositionOptions = [
    { value: 'feed', label: 'Facebook Feed' },
    { value: 'right_hand_column', label: 'Right Column' },
    { value: 'instant_article', label: 'Instant Articles' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'video_feeds', label: 'Facebook Video Feeds' },
    { value: 'story', label: 'Facebook Stories' },
    { value: 'search', label: 'Facebook Search Results' },
    { value: 'instream_video', label: 'Facebook In-Stream Videos' }
  ];

  // Load videos and campaigns on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch videos
        const videoResponse = await facebookAdsApi.getVideos();
        if (videoResponse.success && videoResponse.data) {
          const videoOptions = videoResponse.data.map(video => ({
            value: video.id,
            label: video.title || 'Untitled Video',
            thumbnail: video.thumbnailUrl
          }));
          setVideos(videoOptions);
        }
        
        // Fetch campaigns
        console.log('Fetching campaigns...');
        const campaignResponse = await facebookAdsApi.getCampaigns();
        console.log('Campaign response:', campaignResponse);
        
        if (campaignResponse && campaignResponse.length > 0) {
          // Map the campaigns to options for the dropdown
          const campaignOptions = campaignResponse.map(campaign => {
            // Handle different possible field names safely
            const campaignId = campaign.id || '';
            const displayName = campaign.name || `Campaign ${campaignId}`;
            
            return {
              value: campaignId,
              label: displayName
            };
          });
          console.log('Campaign options created:', campaignOptions);
          setCampaigns(campaignOptions);
        } else {
          console.log('No campaigns found or empty response');
          setCampaigns([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data. Please refresh the page.');
      }
    };

    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string) => (option: any) => {
    if (Array.isArray(option)) {
      // For multi-select
      setFormData(prev => ({
        ...prev,
        [name]: option.map(item => item.value)
      }));
    } else if (option) {
      // For single select
      setFormData(prev => ({
        ...prev,
        [name]: option.value
      }));
    } else {
      // Handle null case
      setFormData(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTargetingChange = (field: string) => (option: any) => {
    if (field === 'countries') {
      // For countries multi-select
      const countries = Array.isArray(option) ? option.map(o => o.value) : [];
      setFormData(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          geoLocations: {
            ...prev.targeting.geoLocations,
            countries
          }
        }
      }));
    } else if (field === 'genders') {
      // For gender select (single)
      const genderValue = option?.value || 0;
      setFormData(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          genders: genderValue === 0 ? [] : [genderValue]
        }
      }));
    } else if (field === 'ageMin' || field === 'ageMax') {
      // For age inputs
      const value = parseInt(option.target.value);
      if (!isNaN(value)) {
        setFormData(prev => ({
          ...prev,
          targeting: {
            ...prev.targeting,
            [field]: value
          }
        }));
      }
    } else if (field === 'devicePlatforms' || field === 'publisherPlatforms' || field === 'facebookPositions') {
      // For other multi-selects
      const values = Array.isArray(option) ? option.map(o => o.value) : [];
      setFormData(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          [field]: values
        }
      }));
    }
  };

  const handleDateChange = (name: string) => (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.campaignId) {
      errors.campaignId = 'Campaign is required';
    }

    if (!formData.name.trim()) {
      errors.name = 'Ad Set name is required';
    }

    if (formData.dailyBudget < 100) {
      errors.dailyBudget = 'Daily budget must be at least 100';
    }

    if (!formData.bidAmount || formData.bidAmount < 1 || formData.bidAmount > 1000) {
      errors.bidAmount = 'Bid amount must be between 1 and 1000';
    }

    // Validate ROAS target when optimization goal is VALUE
    if (formData.optimizationGoal === 'VALUE' && (formData.minimumRoasTarget < 1 || formData.minimumRoasTarget > 10)) {
      errors.minimumRoasTarget = 'Minimum ROAS target must be between 1 and 10';
    }

    // Check if the ad set is scheduled for less than 24 hours
    if (formData.startTime && formData.stopTime) {
      const durationHours = (formData.stopTime.getTime() - formData.startTime.getTime()) / (1000 * 60 * 60);
      if (durationHours < 24) {
        errors.stopTime = 'Ad sets with daily budget must be scheduled for at least 24 hours';
      }
    }

    if (!formData.targeting.geoLocations.countries.length) {
      errors.countries = 'At least one country must be selected';
    }

    if (formData.targeting.ageMin < 13 || formData.targeting.ageMin > 65) {
      errors.ageMin = 'Minimum age must be between 13-65';
    }

    if (formData.targeting.ageMax < 13 || formData.targeting.ageMax > 65 || formData.targeting.ageMax < formData.targeting.ageMin) {
      errors.ageMax = 'Maximum age must be greater than minimum age and between 13-65';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const preparePayload = () => {
    // Prepare targeting object
    const targetingObj: any = {
      geoLocations: formData.targeting.geoLocations,
      ageMin: formData.targeting.ageMin,
      ageMax: formData.targeting.ageMax,
      genders: formData.targeting.genders,
    };

    // Only add these if they have values
    if (formData.targeting.devicePlatforms && formData.targeting.devicePlatforms.length > 0) {
      targetingObj.devicePlatforms = formData.targeting.devicePlatforms;
    }
    
    if (formData.targeting.publisherPlatforms && formData.targeting.publisherPlatforms.length > 0) {
      targetingObj.publisherPlatforms = formData.targeting.publisherPlatforms;
    }

    // Add facebook positions as placements if selected
    if (formData.targeting.facebookPositions && formData.targeting.facebookPositions.length > 0) {
      targetingObj.placements = {
        facebook_positions: formData.targeting.facebookPositions
      };
    }

    // Prepare payload
    const payload: facebookAdsApi.CreateAdSetPayload = {
      campaignId: formData.campaignId,
      name: formData.name,
      status: formData.status,
      dailyBudget: formData.dailyBudget,
      billingEvent: formData.billingEvent,
      optimizationGoal: formData.optimizationGoal,
      bidAmount: formData.bidAmount,
      bidStrategy: formData.bidStrategy,
      startTime: formData.startTime ? formData.startTime.toISOString() : undefined,
      stopTime: formData.stopTime ? formData.stopTime.toISOString() : undefined,
      targeting: targetingObj,
      selectedVideoIds: formData.selectedVideoIds,
    };

    // Add minimumRoasTarget only if optimization goal is VALUE
    if (formData.optimizationGoal === 'VALUE') {
      payload.minimumRoasTarget = formData.minimumRoasTarget;
    }

    // Set debug payload for display
    setDebugPayload(JSON.stringify(payload, null, 2));
    
    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');
    setApiResponse('');
    setApiResponseVisible(false);

    try {
      // Prepare the payload
      const payload = preparePayload();
      
      // Submit to API
      try {
        const response = await facebookAdsApi.createAdSet(payload);
        
        setSuccessMessage(`Ad Set successfully created! Ad Set ID: ${response.adSetId}`);
        if (response.adIds && response.adIds.length > 0) {
          setSuccessMessage(prev => `${prev}, with ${response.adIds.length} ads created`);
        }
        
        toast.success('Ad Set successfully created!');
        
        // Reset form
        setFormData({
          campaignId: '',
          name: '',
          status: 'PAUSED',
          dailyBudget: 1000,
          billingEvent: 'IMPRESSIONS',
          optimizationGoal: 'IMPRESSIONS',
          startTime: null,
          stopTime: null,
          bidAmount: 100,
          bidStrategy: 'LOWEST_COST_WITH_BID_CAP',
          minimumRoasTarget: 2,
          targeting: {
            geoLocations: {
              countries: ['US'],
            },
            ageMin: 18,
            ageMax: 65,
            genders: [],
            devicePlatforms: [],
            publisherPlatforms: [],
            facebookPositions: [],
          },
          selectedVideoIds: [],
        });
        
        // Clear debug payload on success
        setDebugPayload('');
      } catch (error: any) {
        // Log and store the error for debugging
        console.error('API Error:', error);
        
        // Display a user-friendly error message
        const errorMessage = error.message || 'Unknown error';
        toast.error(`Error: ${errorMessage}`);
        
        // Capture detailed error information if available
        let detailedError: any = { error: errorMessage };
        
        // Check for detailed error information
        if (error.detail) {
          detailedError = error.detail;
        }
        
        // Store the full error details for display
        setApiResponse(JSON.stringify(detailedError, null, 2));
        setApiResponseVisible(true); // Always show error details
        
        // If the error contains specific field errors, highlight them
        if (errorMessage.includes('name')) {
          setFormErrors(prev => ({...prev, name: errorMessage}));
        }
      }
    } catch (error: any) {
      toast.error(`Error preparing payload: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Add a function to refresh campaign data
  const refreshCampaigns = async () => {
    try {
      console.log('Manually refreshing campaigns...');
      const campaignResponse = await facebookAdsApi.getCampaigns();
      console.log('Refreshed campaign data:', campaignResponse);
      
      if (campaignResponse && campaignResponse.length > 0) {
        const campaignOptions = campaignResponse.map(campaign => {
          const campaignId = campaign.id || '';
          const displayName = campaign.name || `Campaign ${campaignId}`;
          
          return {
            value: campaignId,
            label: displayName
          };
        });
        setCampaigns(campaignOptions);
        toast.success(`Found ${campaignOptions.length} campaigns`);
      } else {
        setCampaigns([]);
        toast.warning('No campaigns found. Please create a campaign first.');
      }
    } catch (error) {
      console.error('Error refreshing campaigns:', error);
      toast.error('Failed to load campaigns');
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header as="h5">
        Create Ad Set
        {process.env.NODE_ENV === 'development' && (
          <Button 
            variant="outline-secondary" 
            size="sm" 
            className="float-end"
            onClick={refreshCampaigns}
          >
            Refresh Campaigns
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
            {successMessage}
          </Alert>
        )}

        {process.env.NODE_ENV === 'development' && campaigns.length === 0 && (
          <Alert variant="warning">
            No campaigns found. You need to create a campaign before you can create an ad set.
          </Alert>
        )}

        <Alert variant="warning" className="mb-3">
          <strong>Important Facebook Ad Requirements:</strong>
          <ul className="mb-0 ps-3 mt-1">
            <li>Bid amount must be between 1 and 1000</li>
            <li>Ad sets with daily budget must be scheduled for at least 24 hours</li>
            <li>Your targeting should comply with Facebook's policies</li>
          </ul>
        </Alert>

        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Campaign</Form.Label>
                {campaigns.length > 0 ? (
                  <Select
                    options={campaigns}
                    value={campaigns.find(c => c.value === formData.campaignId)}
                    onChange={handleSelectChange('campaignId')}
                    isSearchable
                    placeholder="Select a campaign"
                    className={formErrors.campaignId ? "is-invalid" : ""}
                  />
                ) : (
                  <div className="mb-2">
                    <Select
                      isDisabled
                      placeholder="Loading campaigns..."
                    />
                    <small className="text-muted">
                      {submitting ? "Loading campaigns..." : "No campaigns found. Please create a campaign first."}
                    </small>
                  </div>
                )}
                {formErrors.campaignId && (
                  <div className="text-danger">{formErrors.campaignId}</div>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Ad Set Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!formErrors.name}
                />
                <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Select
                  options={[
                    { value: 'PAUSED', label: 'Paused' },
                    { value: 'ACTIVE', label: 'Active' },
                  ]}
                  value={{ value: formData.status, label: formData.status === 'PAUSED' ? 'Paused' : 'Active' }}
                  onChange={handleSelectChange('status')}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Daily Budget (₺)</Form.Label>
                <Form.Control
                  type="number"
                  name="dailyBudget"
                  value={formData.dailyBudget}
                  onChange={handleChange}
                  min={100}
                  isInvalid={!!formErrors.dailyBudget}
                />
                <Form.Control.Feedback type="invalid">{formErrors.dailyBudget}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Bid Amount (₺) *</Form.Label>
                <Form.Control
                  type="number"
                  name="bidAmount"
                  value={formData.bidAmount}
                  onChange={handleChange}
                  min={1}
                  max={1000}
                  isInvalid={!!formErrors.bidAmount}
                />
                <Form.Control.Feedback type="invalid">{formErrors.bidAmount}</Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Required for Facebook's bidding strategy. Must be between 1 and 1000 (Facebook's limit).
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Bid Strategy</Form.Label>
                <Select
                  options={bidStrategyOptions}
                  value={{ 
                    value: formData.bidStrategy, 
                    label: bidStrategyOptions.find(option => option.value === formData.bidStrategy)?.label || formData.bidStrategy 
                  }}
                  onChange={handleSelectChange('bidStrategy')}
                />
                <Form.Text className="text-muted">
                  Facebook's bidding strategy type. Required for ad set creation.
                </Form.Text>
              </Form.Group>

              {formData.optimizationGoal === 'VALUE' && (
                <Form.Group className="mb-3">
                  <Form.Label>Minimum ROAS Target</Form.Label>
                  <Form.Control
                    type="number"
                    name="minimumRoasTarget"
                    value={formData.minimumRoasTarget}
                    onChange={handleChange}
                    min={1}
                    max={10}
                    step={0.1}
                    isInvalid={!!formErrors.minimumRoasTarget}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.minimumRoasTarget}</Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Required when optimization goal is VALUE. Must be between 1 and 10.
                  </Form.Text>
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Billing Event</Form.Label>
                <Select
                  options={billingEvents}
                  value={billingEvents.find(b => b.value === formData.billingEvent)}
                  onChange={handleSelectChange('billingEvent')}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Optimization Goal</Form.Label>
                <Select
                  options={optimizationGoals}
                  value={optimizationGoals.find(o => o.value === formData.optimizationGoal)}
                  onChange={handleSelectChange('optimizationGoal')}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Start Date (Optional)</Form.Label>
                <div>
                  <DatePicker
                    selected={formData.startTime}
                    onChange={handleDateChange('startTime')}
                    showTimeSelect
                    dateFormat="yyyy-MM-dd HH:mm"
                    className="form-control"
                    placeholderText="Select start date"
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>End Date (Optional)</Form.Label>
                <div>
                  <DatePicker
                    selected={formData.stopTime}
                    onChange={handleDateChange('stopTime')}
                    showTimeSelect
                    dateFormat="yyyy-MM-dd HH:mm"
                    className={`form-control ${formErrors.stopTime ? 'is-invalid' : ''}`}
                    placeholderText="Select end date"
                    minDate={formData.startTime || new Date()}
                  />
                  {formErrors.stopTime && (
                    <div className="invalid-feedback d-block">{formErrors.stopTime}</div>
                  )}
                </div>
                <Form.Text className="text-muted">
                  If you specify both start and end dates, the campaign must run for at least 24 hours.
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Target Countries</Form.Label>
                <Select
                  options={countries}
                  isMulti
                  value={countries.filter(c => formData.targeting.geoLocations.countries.includes(c.value))}
                  onChange={handleTargetingChange('countries')}
                  className={formErrors.countries ? "is-invalid" : ""}
                />
                {formErrors.countries && (
                  <div className="text-danger">{formErrors.countries}</div>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Gender</Form.Label>
                <Select
                  options={genderOptions}
                  value={genderOptions.find(g => {
                    if (formData.targeting.genders.length === 0) return g.value === 0;
                    return formData.targeting.genders[0] === g.value;
                  })}
                  onChange={handleTargetingChange('genders')}
                />
              </Form.Group>

              <Row>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>Minimum Age</Form.Label>
                    <Form.Control
                      type="number"
                      name="ageMin"
                      value={formData.targeting.ageMin}
                      onChange={(e) => handleTargetingChange('ageMin')(e)}
                      min={13}
                      max={65}
                      isInvalid={!!formErrors.ageMin}
                    />
                    <Form.Control.Feedback type="invalid">{formErrors.ageMin}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group className="mb-3">
                    <Form.Label>Maximum Age</Form.Label>
                    <Form.Control
                      type="number"
                      name="ageMax"
                      value={formData.targeting.ageMax}
                      onChange={(e) => handleTargetingChange('ageMax')(e)}
                      min={13}
                      max={65}
                      isInvalid={!!formErrors.ageMax}
                    />
                    <Form.Control.Feedback type="invalid">{formErrors.ageMax}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Device Platforms</Form.Label>
                <Select
                  options={devicePlatformOptions}
                  isMulti
                  value={devicePlatformOptions.filter(o => 
                    formData.targeting.devicePlatforms.includes(o.value)
                  )}
                  onChange={handleTargetingChange('devicePlatforms')}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Publisher Platforms</Form.Label>
                <Select
                  options={publisherPlatformOptions}
                  isMulti
                  value={publisherPlatformOptions.filter(o => 
                    formData.targeting.publisherPlatforms.includes(o.value)
                  )}
                  onChange={handleTargetingChange('publisherPlatforms')}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Facebook Positions</Form.Label>
                <Select
                  options={facebookPositionOptions}
                  isMulti
                  value={facebookPositionOptions.filter(o => 
                    formData.targeting.facebookPositions.includes(o.value)
                  )}
                  onChange={handleTargetingChange('facebookPositions')}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Select Videos</Form.Label>
                {videos.length > 0 ? (
                  <Select
                    options={videos}
                    isMulti
                    value={videos.filter(v => formData.selectedVideoIds.includes(v.value))}
                    onChange={handleSelectChange('selectedVideoIds')}
                    formatOptionLabel={(option: VideoOption) => (
                      <div className="d-flex align-items-center">
                        {option.thumbnail && (
                          <img 
                            src={option.thumbnail} 
                            alt={option.label}
                            style={{ width: '40px', height: '40px', marginRight: '10px', objectFit: 'cover' }}
                          />
                        )}
                        <span>{option.label}</span>
                      </div>
                    )}
                  />
                ) : (
                  <div className="text-muted">Loading videos...</div>
                )}
              </Form.Group>
            </Col>
          </Row>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4">
              <h6>Debug Tools</h6>
              
              <div className="border rounded p-3 mb-3">
                <Form.Check 
                  type="checkbox"
                  id="show-payload"
                  label="Show API Payload"
                  checked={!!debugPayload}
                  onChange={() => setDebugPayload(debugPayload ? '' : JSON.stringify(preparePayload(), null, 2))}
                  className="mb-2"
                />
                
                {debugPayload && (
                  <div className="bg-light p-3 rounded mb-3">
                    <h6>API Payload Preview:</h6>
                    <pre style={{ maxHeight: '200px', overflowY: 'auto' }}>{debugPayload}</pre>
                  </div>
                )}
                
                <Form.Check 
                  type="checkbox"
                  id="show-response"
                  label="Show API Response/Error"
                  checked={apiResponseVisible}
                  onChange={() => setApiResponseVisible(!apiResponseVisible)}
                  className="mb-2"
                />
                
                {apiResponseVisible && apiResponse && (
                  <div className="bg-light p-3 rounded">
                    <h6>API Response/Error:</h6>
                    <pre style={{ maxHeight: '200px', overflowY: 'auto' }}>{apiResponse}</pre>
                    {apiResponse.includes('error_user_title') && (
                      <Alert variant="warning" className="mt-3">
                        <strong>Facebook API Error:</strong> 
                        <div className="mt-2">
                          <ul className="mb-0">
                            {JSON.parse(apiResponse).data?.error?.error_user_title && (
                              <li><strong>Error Type:</strong> {JSON.parse(apiResponse).data.error.error_user_title}</li>
                            )}
                            {JSON.parse(apiResponse).data?.error?.error_user_msg && (
                              <li><strong>Description:</strong> {JSON.parse(apiResponse).data.error.error_user_msg}</li>
                            )}
                            {JSON.parse(apiResponse).data?.error?.code && (
                              <li><strong>Error Code:</strong> {JSON.parse(apiResponse).data.error.code}</li>
                            )}
                            {JSON.parse(apiResponse).data?.error?.error_subcode && (
                              <li><strong>Error Subcode:</strong> {JSON.parse(apiResponse).data.error.error_subcode}</li>
                            )}
                          </ul>
                        </div>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="d-flex justify-content-end">
            <Button 
              variant="primary" 
              type="submit" 
              disabled={submitting}
              className="px-5"
            >
              {submitting ? 'Creating Ad Set...' : 'Create Ad Set'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default AdSetForm; 