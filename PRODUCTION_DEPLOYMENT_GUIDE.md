# USC-PIS Production Deployment Guide

[![Status](https://img.shields.io/badge/Status-Production_Ready-success)]()
[![Updated](https://img.shields.io/badge/Updated-August_17_2025-blue)]()
[![System Grade](https://img.shields.io/badge/System_Grade-B+-green)]()

## 🎯 System Status: Production Ready

USC-PIS is enterprise-grade and ready for production deployment with comprehensive infrastructure, security, and monitoring systems.

## 📋 Pre-Deployment Checklist

### ✅ Infrastructure Requirements
- [x] **Database**: PostgreSQL 12+ configured and optimized
- [x] **Storage**: Cloudinary integration for persistent media storage
- [x] **Email**: AWS SES configured for production email delivery
- [x] **Monitoring**: Comprehensive health checks and performance monitoring
- [x] **Security**: Enterprise-grade security headers and rate limiting
- [x] **Backup**: Complete backup and recovery system

### ✅ Environment Configuration
- [x] **Django Settings**: Production settings optimized
- [x] **Environment Variables**: All required variables documented
- [x] **SSL/TLS**: HTTPS enforcement and HSTS configured
- [x] **CORS**: Secure cross-origin configuration
- [x] **Static Files**: WhiteNoise configured for static file serving

## 🚀 Deployment Steps

### 1. Environment Setup

#### Required Environment Variables
```bash
# Core Django Settings
SECRET_KEY=your_secret_key_here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database Configuration
DATABASE_URL=postgres://user:password@host:port/database

# Email Configuration (AWS SES)
USE_AWS_SES=True
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_SES_REGION_NAME=us-east-1
DEFAULT_FROM_EMAIL=noreply@your-domain.com

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Security Settings
RATE_LIMIT_ENABLED=True
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com
```

### 2. Database Migration

```bash
# Apply all migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load initial data (optional)
python manage.py loaddata initial_data.json
```

### 3. Static Files and Media

```bash
# Collect static files
python manage.py collectstatic --noinput

# Verify Cloudinary configuration
python manage.py migrate_to_cloudinary --dry-run
```

### 4. Health Check Verification

```bash
# Test comprehensive health checks
curl -H "Authorization: Token YOUR_TOKEN" \
     https://your-domain.com/api/utils/health/comprehensive/

# Quick health check (no auth required)
curl https://your-domain.com/api/utils/health/quick/
```

### 5. Security Verification

```bash
# Test rate limiting
python manage.py test_security_improvements

# Verify HTTPS redirect
curl -I http://your-domain.com

# Check security headers
curl -I https://your-domain.com
```

## 🔐 Security Configuration

### SSL/TLS Setup
```python
# settings.py - Already configured
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
```

### Security Headers
```python
# Middleware automatically adds:
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Content-Security-Policy
```

### Rate Limiting
- **Authenticated Users**: 500 requests/hour
- **Anonymous Users**: 100 requests/hour
- **Configurable**: Via RATE_LIMIT_ENABLED environment variable

## 📊 Monitoring & Health Checks

### Health Check Endpoints

#### Quick Health Check (Public)
```bash
GET /api/utils/health/quick/
# Returns: { "status": "healthy", "timestamp": "...", "message": "..." }
```

#### Comprehensive Health Check (Admin/Staff)
```bash
GET /api/utils/health/comprehensive/
# Returns detailed system analysis including:
# - Database health
# - Cache status
# - Backup system
# - Email configuration
# - File storage
# - Performance metrics
# - Security status
```

#### System Metrics (Admin/Staff)
```bash
GET /api/utils/metrics/
# Returns performance metrics and resource usage
```

### Logging Configuration

Logs are written to:
- **Console**: All INFO level and above
- **File**: `/backend/logs/usc-pis.log` (WARNING level and above)
- **Rotation**: 10MB files, 5 backup files

```bash
# Monitor logs in production
tail -f /path/to/backend/logs/usc-pis.log

# Check for errors
grep ERROR /path/to/backend/logs/usc-pis.log
```

## 🔄 Backup & Recovery

### Automated Backup System

```bash
# Create manual backup
python manage.py execute_backup --auto

# Create specific backup type
python manage.py execute_backup --backup-id 123

# Monitor backup health
curl -H "Authorization: Token YOUR_TOKEN" \
     https://your-domain.com/api/utils/backup-health/
```

### Disaster Recovery

1. **Download Latest Backup**:
   ```bash
   curl -H "Authorization: Token YOUR_TOKEN" \
        https://your-domain.com/api/utils/backup/download/123/ \
        -o backup.json
   ```

2. **Restore from Backup**:
   ```bash
   curl -X POST -H "Authorization: Token YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"backup_id": 123, "merge_strategy": "replace"}' \
        https://your-domain.com/api/utils/backup/restore/
   ```

## 🚀 Performance Optimization

### Database Optimization
- **Indexes**: Comprehensive indexing on all major lookup fields
- **Queries**: Optimized with select_related and prefetch_related
- **Connection Pooling**: Configure for production load

### Caching Strategy
```python
# Recommended Redis configuration
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

### Static File Optimization
- **WhiteNoise**: Configured for static file serving
- **Compression**: Automatic gzip compression
- **CDN**: Cloudinary for media files with global CDN

## 📈 Scaling Considerations

### Horizontal Scaling
```yaml
# Example Docker Compose for scaling
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    deploy:
      replicas: 3
```

### Load Balancer Configuration
```nginx
# Nginx configuration
upstream usc_pis {
    server app1:8000;
    server app2:8000;
    server app3:8000;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location /health {
        proxy_pass http://usc_pis/api/utils/health/quick/;
    }
    
    location / {
        proxy_pass http://usc_pis;
    }
}
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database connectivity
python manage.py dbshell

# Verify database health
curl -H "Authorization: Token YOUR_TOKEN" \
     https://your-domain.com/api/utils/health/comprehensive/
```

#### 2. Email Configuration Issues
```bash
# Test email configuration
python manage.py test_email --email test@example.com --type welcome

# Check email settings in health check
curl -H "Authorization: Token YOUR_TOKEN" \
     https://your-domain.com/api/utils/health/comprehensive/ | \
     jq '.checks.email_system'
```

#### 3. Static File Issues
```bash
# Recollect static files
python manage.py collectstatic --clear --noinput

# Check static file configuration
python manage.py check --deploy
```

#### 4. Performance Issues
```bash
# Monitor slow requests
tail -f /path/to/logs/usc-pis.log | grep "Slow API request"

# Check database query performance
tail -f /path/to/logs/usc-pis.log | grep "High query count"
```

### Health Check Interpretation

#### Overall Status Meanings
- **healthy**: All systems operational
- **warning**: Non-critical issues detected
- **unhealthy**: Critical issues requiring attention

#### Key Metrics to Monitor
- **Database**: Query performance and connection health
- **Backup System**: Recent backup success rate
- **Email System**: Configuration and delivery status
- **Performance**: Request duration and query counts
- **Security**: Configuration compliance

## 📞 Emergency Procedures

### Critical System Failure
1. **Check Health Status**: `/api/utils/health/quick/`
2. **Review Logs**: Check application and system logs
3. **Database Check**: Verify database connectivity
4. **Rollback**: Use latest backup if necessary

### Backup System Failure
1. **Manual Backup**: Create immediate backup via API
2. **Check Disk Space**: Ensure adequate storage
3. **Verify Permissions**: Check file system permissions
4. **Contact Admin**: Escalate if automated recovery fails

## 📋 Production Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate installed and verified
- [ ] Health checks passing
- [ ] Backup system operational
- [ ] Email system tested
- [ ] Security headers verified
- [ ] Rate limiting enabled

### Post-Launch
- [ ] Monitor health check endpoints
- [ ] Verify backup system automation
- [ ] Check email notification delivery
- [ ] Monitor performance metrics
- [ ] Review security logs
- [ ] Test disaster recovery procedures

## 🔗 Additional Resources

- **[API Documentation](docs/api/README.md)**: Comprehensive API reference
- **[Backup System Guide](BACKUP_SYSTEM_GUIDE.md)**: Detailed backup documentation
- **[User Guide](USER_GUIDE.md)**: End-user documentation
- **[Security Configuration](docs/security/README.md)**: Security implementation details

---

**Last Updated**: August 17, 2025  
**System Status**: Production Ready  
**Deployment Confidence**: High  
**Support**: Enterprise-grade infrastructure with comprehensive monitoring