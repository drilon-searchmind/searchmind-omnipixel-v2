# Tagstack API Integration Plan

## API Response Structure

The Tagstack API returns data in the following format:

```json
{
  "success": true,
  "url": "GTM-WZT55FSK",
  "message": "{...JSON string with container data...}"
}
```

The `message` field contains a JSON string with container information:

### GTM Container Data
```json
{
  "GTM-WZT55FSK": {
    "entityType": "GTM Container",
    "cmp": false,                    // CMP detection (boolean or null)
    "consentMode": true,             // Consent Mode V2 enabled
    "consentDefault": {              // Default consent settings
      "functionality_storage": "__jsm",
      "ad_storage": "__jsm",
      "ad_user_data": "__jsm",
      "personalization_storage": "__jsm",
      "analytics_storage": "__jsm",
      "ad_personalization": "__jsm"
    },
    "variables": [...],              // Array of GTM variables
    "tags": [...],                   // Array of GTM tags (includes paused status)
    "triggers": [...]                // Array of GTM triggers
  }
}
```

### GA4 Stream Data
```json
{
  "G-XXXXXXXXXX": {
    "entityType": "GA4 Stream",
    "enhancedMeasurement": [...],    // Enhanced measurement events
    "linking": [...]                 // Linked integrations (e.g., Google Ads)
  }
}
```

## Key Data Points for Integration

### 1. Consent Mode V2 Status
- **Field**: `consentMode` (boolean)
- **Use**: Replace mock data in `ScoreOverview` component
- **Location**: `results.consentModeV2`

### 2. CMP Detection
- **Field**: `cmp` (boolean or null)
- **Use**: Enhance cookie detection results
- **Location**: `results.cookieInfo.cmp` or `results.tagstackInfo.cmp`

### 3. GTM Container Analysis
- **Tags**: Count active vs paused tags
- **Variables**: Total count
- **Triggers**: Total count
- **Use**: Enhance `GTMAnalysis` component with detailed statistics
- **Location**: `results.tagstackInfo.gtmContainers`

### 4. GA4 Streams
- **Enhanced Measurement**: List of enabled events
- **Linking**: Connected integrations
- **Use**: Show GA4 configuration details
- **Location**: `results.tagstackInfo.ga4Streams`

### 5. Consent Defaults
- **Field**: `consentDefault` (object)
- **Use**: Show default consent settings in Privacy & Cookies section
- **Location**: `results.tagstackInfo.consentDefaults`

## Integration Steps

### Step 1: Create Tagstack API Module
Create `src/lib/tagstack.js`:
- Function to call Tagstack API
- Parse response (handle JSON string in `message` field)
- Return structured data

### Step 2: Integrate into Scanner
- Add new step after GTM detection (Step 7)
- Call Tagstack API for each detected GTM container
- Store results in `results.tagstackInfo`

### Step 3: Update Results Components

#### ScoreOverview Component
- Replace `consentModeV2` mock data with real data from Tagstack
- Show actual Consent Mode V2 status

#### GTMAnalysis Component
- Display detailed container statistics:
  - Tags count (active/paused)
  - Variables count
  - Triggers count
- Show GA4 streams if detected
- Display consent defaults

#### PrivacyCookies Component
- Enhance CMP detection with Tagstack data
- Show consent defaults from Tagstack

## Example Integration Flow

```javascript
// After GTM detection (Step 6)
if (results.gtmInfo.found && results.gtmInfo.containers.length > 0) {
  // Step 7: Call Tagstack API for each GTM container
  const tagstackResults = await Promise.all(
    results.gtmInfo.containers.map(containerId => 
      fetchTagstackData(containerId)
    )
  );
  
  // Process and store results
  results.tagstackInfo = {
    gtmContainers: tagstackResults.filter(r => r.entityType === 'GTM Container'),
    ga4Streams: tagstackResults.filter(r => r.entityType === 'GA4 Stream'),
    consentModeV2: tagstackResults.some(r => r.consentMode === true),
    // ... other processed data
  };
}
```

## Benefits

1. **Real Consent Mode V2 Status**: Replace mock data with actual detection
2. **Enhanced GTM Analysis**: Show detailed container statistics
3. **Better CMP Detection**: Combine our detection with Tagstack's analysis
4. **GA4 Insights**: Show GA4 stream configurations and enhanced measurement
5. **Comprehensive Privacy Analysis**: Display consent defaults and settings

## Next Steps

1. ✅ Test API and understand response structure
2. ⏳ Create `src/lib/tagstack.js` module
3. ⏳ Integrate into scanner workflow
4. ⏳ Update UI components to display Tagstack data
5. ⏳ Test end-to-end flow
