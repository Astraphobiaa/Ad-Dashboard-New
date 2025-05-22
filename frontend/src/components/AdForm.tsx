import React, { useState, useEffect } from 'react';
import { Button, Form, Alert, Card, Row, Col } from 'react-bootstrap';
import * as facebookAdsApi from '../services/facebookAdsApi';
import { toast } from 'react-toastify';
import Select from 'react-select';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useParams } from 'react-router-dom';

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

interface CampaignOption {
  value: string;
  label: string;
}

interface AdFormProps {
  projectId: number;
  preSelectedAdSetId?: string; // Optional: Selected ad set ID if coming from ad set page
}

const AdForm: React.FC<AdFormProps> = ({ projectId, preSelectedAdSetId }) => {
  // Get adSetId from URL params if available
  const { adSetId: urlAdSetId } = useParams<{ adSetId: string }>();
  
  // Form state
  const [formData, setFormData] = useState({
    campaignId: '',
    adSetId: urlAdSetId || preSelectedAdSetId || '',
    name: '',
    status: 'PAUSED' as 'PAUSED' | 'ACTIVE',
    selectedVideoIds: [] as string[],
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [videos, setVideos] = useState<VideoOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [filteredAdSets, setFilteredAdSets] = useState<AdSetOption[]>([]);
  const [isLoadingAdSets, setIsLoadingAdSets] = useState(false);

  // Debug state
  const [debugPayload, setDebugPayload] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<string>('');
  const [apiResponseVisible, setApiResponseVisible] = useState<boolean>(false);

  // Initial data loading
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
        const campaignsResponse = await facebookAdsApi.getCampaigns();
        console.log('Campaigns response:', campaignsResponse);
        
        if (campaignsResponse && campaignsResponse.length > 0) {
          const campaignOptions = campaignsResponse.map(campaign => ({
            value: campaign.id,
            label: campaign.name || `Campaign ${campaign.id}`
          }));
          console.log('Campaign options created:', campaignOptions);
          setCampaigns(campaignOptions);
          
          // If there's only one campaign, select it automatically
          if (campaignOptions.length === 1 && !formData.campaignId) {
            const singleCampaignId = campaignOptions[0].value;
            console.log(`Auto-selecting single campaign: ${singleCampaignId}`);
            
            setFormData(prev => ({
              ...prev,
              campaignId: singleCampaignId
            }));
            
            // Since we're auto-selecting, also fetch its ad sets
            try {
              console.log(`Pre-fetching ad sets for auto-selected campaign ${singleCampaignId}...`);
              const adSetsResponse = await facebookAdsApi.getAdSets(singleCampaignId);
              if (adSetsResponse && adSetsResponse.length > 0) {
                console.log(`Found ${adSetsResponse.length} ad sets for auto-selected campaign`);
              }
            } catch (adSetsError) {
              console.error('Error pre-fetching ad sets:', adSetsError);
            }
          }
        } else {
          console.log('No campaigns found or empty response');
          setCampaigns([]);
        }
        
        // If we have a pre-selected ad set ID, fetch its details to select the right campaign
        if (urlAdSetId || preSelectedAdSetId) {
          const selectedAdSetId = urlAdSetId || preSelectedAdSetId;
          console.log(`Pre-selected ad set ID: ${selectedAdSetId}`);
          
          console.log('Fetching all ad sets to find the pre-selected ad set\'s campaign...');
          const allAdSetsResponse = await facebookAdsApi.getAdSets();
          
          if (allAdSetsResponse && allAdSetsResponse.length > 0) {
            const selectedAdSet = allAdSetsResponse.find(as => as.id === selectedAdSetId);
            
            if (selectedAdSet) {
              console.log(`Found pre-selected ad set's campaign: ${selectedAdSet.campaignId}`);
              setFormData(prev => ({
                ...prev,
                campaignId: selectedAdSet.campaignId
              }));
              
              // Wait a moment for the state to update before continuing
              setTimeout(() => {
                console.log(`Campaign set to ${selectedAdSet.campaignId} for pre-selected ad set`);
              }, 100);
            } else {
              console.warn(`Pre-selected ad set ${selectedAdSetId} not found in ad sets response`);
            }
          } else {
            console.warn('No ad sets found in response while looking for pre-selected ad set');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data. Please refresh the page.');
      }
    };

    fetchData();
  }, [preSelectedAdSetId, urlAdSetId, formData.campaignId]);

  // Fetch ad sets when campaign changes
  useEffect(() => {
    if (!formData.campaignId) {
      console.log('No campaign selected, clearing ad sets list');
      setFilteredAdSets([]);
      return;
    }
    
    const fetchAdSetsForCampaign = async () => {
      setIsLoadingAdSets(true);
      try {
        console.log(`Fetching ad sets for campaign ${formData.campaignId}...`);
        const adSetsResponse = await facebookAdsApi.getAdSets(formData.campaignId);
        console.log('Ad sets response:', adSetsResponse);
        
        if (adSetsResponse && adSetsResponse.length > 0) {
          const adSetOptions = adSetsResponse.map(adSet => ({
            value: adSet.id,
            label: adSet.name || `Ad Set ${adSet.id}`,
            campaignId: adSet.campaignId
          }));
          
          console.log(`Found ${adSetOptions.length} ad sets for campaign ${formData.campaignId}`);
          setFilteredAdSets(adSetOptions);
          
          // If no ad set is selected or the current selection doesn't belong to this campaign,
          // automatically select the first ad set
          const currentAdSetInCampaign = adSetOptions.some(as => as.value === formData.adSetId);
          if (!currentAdSetInCampaign && adSetOptions.length > 0) {
            const firstAdSetId = adSetOptions[0].value;
            console.log(`Auto-selecting first ad set: ${firstAdSetId}`);
            
            setFormData(prev => ({
              ...prev,
              adSetId: firstAdSetId
            }));
          }
        } else {
          console.log(`No ad sets found for campaign ${formData.campaignId}`);
          setFilteredAdSets([]);
          setFormData(prev => ({
            ...prev,
            adSetId: ''
          }));
          toast.warning(`No ad sets found for this campaign. Please create an ad set first.`);
        }
      } catch (error) {
        console.error(`Error fetching ad sets for campaign ${formData.campaignId}:`, error);
        toast.error('Failed to load ad sets for this campaign.');
        setFilteredAdSets([]);
      } finally {
        setIsLoadingAdSets(false);
      }
    };
    
    fetchAdSetsForCampaign();
  }, [formData.campaignId, formData.adSetId]);

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

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.campaignId) {
      errors.campaignId = 'Campaign is required';
    }

    if (!formData.adSetId) {
      errors.adSetId = 'Ad Set is required';
    }

    if (!formData.name.trim()) {
      errors.name = 'Ad name is required';
    } else if (formData.name.length < 3) {
      errors.name = 'Ad name must be at least 3 characters';
    }

    if (formData.selectedVideoIds.length === 0) {
      errors.selectedVideoIds = 'At least one video must be selected';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const preparePayload = () => {
    return {
      projectId,
      videoIds: formData.selectedVideoIds,
      name: formData.name.trim(),
      status: formData.status
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    // Add more detailed logging about the selected Ad Set ID
    console.log(`Selected AdSet ID: "${formData.adSetId}"`);
    console.log(`AdSet Options:`, filteredAdSets);
    const selectedAdSet = filteredAdSets.find(as => as.value === formData.adSetId);
    console.log(`Selected AdSet Details:`, selectedAdSet);

    setSubmitting(true);
    setSuccessMessage('');
    setApiResponse('');
    setApiResponseVisible(false);

    try {
      // Prepare the payload
      const payload = preparePayload();
      
      // Set debug payload for display
      setDebugPayload(JSON.stringify(payload, null, 2));
      
      console.log(`Creating ads for Ad Set ${formData.adSetId} with payload:`, payload);
      
      if (!formData.adSetId) {
        throw new Error('No Ad Set selected. Please select an Ad Set before creating ads.');
      }
      
      try {
        // Submit to API
        const response = await facebookAdsApi.createAdsForAdSet(formData.adSetId, payload);
        
        console.log('Create ads response:', response);
        
        if (!response || !response.adIds) {
          throw new Error('Invalid response from server');
        }
        
        const adCount = response.adIds.length;
        setSuccessMessage(`${adCount} ad${adCount !== 1 ? 's' : ''} successfully created!`);
        toast.success(`${adCount} ad${adCount !== 1 ? 's' : ''} successfully created!`);
        
        // Save the response for debugging
        setApiResponse(JSON.stringify(response, null, 2));
        
        // Reset selected videos after successful creation
        setFormData(prev => ({
          ...prev,
          selectedVideoIds: []
        }));
        
      } catch (error: any) {
        // Log and store the error for debugging
        console.error('API Error:', error);
        
        // Display a user-friendly error message
        const errorMessage = error.message || 'Unknown error';
        toast.error(`Error: ${errorMessage}`);
        
        // If the error has a raw response, include it in the debug info
        const errorDetail = error.rawResponse ? JSON.stringify(error.rawResponse, null, 2) : JSON.stringify(error, null, 2);
        setApiResponse(errorDetail);
        setApiResponseVisible(true); // Always show error details
      }
    } catch (error: any) {
      console.error('Error preparing payload:', error);
      toast.error(`Error preparing payload: ${error.message || 'Unknown error'}`);
      setApiResponse(JSON.stringify(error, null, 2));
      setApiResponseVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header as="h5">Create Ads for Ad Set</Card.Header>
      <Card.Body>
        <div className="mb-3">
          <p className="text-muted">
            Follow the Facebook Ads hierarchy: <strong>Campaign &gt; Ad Set &gt; Ad</strong>. 
            First select a Campaign, then choose an Ad Set within that Campaign, and finally create Ads in the selected Ad Set.
          </p>
        </div>
        
        {successMessage && (
          <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
            {successMessage}
          </Alert>
        )}

        {campaigns.length === 0 && (
          <Alert variant="warning">
            No campaigns found. Please create a campaign before creating ads.
          </Alert>
        )}

        {campaigns.length > 0 && filteredAdSets.length === 0 && formData.campaignId && !isLoadingAdSets && (
          <Alert variant="warning">
            No ad sets found for this campaign. Please create an ad set before creating ads.
          </Alert>
        )}

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
                    isDisabled={submitting}
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
                <Form.Label>Ad Set</Form.Label>
                {isLoadingAdSets ? (
                  <div className="mb-2">
                    <Select
                      isDisabled
                      placeholder="Loading ad sets..."
                    />
                    <small className="text-muted d-flex align-items-center mt-1">
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Loading ad sets for the selected campaign...
                    </small>
                  </div>
                ) : filteredAdSets.length > 0 ? (
                  <Select
                    options={filteredAdSets}
                    value={filteredAdSets.find(a => a.value === formData.adSetId)}
                    onChange={handleSelectChange('adSetId')}
                    isSearchable
                    placeholder="Select an ad set"
                    className={formErrors.adSetId ? "is-invalid" : ""}
                    isDisabled={!formData.campaignId || !!preSelectedAdSetId || submitting || isLoadingAdSets}
                  />
                ) : (
                  <div className="mb-2">
                    <Select
                      isDisabled
                      placeholder={
                        formData.campaignId 
                          ? "No ad sets for this campaign" 
                          : "First select a campaign"
                      }
                    />
                    <small className="text-muted">
                      {!formData.campaignId 
                        ? "Please select a campaign first" 
                        : submitting 
                          ? "Loading ad sets..." 
                          : "No ad sets found for this campaign. Please create an ad set first."}
                    </small>
                  </div>
                )}
                {formErrors.adSetId && (
                  <div className="text-danger">{formErrors.adSetId}</div>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Ad Name Prefix</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!formErrors.name}
                  disabled={submitting}
                />
                <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
                <Form.Text className="text-muted">
                  This will be used as a prefix for all created ads. Each ad will be named "[Prefix] - [Video Name]"
                </Form.Text>
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
                  isDisabled={submitting}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
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
                    className={formErrors.selectedVideoIds ? "is-invalid" : ""}
                    isDisabled={submitting}
                  />
                ) : (
                  <div className="text-muted">Loading videos...</div>
                )}
                {formErrors.selectedVideoIds && (
                  <div className="text-danger">{formErrors.selectedVideoIds}</div>
                )}
                <Form.Text className="text-muted">
                  Select one or more videos to create ads. One ad will be created for each selected video.
                </Form.Text>
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
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="d-flex justify-content-end">
            <Button 
              variant="primary" 
              type="submit" 
              disabled={submitting || !formData.campaignId || !formData.adSetId || filteredAdSets.length === 0}
              className="px-5"
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating Ads...
                </>
              ) : (
                <>Create Ads in Selected Ad Set</>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default AdForm; 