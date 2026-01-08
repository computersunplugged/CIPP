import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { useMutation } from '@tanstack/react-query'
import { createCveException } from 'src/api/vulnerability'

/**
 * Create CVE Exception Modal
 * 
 * Modal dialog for creating a new CVE exception policy.
 * Supports selecting specific tenants or applying to all affected tenants.
 */
const CreateExceptionModal = ({ open, onClose, cveData, onSuccess }) => {
  const [formData, setFormData] = useState({
    cveId: '',
    tenantSelection: 'all',
    selectedTenants: [],
    justification: '',
    justificationTemplate: 'custom',
    expirationDate: null,
  })
  const [errors, setErrors] = useState({})

  const templates = [
    {
      value: 'network',
      label: 'Network Controls',
      text: 'Mitigated by network segmentation and firewall rules. Affected systems are isolated from internet access.',
    },
    {
      value: 'maintenance',
      label: 'Scheduled Maintenance',
      text: 'Patch pending scheduled maintenance window.',
    },
    {
      value: 'low-risk',
      label: 'Risk Accepted - Low Impact',
      text: 'Risk accepted - Low impact in our environment based on current deployment and usage patterns.',
    },
    {
      value: 'workaround',
      label: 'Workaround Applied',
      text: 'Workaround applied as per vendor guidance.',
    },
    {
      value: 'decommission',
      label: 'Scheduled for Decommissioning',
      text: 'Systems scheduled for decommissioning within 90 days.',
    },
    {
      value: 'custom',
      label: 'Custom',
      text: '',
    },
  ]

  useEffect(() => {
    if (open && cveData) {
      setFormData({
        cveId: cveData.cveId || '',
        tenantSelection: cveData.selectedTenant ? 'specific' : 'all',
        selectedTenants: cveData.selectedTenant ? [cveData.selectedTenant.tenantId] : [],
        justification: '',
        justificationTemplate: 'custom',
        expirationDate: null,
      })
      setErrors({})
    }
  }, [open, cveData])

  const createMutation = useMutation({
    mutationFn: createCveException,
    onSuccess: () => {
      onSuccess()
    },
    onError: (error) => {
      setErrors({ submit: error.message || 'Failed to create exception' })
    },
  })

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: null })
    }
  }

  const handleTemplateChange = (templateValue) => {
    const template = templates.find((t) => t.value === templateValue)
    setFormData({
      ...formData,
      justificationTemplate: templateValue,
      justification: template?.text || formData.justification,
    })
  }

  const handleTenantToggle = (tenantId) => {
    const currentSelection = formData.selectedTenants
    const newSelection = currentSelection.includes(tenantId)
      ? currentSelection.filter((id) => id !== tenantId)
      : [...currentSelection, tenantId]
    
    setFormData({ ...formData, selectedTenants: newSelection })
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.cveId) {
      newErrors.cveId = 'CVE ID is required'
    }

    if (formData.tenantSelection === 'specific' && formData.selectedTenants.length === 0) {
      newErrors.selectedTenants = 'Please select at least one tenant'
    }

    if (!formData.justification || formData.justification.trim().length === 0) {
      newErrors.justification = 'Justification is required'
    }

    if (formData.justification && formData.justification.length > 500) {
      newErrors.justification = 'Justification must be 500 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) {
      return
    }

    const payload = {
      cveId: formData.cveId,
      tenantIds:
        formData.tenantSelection === 'all'
          ? cveData.affectedTenants.map((t) => t.tenantId)
          : formData.selectedTenants,
      justification: formData.justification,
      expirationDate: formData.expirationDate ? formData.expirationDate.toISOString() : null,
    }

    createMutation.mutate(payload)
  }

  const getAffectedTenantsList = () => {
    if (!cveData?.affectedTenants) return []
    if (formData.tenantSelection === 'all') {
      return cveData.affectedTenants
    }
    return cveData.affectedTenants.filter((t) => formData.selectedTenants.includes(t.tenantId))
  }

  const affectedList = getAffectedTenantsList()
  const totalDevices = affectedList.reduce((sum, t) => sum + (t.deviceCount || 0), 0)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { minHeight: '60vh' } }}>
      <DialogTitle>Create CVE Exception</DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            CVE Information
          </Typography>
          <Typography variant="body2">
            <strong>CVE-ID:</strong> {cveData?.cveId}
          </Typography>
          <Typography variant="body2">
            <strong>Severity:</strong> {cveData?.severity}
          </Typography>
          <Typography variant="body2">
            <strong>Affected Tenants:</strong> {cveData?.affectedTenantsCount}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Tenant Selection *
          </Typography>
          <RadioGroup
            value={formData.tenantSelection}
            onChange={(e) => handleFieldChange('tenantSelection', e.target.value)}
          >
            <FormControlLabel
              value="all"
              control={<Radio />}
              label={`Apply to all affected tenants (${cveData?.affectedTenantsCount || 0} tenants)`}
            />
            <FormControlLabel value="specific" control={<Radio />} label="Apply to specific tenants:" />
          </RadioGroup>

          {formData.tenantSelection === 'specific' && (
            <Box
              sx={{
                mt: 2,
                ml: 4,
                maxHeight: 200,
                overflow: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <List dense>
                {cveData?.affectedTenants?.map((tenant) => (
                  <ListItem key={tenant.tenantId} button onClick={() => handleTenantToggle(tenant.tenantId)}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={formData.selectedTenants.includes(tenant.tenantId)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText primary={tenant.tenantName} secondary={`${tenant.deviceCount} affected devices`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {errors.selectedTenants && (
            <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
              {errors.selectedTenants}
            </Typography>
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Template</InputLabel>
            <Select
              value={formData.justificationTemplate}
              label="Template"
              onChange={(e) => handleTemplateChange(e.target.value)}
            >
              {templates.map((template) => (
                <MenuItem key={template.value} value={template.value}>
                  {template.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Justification *"
            value={formData.justification}
            onChange={(e) => handleFieldChange('justification', e.target.value)}
            error={!!errors.justification}
            helperText={errors.justification || `${formData.justification.length}/500 characters`}
            placeholder="Explain why this CVE is being accepted as a risk..."
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <DatePicker
            label="Expiration Date (Optional)"
            value={formData.expirationDate}
            onChange={(newValue) => handleFieldChange('expirationDate', newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                helperText: 'Exception will be automatically removed after this date',
              },
            }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Review & Apply
          </Typography>
          <Typography variant="body2" gutterBottom>
            This exception will be applied to:
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 1, pl: 3 }}>
            {affectedList.slice(0, 3).map((tenant) => (
              <Typography component="li" variant="body2" key={tenant.tenantId}>
                {tenant.tenantName} ({tenant.deviceCount} devices)
              </Typography>
            ))}
            {affectedList.length > 3 && (
              <Typography component="li" variant="body2">
                ... and {affectedList.length - 3} more
              </Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mt: 2 }}>
            Total: {affectedList.length} tenants, {totalDevices} devices
          </Typography>
        </Box>

        {errors.submit && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errors.submit}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={createMutation.isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={createMutation.isLoading}
          startIcon={createMutation.isLoading && <CircularProgress size={20} />}
        >
          {createMutation.isLoading ? 'Creating...' : 'Create Exception'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateExceptionModal
