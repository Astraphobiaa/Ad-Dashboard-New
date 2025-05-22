import React, { useState, useEffect } from 'react';
import { Button, Form, Alert, Card, Row, Col, Tabs, Tab, Badge, ToggleButton, ButtonGroup } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import * as facebookAdsApi from '../services/facebookAdsApi';
import { toast } from 'react-toastify';
import Select from 'react-select';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface FullCampaignFormProps {
  projectId: number;
}

// Reusing the VideoOption interface from other components
interface VideoOption {
  value: string;
  label: string;
  thumbnail?: string;
}

interface AdSetOption {
  value: string;
  label: string;
  campaignId: string;
}

const FullCampaignForm: React.FC<FullCampaignFormProps> = ({ projectId }) => {
  // Form mode: 'campaign' for full campaign creation, 'adset' for adding to existing ad set
  const [formMode, setFormMode] = useState<'campaign' | 'adset'>('campaign');
  
  // Form state for Campaign, AdSet and Ad combined
  const [formData, setFormData] = useState({
    // Campaign properties
    name: '',
    objective: 'OUTCOME_AWARENESS',
    status: 'PAUSED' as 'PAUSED' | 'ACTIVE',
    special_ad_categories: ['NONE'] as string[],
    spendCap: undefined as number | undefined,
    startTime: null as Date | null,
    stopTime: null as Date | null,
    buyingType: 'AUCTION' as 'AUCTION' | 'FIXED_CPM' | 'RESERVED',
    
    // AdSet properties
    adSetName: '', // Will be auto-populated based on campaign name
    dailyBudget: 1000,
    billingEvent: 'IMPRESSIONS' as 'IMPRESSIONS' | 'LINK_CLICKS',
    optimizationGoal: 'IMPRESSIONS',
    bidAmount: 100,
    bidStrategy: 'LOWEST_COST_WITH_BID_CAP' as 'LOWEST_COST_WITH_BID_CAP' | 'LOWEST_COST_WITHOUT_CAP' | 'COST_CAP',
    minimumRoasTarget: 2,
    targeting: {
      geoLocations: {
        countries: ['US'] as string[],
      },
      ageMin: 18,
      ageMax: 65,
      genders: [] as number[],
      devicePlatforms: [] as string[],
      publisherPlatforms: [] as string[],
      facebookPositions: [] as string[],
    },
    
    // Ad properties
    adName: '', // Will be auto-populated based on ad set name
    selectedVideoIds: [] as string[],
    
    // For adset mode
    selectedAdSetId: '' as string
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [videos, setVideos] = useState<VideoOption[]>([]);
  const [allAdSets, setAllAdSets] = useState<AdSetOption[]>([]);
  const [isLoadingAdSets, setIsLoadingAdSets] = useState(false);
  const [adSetSearchTerm, setAdSetSearchTerm] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('campaign');
  
  // Debug state
  const [debugPayload, setDebugPayload] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<string>('');
  const [apiResponseVisible, setApiResponseVisible] = useState<boolean>(false);

  // Load videos on component mount
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const videoResponse = await facebookAdsApi.getVideos();
        if (videoResponse.success && videoResponse.data) {
          const videoOptions = videoResponse.data.map(video => ({
            value: video.id,
            label: video.title || 'Untitled Video',
            thumbnail: video.thumbnailUrl
          }));
          setVideos(videoOptions);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
        toast.error('Failed to load video data.');
      }
    };

    fetchVideos();
  }, []);
  
  // Fetch ad sets for the adset mode
  useEffect(() => {
    if (formMode === 'adset') {
      const fetchAdSets = async () => {
        setIsLoadingAdSets(true);
        try {
          console.log('Fetching all ad sets...');
          const adSetsResponse = await facebookAdsApi.getAdSets();
          
          if (adSetsResponse && adSetsResponse.length > 0) {
            const adSetOptions = adSetsResponse.map(adSet => ({
              value: adSet.id,
              label: adSet.name || `Ad Set ${adSet.id}`,
              campaignId: adSet.campaignId
            }));
            
            console.log(`Found ${adSetOptions.length} ad sets`);
            setAllAdSets(adSetOptions);
          } else {
            console.log('No ad sets found');
            setAllAdSets([]);
            toast.warning('No ad sets found. You need to create a campaign and ad set first.');
          }
        } catch (error) {
          console.error('Error fetching ad sets:', error);
          toast.error('Failed to load ad sets.');
        } finally {
          setIsLoadingAdSets(false);
        }
      };
      
      fetchAdSets();
    }
  }, [formMode]);

  // Objectives & Optimization Goals according to Facebook Graph API
  const objectives = [
    { value: 'OUTCOME_TRAFFIC', label: 'Traffic (Link Clicks)' },
    { value: 'OUTCOME_ENGAGEMENT', label: 'Engagement' },
    { value: 'OUTCOME_AWARENESS', label: 'Awareness' },
    { value: 'OUTCOME_LEADS', label: 'Leads' },
    { value: 'OUTCOME_SALES', label: 'Sales (Conversions)' },
    { value: 'OUTCOME_APP_PROMOTION', label: 'App Promotion' }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      // Auto-populate AdSet name and Ad name when campaign name changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        adSetName: value ? `${value} Ad Set` : '',
        adName: value ? `${value} Ad` : ''
      }));
    } else if (name === 'adSetName') {
      // Auto-populate Ad name when ad set name changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        adName: value ? `${value} Ad` : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (name: string) => (option: any) => {
    if (Array.isArray(option)) {
      // For multi-select
      setFormData(prev => ({
        ...prev,
        [name]: option.map(item => item.value)
      }));
    } else {
      // For single select
      setFormData(prev => ({
        ...prev,
        [name]: option.value
      }));
    }
  };

  const handleDateChange = (name: string) => (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  // Handle targeting changes
  const handleTargetingChange = (field: string) => (option: any) => {
    if (field === 'countries') {
      // For countries in geoLocations
      setFormData(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          geoLocations: {
            ...prev.targeting.geoLocations,
            countries: Array.isArray(option) ? option.map(o => o.value) : []
          }
        }
      }));
    } else if (field === 'genders') {
      // For gender selection
      setFormData(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          genders: Array.isArray(option) ? option.map(o => o.value) : []
        }
      }));
    } else if (field === 'devicePlatforms') {
      // For device platforms
      setFormData(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          devicePlatforms: Array.isArray(option) ? option.map(o => o.value) : []
        }
      }));
    } else if (field === 'publisherPlatforms') {
      // For publisher platforms
      setFormData(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          publisherPlatforms: Array.isArray(option) ? option.map(o => o.value) : []
        }
      }));
    } else if (field === 'facebookPositions') {
      // For Facebook positions
      setFormData(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          facebookPositions: Array.isArray(option) ? option.map(o => o.value) : []
        }
      }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'ageMin' || name === 'ageMax') {
      // Handle age fields which are nested in targeting
      setFormData(prev => ({
        ...prev,
        targeting: {
          ...prev.targeting,
          [name]: parseInt(value) || 0
        }
      }));
    } else {
      // Handle other number fields
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    }
  };

  const handleModeChange = (mode: 'campaign' | 'adset') => {
    setFormMode(mode);
    if (mode === 'adset') {
      // When switching to adset mode, focus on the ad tab
      setActiveTab('ad');
    } else {
      // When switching back to campaign mode, focus on the campaign tab
      setActiveTab('campaign');
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    
    // Different validations based on mode
    if (formMode === 'campaign') {
      // Campaign validations
      if (!formData.name) errors.name = 'Campaign name is required';
      if (!formData.objective) errors.objective = 'Objective is required';
      
      // Date validation
      if (formData.startTime && formData.stopTime && formData.startTime > formData.stopTime) {
        errors.stopTime = 'End date must be after start date';
      }
      
      // AdSet validations
      if (!formData.adSetName) errors.adSetName = 'Ad Set name is required';
      if (!formData.dailyBudget || formData.dailyBudget < 100) {
        errors.dailyBudget = 'Daily budget must be at least 100';
      }
      
      // Targeting validation
      if (formData.targeting.geoLocations.countries.length === 0) {
        errors.countries = 'At least one country must be selected';
      }
    } else {
      // AdSet mode validations
      if (!formData.selectedAdSetId) {
        errors.selectedAdSetId = 'Please select an Ad Set';
      }
    }
    
    // Common validations for both modes
    if (!formData.adName) errors.adName = 'Ad name is required';
    if (formData.selectedVideoIds.length === 0) {
      errors.selectedVideoIds = 'At least one video must be selected';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const preparePayload = () => {
    // If we're in adset mode, prepare payload for creating ads on an existing adset
    if (formMode === 'adset') {
      return {
        projectId: projectId,
        name: formData.adName,
        videoIds: formData.selectedVideoIds,
        status: formData.status
      };
    }
    
    // Otherwise, prepare the full campaign creation payload
    return {
      // Campaign properties
      name: formData.name,
      objective: formData.objective,
      status: formData.status,
      special_ad_categories: formData.special_ad_categories,
      spendCap: formData.spendCap,
      startTime: formData.startTime ? formData.startTime.toISOString() : undefined,
      stopTime: formData.stopTime ? formData.stopTime.toISOString() : undefined,
      buyingType: formData.buyingType,
      
      // AdSet properties
      adSetName: formData.adSetName,
      dailyBudget: formData.dailyBudget,
      billingEvent: formData.billingEvent,
      optimizationGoal: formData.optimizationGoal,
      bidAmount: formData.bidAmount,
      bidStrategy: formData.bidStrategy,
      minimumRoasTarget: formData.minimumRoasTarget,
      targeting: {
        geoLocations: {
          countries: formData.targeting.geoLocations.countries,
        },
        ageMin: formData.targeting.ageMin,
        ageMax: formData.targeting.ageMax,
        genders: formData.targeting.genders,
        devicePlatforms: formData.targeting.devicePlatforms,
        publisherPlatforms: formData.targeting.publisherPlatforms,
        facebookPositions: formData.targeting.facebookPositions,
      },
      
      // Ad properties
      adName: formData.adName,
      selectedVideoIds: formData.selectedVideoIds
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');
    setApiResponse('');
    setApiResponseVisible(false);

    try {
      if (formMode === 'adset') {
        // Creating ads for an existing ad set
        console.log(`Creating ads for existing Ad Set ${formData.selectedAdSetId}`);
        
        // Prepare payload for creating ads on an existing ad set
        const adSetPayload = {
          projectId: projectId,
          name: formData.adName,
          videoIds: formData.selectedVideoIds,
          status: formData.status
        };
        
        // Set debug payload for display
        setDebugPayload(JSON.stringify(adSetPayload, null, 2));
        
        try {
          // Submit to API
          const response = await facebookAdsApi.createAdsForAdSet(
            formData.selectedAdSetId,
            adSetPayload
          );
          
          // Save the response for debugging
          setApiResponse(JSON.stringify(response, null, 2));
          
          // Show success message
          const successMsg = `Successfully created ${response.adIds.length} ad(s) for the existing Ad Set!`;
          
          setSuccessMessage(successMsg);
          toast.success('Ads successfully created!');
          
          // Reset form partially - keep the selected ad set but clear other ad-specific fields
          setFormData(prev => ({
            ...prev,
            adName: '',
            selectedVideoIds: []
          }));
        } catch (error: any) {
          // Display the error message from the API
          const errorMessage = error.message || 'Unknown error occurred';
          console.error('Ad creation error:', error);
          toast.error(`Error: ${errorMessage}`);
          
          // Store the full error details for display
          setApiResponse(JSON.stringify(error, null, 2));
          setApiResponseVisible(true); // Show error details
        }
      } else {
        // Creating a full campaign
        // Prepare payload for full campaign creation
        const campaignPayload = preparePayload();
        
        // Set debug payload for display
        setDebugPayload(JSON.stringify(campaignPayload, null, 2));
        
        console.log('Creating campaign with full payload:', campaignPayload);
        
        try {
          // Submit to API
          const response = await facebookAdsApi.createCampaign(campaignPayload);
          
          // Save the response for debugging
          setApiResponse(JSON.stringify(response, null, 2));
          
          // Show success message
          let successMsg = `Campaign successfully created! Campaign ID: ${response.campaignId}`;
          
          if (response.adSetId) {
            successMsg += `, Ad Set ID: ${response.adSetId}`;
          }
          
          if (response.adIds && response.adIds.length > 0) {
            successMsg += `, with ${response.adIds.length} ads created`;
          }
          
          setSuccessMessage(successMsg);
          toast.success('Ad successfully created!');
          
          // Reset form
          setFormData({
            name: '',
            objective: 'OUTCOME_AWARENESS',
            status: 'PAUSED',
            special_ad_categories: ['NONE'],
            spendCap: undefined,
            startTime: null,
            stopTime: null,
            buyingType: 'AUCTION',
            adSetName: '',
            dailyBudget: 1000,
            billingEvent: 'IMPRESSIONS',
            optimizationGoal: 'IMPRESSIONS',
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
            adName: '',
            selectedVideoIds: [],
            selectedAdSetId: ''
          });
        } catch (error: any) {
          // Display the error message from the API
          const errorMessage = error.message || 'Unknown error occurred';
          console.error('Campaign creation error:', error);
          toast.error(`Error: ${errorMessage}`);
          
          // Store the full error details for display
          setApiResponse(JSON.stringify(error, null, 2));
          setApiResponseVisible(true); // Show error details
        }
      }
    } catch (error: any) {
      toast.error(`Error preparing payload: ${error.message || 'Unknown error'}`);
      setApiResponse(JSON.stringify(error, null, 2));
      setApiResponseVisible(true);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Filter ad sets based on search term
  const filteredAdSets = allAdSets.filter(adSet =>
    adSet.label.toLowerCase().includes(adSetSearchTerm.toLowerCase())
  );

  return (
    <Card className="mb-4">
      <Card.Header as="h5">Create Ad</Card.Header>
      <Card.Body>
        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
            {successMessage}
          </Alert>
        )}

        <Alert variant="info" className="mb-3">
          <strong>Create Ad:</strong> Select whether you want to create a new campaign or add ads to an existing ad set.
        </Alert>

        {/* Mode toggle */}
        <div className="mb-4 text-center">
          <ButtonGroup>
            <ToggleButton
              id="radio-campaign"
              type="radio"
              variant={formMode === 'campaign' ? 'primary' : 'outline-primary'}
              name="formMode"
              value="campaign"
              checked={formMode === 'campaign'}
              onChange={() => handleModeChange('campaign')}
            >
              Create New Campaign
            </ToggleButton>
            <ToggleButton
              id="radio-adset"
              type="radio"
              variant={formMode === 'adset' ? 'primary' : 'outline-primary'}
              name="formMode"
              value="adset"
              checked={formMode === 'adset'}
              onChange={() => handleModeChange('adset')}
            >
              Add to Existing AdSet
            </ToggleButton>
          </ButtonGroup>
        </div>

        {formMode === 'campaign' ? (
          // Campaign mode - show tabs for the different sections
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'campaign')}
            className="mb-3"
          >
            <Tab 
              eventKey="campaign" 
              title={
                <span>
                  Campaign {formErrors.name || formErrors.objective || formErrors.stopTime ? 
                    <Badge bg="danger" className="ms-1">!</Badge> : ''}
                </span>
              }
            >
              <Form>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Campaign Name*</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        isInvalid={!!formErrors.name}
                        disabled={submitting}
                      />
                      <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Campaign Objective*</Form.Label>
                      <Select
                        options={objectives}
                        value={objectives.find(o => o.value === formData.objective)}
                        onChange={handleSelectChange('objective')}
                        isDisabled={submitting}
                        className={formErrors.objective ? "is-invalid" : ""}
                      />
                      {formErrors.objective && (
                        <div className="text-danger">{formErrors.objective}</div>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Buying Type*</Form.Label>
                      <Select
                        options={[
                          { value: 'AUCTION', label: 'Auction' },
                          { value: 'FIXED_CPM', label: 'Fixed CPM (Reach & Frequency)' },
                        ]}
                        value={{ value: formData.buyingType, label: formData.buyingType === 'AUCTION' ? 'Auction' : 'Fixed CPM (Reach & Frequency)' }}
                        onChange={handleSelectChange('buyingType')}
                        isDisabled={submitting}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
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
                          disabled={submitting}
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
                          disabled={submitting}
                        />
                        {formErrors.stopTime && (
                          <div className="invalid-feedback d-block">{formErrors.stopTime}</div>
                        )}
                      </div>
                      <Form.Text className="text-muted">
                        Must be at least 24 hours after start time
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end">
                  <Button variant="primary" onClick={() => setActiveTab('adset')}>
                    Next: Ad Set Details
                  </Button>
                </div>
              </Form>
            </Tab>
            
            <Tab 
              eventKey="adset" 
              title={
                <span>
                  Ad Set {formErrors.adSetName || formErrors.dailyBudget || formErrors.countries ? 
                    <Badge bg="danger" className="ms-1">!</Badge> : ''}
                </span>
              }
            >
              <Form>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ad Set Name*</Form.Label>
                      <Form.Control
                        type="text"
                        name="adSetName"
                        value={formData.adSetName}
                        onChange={handleChange}
                        isInvalid={!!formErrors.adSetName}
                        disabled={submitting}
                      />
                      <Form.Control.Feedback type="invalid">{formErrors.adSetName}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Daily Budget* (USD)</Form.Label>
                      <Form.Control
                        type="number"
                        name="dailyBudget"
                        value={formData.dailyBudget}
                        onChange={handleNumberChange}
                        isInvalid={!!formErrors.dailyBudget}
                        disabled={submitting}
                        min={100}
                      />
                      <Form.Control.Feedback type="invalid">{formErrors.dailyBudget}</Form.Control.Feedback>
                      <Form.Text className="text-muted">Minimum 100 USD (will be converted to cents)</Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Optimization Goal</Form.Label>
                      <Select
                        options={optimizationGoals}
                        value={optimizationGoals.find(o => o.value === formData.optimizationGoal)}
                        onChange={handleSelectChange('optimizationGoal')}
                        isDisabled={submitting}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Bid Amount (USD)</Form.Label>
                      <Form.Control
                        type="number"
                        name="bidAmount"
                        value={formData.bidAmount}
                        onChange={handleNumberChange}
                        isInvalid={!!formErrors.bidAmount}
                        disabled={submitting}
                        min={1}
                        max={1000}
                      />
                      <Form.Control.Feedback type="invalid">{formErrors.bidAmount}</Form.Control.Feedback>
                      <Form.Text className="text-muted">Between 1 and 1000 USD</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Targeting: Countries</Form.Label>
                      <Select
                        options={countries}
                        value={countries.filter(c => formData.targeting.geoLocations.countries.includes(c.value))}
                        onChange={handleTargetingChange('countries')}
                        isMulti
                        isDisabled={submitting}
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Age Min</Form.Label>
                          <Form.Control
                            type="number"
                            name="ageMin"
                            value={formData.targeting.ageMin}
                            onChange={handleNumberChange}
                            disabled={submitting}
                            min={13}
                            max={65}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Age Max</Form.Label>
                          <Form.Control
                            type="number"
                            name="ageMax"
                            value={formData.targeting.ageMax}
                            onChange={handleNumberChange}
                            disabled={submitting}
                            min={13}
                            max={65}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>
                </Row>
                <div className="d-flex justify-content-between">
                  <Button variant="secondary" onClick={() => setActiveTab('campaign')}>
                    Back: Campaign Details
                  </Button>
                  <Button variant="primary" onClick={() => setActiveTab('ad')}>
                    Next: Ad Creation
                  </Button>
                </div>
              </Form>
            </Tab>
            
            <Tab 
              eventKey="ad" 
              title={
                <span>
                  Ads {formErrors.adName || formErrors.selectedVideoIds ? 
                    <Badge bg="danger" className="ms-1">!</Badge> : ''}
                </span>
              }
            >
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ad Name*</Form.Label>
                      <Form.Control
                        type="text"
                        name="adName"
                        value={formData.adName}
                        onChange={handleChange}
                        isInvalid={!!formErrors.adName}
                        disabled={submitting}
                      />
                      <Form.Control.Feedback type="invalid">{formErrors.adName}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Select Videos* {formErrors.selectedVideoIds && <span className="text-danger">({formErrors.selectedVideoIds})</span>}</Form.Label>
                  <Select
                    options={videos}
                    value={videos.filter(v => formData.selectedVideoIds.includes(v.value))}
                    onChange={handleSelectChange('selectedVideoIds')}
                    isMulti
                    isDisabled={submitting || videos.length === 0}
                    className={formErrors.selectedVideoIds ? "is-invalid" : ""}
                  />
                  {videos.length === 0 && (
                    <Alert variant="warning" className="mt-2">
                      No videos available. Please upload videos first.
                    </Alert>
                  )}
                </Form.Group>

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
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="d-flex justify-content-between mt-4">
                  <Button 
                    variant="secondary" 
                    onClick={() => setActiveTab('adset')}
                    disabled={submitting}
                  >
                    Back: Ad Set Details
                  </Button>
                  
                  <Button 
                    variant="success" 
                    type="submit" 
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Create Ad'}
                  </Button>
                </div>
              </Form>
            </Tab>
          </Tabs>
        ) : (
          // AdSet mode - simplified form for creating ads for an existing AdSet
          <div>
            {/* AdSet selector */}
            <Form.Group className="mb-4">
              <Form.Label>Select AdSet*</Form.Label>
              <Form.Control
                type="text"
                placeholder="Search AdSets..."
                value={adSetSearchTerm}
                onChange={(e) => setAdSetSearchTerm(e.target.value)}
                className="mb-2"
              />
              
              {isLoadingAdSets ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading AdSets...</p>
                </div>
              ) : filteredAdSets.length === 0 ? (
                <Alert variant="warning">
                  No AdSets found. Please create a campaign and AdSet first.
                </Alert>
              ) : (
                <Form.Select
                  value={formData.selectedAdSetId}
                  onChange={(e) => {
                    const adSetId = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      selectedAdSetId: adSetId,
                      // Auto-generate ad name based on selected AdSet
                      adName: adSetId ? `Ad for ${allAdSets.find(as => as.value === adSetId)?.label || 'AdSet'}` : ''
                    }));
                  }}
                  isInvalid={!!formErrors.selectedAdSetId}
                >
                  <option value="">Select an AdSet</option>
                  {filteredAdSets.map(adSet => (
                    <option key={adSet.value} value={adSet.value}>
                      {adSet.label}
                    </option>
                  ))}
                </Form.Select>
              )}
              <Form.Control.Feedback type="invalid">{formErrors.selectedAdSetId}</Form.Control.Feedback>
            </Form.Group>
            
            {/* Ad Name */}
            <Form.Group className="mb-3">
              <Form.Label>Ad Name*</Form.Label>
              <Form.Control
                type="text"
                name="adName"
                value={formData.adName}
                onChange={handleChange}
                isInvalid={!!formErrors.adName}
                disabled={submitting}
              />
              <Form.Control.Feedback type="invalid">{formErrors.adName}</Form.Control.Feedback>
            </Form.Group>
            
            {/* Video Selection */}
            <Form.Group className="mb-3">
              <Form.Label>Select Videos*</Form.Label>
              <Select
                isMulti
                options={videos}
                value={videos.filter(v => formData.selectedVideoIds.includes(v.value))}
                onChange={handleSelectChange('selectedVideoIds')}
                isDisabled={submitting}
                className={formErrors.selectedVideoIds ? "is-invalid" : ""}
                placeholder="Select videos for your ad..."
              />
              {formErrors.selectedVideoIds && (
                <div className="text-danger">{formErrors.selectedVideoIds}</div>
              )}
            </Form.Group>
            
            {/* Status */}
            <Form.Group className="mb-4">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  status: e.target.value as 'PAUSED' | 'ACTIVE' 
                }))}
                disabled={submitting}
              >
                <option value="PAUSED">Paused</option>
                <option value="ACTIVE">Active</option>
              </Form.Select>
            </Form.Group>
          </div>
        )}

        {/* Submit button - same for both modes */}
        <div className="d-grid gap-2 mt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : formMode === 'campaign' ? 'Create Campaign, AdSet & Ad' : 'Create Ads for AdSet'}
          </Button>
        </div>

        {debugPayload && (
          <Card className="mt-4">
            <Card.Header>
              <Button
                variant="link"
                onClick={() => setApiResponseVisible(!apiResponseVisible)}
                className="p-0"
              >
                {apiResponseVisible ? 'Hide' : 'Show'} Technical Details
              </Button>
            </Card.Header>
            {apiResponseVisible && (
              <Card.Body>
                <h6>Request Payload:</h6>
                <pre className="border p-2 bg-light">{debugPayload}</pre>
                
                {apiResponse && (
                  <>
                    <h6 className="mt-3">API Response:</h6>
                    <pre className="border p-2 bg-light">{apiResponse}</pre>
                  </>
                )}
              </Card.Body>
            )}
          </Card>
        )}
      </Card.Body>
    </Card>
  );
};

export default FullCampaignForm; 