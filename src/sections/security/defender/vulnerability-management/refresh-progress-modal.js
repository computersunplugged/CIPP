import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material'
import {
  CheckCircle,
  Error,
  HourglassEmpty,
  Refresh,
} from '@mui/icons-material'

/**
 * Refresh Progress Modal
 * 
 * Shows real-time progress of CVE data refresh across all tenants.
 */
const RefreshProgressModal = ({ open, onClose, refreshStatus }) => {
  const status = refreshStatus || {
    isRunning: false,
    progress: 0,
    currentTenant: null,
    completedTenants: 0,
    totalTenants: 0,
    tenantResults: [],
  }

  const progressPercent = status.totalTenants > 0
    ? (status.completedTenants / status.totalTenants) * 100
    : 0

  const getStatusIcon = (tenantStatus) => {
    switch (tenantStatus) {
      case 'completed':
        return <CheckCircle color="success" />
      case 'failed':
        return <Error color="error" />
      case 'pending':
        return <HourglassEmpty color="disabled" />
      case 'running':
        return <Refresh color="primary" />
      default:
        return <HourglassEmpty color="disabled" />
    }
  }

  const getStatusColor = (tenantStatus) => {
    switch (tenantStatus) {
      case 'completed':
        return 'success'
      case 'failed':
        return 'error'
      case 'running':
        return 'primary'
      default:
        return 'default'
    }
  }

  return (
    <Dialog
      open={open}
      onClose={status.isRunning ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={status.isRunning}
    >
      <DialogTitle>
        {status.isRunning ? 'Refreshing CVE Data...' : 'Refresh Complete'}
      </DialogTitle>

      <DialogContent dividers>
        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              Progress: {status.completedTenants} / {status.totalTenants} tenants
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {Math.round(progressPercent)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        {/* Current Tenant */}
        {status.isRunning && status.currentTenant && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.lighter', borderRadius: 1 }}>
            <Typography variant="body2" color="primary" gutterBottom>
              Currently processing:
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {status.currentTenant}
            </Typography>
          </Box>
        )}

        {/* Tenant Results List */}
        {status.tenantResults && status.tenantResults.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Tenant Status:
            </Typography>
            <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
              {status.tenantResults.map((tenant, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getStatusIcon(tenant.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={tenant.name}
                    secondary={
                      tenant.status === 'completed'
                        ? `${tenant.cveCount || 0} CVEs found`
                        : tenant.status === 'failed'
                        ? `Error: ${tenant.error || 'Unknown error'}`
                        : tenant.status === 'running'
                        ? 'Processing...'
                        : 'Waiting...'
                    }
                  />
                  <Chip
                    label={tenant.status}
                    size="small"
                    color={getStatusColor(tenant.status)}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Summary Stats */}
        {!status.isRunning && status.tenantResults && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Refresh Summary:
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
              <Box>
                <Typography variant="body2" color="success.main">
                  ✓ Completed
                </Typography>
                <Typography variant="h6">
                  {status.tenantResults.filter((t) => t.status === 'completed').length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="error.main">
                  ✗ Failed
                </Typography>
                <Typography variant="h6">
                  {status.tenantResults.filter((t) => t.status === 'failed').length}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total CVEs
                </Typography>
                <Typography variant="h6">
                  {status.tenantResults.reduce((sum, t) => sum + (t.cveCount || 0), 0)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={status.isRunning}
          variant={status.isRunning ? 'outlined' : 'contained'}
        >
          {status.isRunning ? 'Running in Background' : 'Close'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RefreshProgressModal
