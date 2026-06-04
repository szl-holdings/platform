# Troubleshooting — SZL Holdings

## Common Issues

### Login Issues
**Problem**: Cannot sign in
**Solution**:
1. Clear browser cookies for the site
2. Try incognito/private browsing
3. Check if auth provider (Replit) is available
4. Contact support if issue persists

### Dashboard Not Loading
**Problem**: Dashboard shows blank or loading spinner
**Solution**:
1. Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R)
2. Check browser console for errors
3. Verify you have the correct role permissions
4. Check if the API server is responding (/api/health)

### Data Not Appearing
**Problem**: Lists or detail pages show no data
**Solution**:
1. Check your organization/tenant assignment
2. Verify your role has access to the data
3. Check filters — clear all filters and search
4. Try refreshing the page

### Mobile App Issues
**Problem**: Mobile app not connecting
**Solution**:
1. Check network connectivity
2. Force close and reopen the app
3. Clear app cache
4. Check if the API server is accessible

### Form Submission Errors
**Problem**: Form shows error on submit
**Solution**:
1. Check all required fields are filled
2. Check field validation messages
3. Check network connectivity
4. Try submitting again after a brief wait

## API Health Check
Visit `/api/health` to check service status. A healthy response returns:
```json
{ "status": "ok", "timestamp": "..." }
```

## Getting Help
- **Help Center**: /help
- **Contact**: /contact
- **Email**: support@szlholdings.com
- **Trust Center**: /trust (for security-related concerns)
