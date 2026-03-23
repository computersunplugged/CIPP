import React, { useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCardTitle,
  CCol,
  CForm,
  CRow,
  CSpinner,
  CCallout,
  CFormSwitch,
  CFormInput,
  CFormLabel,
} from '@coreui/react'
import { useGenericGetRequestQuery, useGenericPostRequestMutation } from 'src/store/api/app'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faExclamationTriangle, faSync } from '@fortawesome/free-solid-svg-icons'

const NinjaOneCveSyncSettings = () => {
  const [enabled, setEnabled] = useState(false)
  const [scanGroupPrefix, setScanGroupPrefix] = useState('CIPP-')
  const [recurrenceHours, setRecurrenceHours] = useState(24)

  // Get current config from Extensionsconfig
  const {
    data: configData,
    isFetching: configIsFetching,
    isSuccess: configIsSuccess,
    refetch: refetchConfig,
  } = useGenericGetRequestQuery({
    path: '/api/ExecExtensionsConfig',
    params: { List: 'NinjaCveSync' },
  })

  // Get current scheduled task
  const {
    data: taskData,
    isFetching: taskIsFetching,
    refetch: refetchTask,
  } = useGenericGetRequestQuery({
    path: '/api/ListScheduledItems',
    params: { Filter: "Name eq 'Automated NinjaOne CVE Sync'" },
  })

  const [updateConfig, { isLoading: updateIsLoading, isSuccess: updateIsSuccess, error: updateError }] =
    useGenericPostRequestMutation()

  // Load existing config when available
  React.useEffect(() => {
    if (configIsSuccess && configData?.NinjaCveSync) {
      const config = configData.NinjaCveSync
      setEnabled(config.Enabled || false)
      setScanGroupPrefix(config.ScanGroupPrefix || 'CIPP-')
      setRecurrenceHours(config.RecurrenceHours || 24)
    }
  }, [configIsSuccess, configData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const result = await updateConfig({
      path: '/api/ExecSetNinjaCveSyncConfig',
      values: {
        Enabled: enabled,
        ScanGroupPrefix: scanGroupPrefix,
        RecurrenceHours: recurrenceHours,
      },
    })
    
    if (result?.data) {
      // Refetch both config and task to show updated state
      refetchConfig()
      refetchTask()
    }
  }

  const taskExists = taskData?.Results && taskData.Results.length > 0
  const lastRun = taskExists ? taskData.Results[0]?.LastRun : null
  const nextRun = taskExists ? taskData.Results[0]?.ScheduledTime : null

  return (
    <CCard className="mb-4">
      <CCardHeader>
        <CCardTitle>
          <FontAwesomeIcon icon={faSync} className="me-2" />
          Automated CVE Sync to NinjaOne
        </CCardTitle>
      </CCardHeader>
      <CCardBody>
        {(configIsFetching || taskIsFetching) && (
          <div className="text-center mb-3">
            <CSpinner />
          </div>
        )}
        
        {updateIsSuccess && (
          <CCallout color="success" className="mb-3">
            <FontAwesomeIcon icon={faCheck} className="me-2" />
            CVE Sync configuration saved successfully
            {enabled && ' and scheduled task created'}
          </CCallout>
        )}
        
        {updateError && (
          <CCallout color="danger" className="mb-3">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            Error: {updateError.message}
          </CCallout>
        )}

        <CForm onSubmit={handleSubmit}>
          <CRow className="mb-4">
            <CCol md={12}>
              <CFormSwitch
                label="Enable Automated CVE Sync"
                id="enabledSwitch"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                size="lg"
              />
              <p className="text-muted mb-0">
                Automatically sync Microsoft Defender TVM vulnerabilities to NinjaOne scan groups for all tenants
              </p>
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="scanGroupPrefix">
                Scan Group Name Prefix
                <span className="text-danger ms-1">*</span>
              </CFormLabel>
              <CFormInput
                type="text"
                id="scanGroupPrefix"
                value={scanGroupPrefix}
                onChange={(e) => setScanGroupPrefix(e.target.value)}
                placeholder="e.g., CIPP-"
                disabled={!enabled}
              />
              <small className="text-muted">
                Scan groups must be created in NinjaOne with this naming pattern:
                <br />
                <code>{scanGroupPrefix || '[prefix]'}[tenant-domain]</code>
                <br />
                Example: <code>{scanGroupPrefix || 'CIPP-'}contoso.com</code>
              </small>
            </CCol>
            
            <CCol md={6}>
              <CFormLabel htmlFor="recurrenceHours">
                Sync Frequency
                <span className="text-danger ms-1">*</span>
              </CFormLabel>
              <CFormInput
                type="number"
                id="recurrenceHours"
                value={recurrenceHours}
                onChange={(e) => setRecurrenceHours(parseInt(e.target.value) || 24)}
                min="1"
                max="168"
                disabled={!enabled}
              />
              <small className="text-muted">
                How often to sync CVE data (in hours)
                <br />
                Recommended: 24 hours (daily sync)
              </small>
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={12}>
              <CCallout color="info">
                <h6>How CVE Sync Works</h6>
                <ol className="mb-0">
                  <li>CIPP runs a scheduled task every <strong>{recurrenceHours} hours</strong></li>
                  <li>For each tenant, pulls vulnerability data from Microsoft Defender TVM</li>
                  <li>Uploads CVE data to the corresponding NinjaOne scan group</li>
                  <li>Tenants are processed sequentially to avoid rate limiting</li>
                  <li>If no CVEs exist, clears old data from NinjaOne</li>
                </ol>
              </CCallout>
            </CCol>
          </CRow>

          {enabled && (
            <CRow className="mb-3">
              <CCol md={12}>
                <CCallout color="warning">
                  <h6>Prerequisites</h6>
                  <ul className="mb-0">
                    <li>
                      <strong>NinjaOne Extension:</strong> Must be configured with valid API credentials
                    </li>
                    <li>
                      <strong>Scan Groups:</strong> Create a scan group in NinjaOne for each tenant
                      <ul>
                        <li>Name format: <code>{scanGroupPrefix}[tenant-domain]</code></li>
                        <li>Configure proper column mappings (Device ID and CVE ID headers)</li>
                      </ul>
                    </li>
                  </ul>
                </CCallout>
              </CCol>
            </CRow>
          )}

          {taskExists && (
            <CRow className="mb-3">
              <CCol md={12}>
                <CCard className="bg-success-subtle">
                  <CCardBody>
                    <h6 className="text-success">
                      <FontAwesomeIcon icon={faCheck} className="me-2" />
                      Scheduled Task Active
                    </h6>
                    <table className="table table-sm table-borderless mb-0">
                      <tbody>
                        <tr>
                          <td className="text-muted" style={{ width: '140px' }}>
                            <strong>Task Name:</strong>
                          </td>
                          <td>Automated NinjaOne CVE Sync</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
                            <strong>Frequency:</strong>
                          </td>
                          <td>Every {recurrenceHours} hours</td>
                        </tr>
                        <tr>
                          <td className="text-muted">
                            <strong>Scope:</strong>
                          </td>
                          <td>All Tenants (processed sequentially)</td>
                        </tr>
                        {nextRun && (
                          <tr>
                            <td className="text-muted">
                              <strong>Next Run:</strong>
                            </td>
                            <td>{new Date(nextRun * 1000).toLocaleString()}</td>
                          </tr>
                        )}
                        {lastRun && (
                          <tr>
                            <td className="text-muted">
                              <strong>Last Run:</strong>
                            </td>
                            <td>{new Date(lastRun * 1000).toLocaleString()}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          )}

          <CRow>
            <CCol md={12}>
              <CButton type="submit" color="primary" disabled={updateIsLoading} size="lg">
                {updateIsLoading ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Saving Configuration...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="me-2" />
                    Save CVE Sync Configuration
                  </>
                )}
              </CButton>
              
              <div className="mt-2">
                <small className="text-muted">
                  {enabled
                    ? 'Saving will create or update the scheduled task'
                    : 'Saving will remove the scheduled task if it exists'}
                </small>
              </div>
            </CCol>
          </CRow>
        </CForm>

        <hr className="my-4" />

        <CRow>
          <CCol md={12}>
            <h6>Related Pages</h6>
            <ul className="mb-0">
              <li>
                View and manage CVE exceptions: <strong>Security → Defender → CVE Management</strong>
              </li>
              <li>
                View scheduled task logs: <strong>CIPP Settings → Scheduled Tasks</strong>
              </li>
              <li>
                View sync results in NinjaOne: Log into your NinjaOne instance
              </li>
            </ul>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  )
}

export default NinjaOneCveSyncSettings
