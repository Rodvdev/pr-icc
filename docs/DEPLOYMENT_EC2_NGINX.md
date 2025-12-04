# Configuración de nginx y Gunicorn en EC2

Esta guía describe la configuración detallada de nginx como reverse proxy y Gunicorn como servidor WSGI para la Flask API de reconocimiento facial.

## Tabla de Contenidos

1. [Instalación de nginx](#instalación-de-nginx)
2. [Configuración de nginx](#configuración-de-nginx)
3. [Configuración de Gunicorn](#configuración-de-gunicorn)
4. [SSL/TLS con Let's Encrypt](#ssltls-con-lets-encrypt)
5. [Optimización de Rendimiento](#optimización-de-rendimiento)
6. [Monitoreo y Logs](#monitoreo-y-logs)
7. [Troubleshooting](#troubleshooting)

## Instalación de nginx

### Ubuntu/Debian

```bash
# Actualizar paquetes
sudo apt update

# Instalar nginx
sudo apt install -y nginx

# Verificar instalación
nginx -v

# Iniciar y habilitar nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar estado
sudo systemctl status nginx
```

### Configurar Firewall

```bash
# Permitir HTTP y HTTPS
sudo ufw allow 'Nginx Full'

# Verificar reglas
sudo ufw status
```

## Configuración de nginx

### Estructura de Directorios

```
/etc/nginx/
├── nginx.conf              # Configuración principal
├── sites-available/        # Configuraciones disponibles
│   └── flask-api          # Configuración Flask API
├── sites-enabled/          # Configuraciones activas
│   └── flask-api -> ../sites-available/flask-api
└── snippets/               # Fragmentos reutilizables
    ├── ssl-params.conf    # Parámetros SSL
    └── proxy-params.conf  # Parámetros proxy
```

### Configuración Principal (nginx.conf)

Editar `/etc/nginx/nginx.conf`:

```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    ##
    # Basic Settings
    ##
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # server_tokens off;
    # server_names_hash_bucket_size 64;
    # server_name_in_redirect off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ##
    # SSL Settings
    ##
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    ##
    # Logging Settings
    ##
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    ##
    # Gzip Settings
    ##
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    ##
    # Virtual Host Configs
    ##
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### Fragmento SSL (snippets/ssl-params.conf)

Crear `/etc/nginx/snippets/ssl-params.conf`:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_dhparam /etc/nginx/ssl/dhparam.pem;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_stapling on;
ssl_stapling_verify on;

# Security headers
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

Generar parámetros Diffie-Hellman:

```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
```

### Fragmento Proxy (snippets/proxy-params.conf)

Crear `/etc/nginx/snippets/proxy-params.conf`:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port $server_port;

# Timeouts
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;

# Buffering
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
```

### Configuración del Sitio (sites-available/flask-api)

Crear `/etc/nginx/sites-available/flask-api`:

```nginx
# Redirección HTTP a HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.tu-dominio.com;

    # Para Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Servidor HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.tu-dominio.com;

    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tu-dominio.com/privkey.pem;
    include /etc/nginx/snippets/ssl-params.conf;

    # Logs
    access_log /var/log/nginx/flask-api-access.log main;
    error_log /var/log/nginx/flask-api-error.log warn;

    # Tamaño máximo de upload (para imágenes)
    client_max_body_size 10M;

    # Timeouts aumentados para procesamiento de video
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;

    # API Endpoints
    location /api {
        include /etc/nginx/snippets/proxy-params.conf;
        
        proxy_pass http://127.0.0.1:5000;
        
        # Headers específicos
        proxy_set_header Connection "keep-alive";
        
        # Buffering para streams
        proxy_buffering off;
        proxy_cache off;
    }

    # Health check
    location /health {
        access_log off;
        proxy_pass http://127.0.0.1:5000/api/status;
    }

    # Status endpoint (opcional)
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

### Habilitar Configuración

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/flask-api /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Recargar nginx
sudo systemctl reload nginx
```

## Configuración de Gunicorn

### Instalación

```bash
# En el entorno virtual
source /var/www/flask-api/venv/bin/activate
pip install gunicorn
```

### Archivo de Configuración

Crear `/var/www/flask-api/gunicorn_config.py`:

```python
"""Configuración de Gunicorn para Flask API"""

import multiprocessing
import os

# Ruta de la aplicación
chdir = '/var/www/flask-api'

# WSGI module
wsgi_app = 'app:app'

# Workers
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
worker_connections = 1000
threads = 2

# Timeouts
timeout = 120
keepalive = 5
graceful_timeout = 30

# Logging
accesslog = '/var/www/flask-api/logs/gunicorn-access.log'
errorlog = '/var/www/flask-api/logs/gunicorn-error.log'
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'flask-facial-api'

# User/Group (opcional, requiere permisos)
# user = 'www-data'
# group = 'www-data'

# Bind
bind = '127.0.0.1:5000'
backlog = 2048

# Performance
max_requests = 1000
max_requests_jitter = 100
preload_app = True

# SSL (si Gunicorn maneja SSL directamente)
# keyfile = '/path/to/keyfile'
# certfile = '/path/to/certfile'

# Environment
raw_env = [
    'FLASK_ENV=production',
]
```

### Crear Directorio de Logs

```bash
sudo mkdir -p /var/www/flask-api/logs
sudo chown ubuntu:ubuntu /var/www/flask-api/logs
```

### Archivo de Inicio (gunicorn_start.sh)

Crear `/var/www/flask-api/gunicorn_start.sh`:

```bash
#!/bin/bash

NAME="flask-facial-api"
DIR=/var/www/flask-api
USER=ubuntu
GROUP=ubuntu
WORKERS=4
WORKER_CLASS=sync
BIND=127.0.0.1:5000
LOG_LEVEL=info
VENV=$DIR/venv/bin/activate
PID_FILE=$DIR/gunicorn.pid
ACCESS_LOG=$DIR/logs/gunicorn-access.log
ERROR_LOG=$DIR/logs/gunicorn-error.log

cd $DIR
source $VENV

exec gunicorn app:app \
    --name $NAME \
    --workers $WORKERS \
    --worker-class $WORKER_CLASS \
    --user=$USER \
    --group=$GROUP \
    --bind=$BIND \
    --log-level=$LOG_LEVEL \
    --access-logfile=$ACCESS_LOG \
    --error-logfile=$ERROR_LOG \
    --pid=$PID_FILE \
    --timeout=120 \
    --graceful-timeout=30 \
    --max-requests=1000 \
    --max-requests-jitter=100 \
    --preload
```

Hacer ejecutable:

```bash
chmod +x /var/www/flask-api/gunicorn_start.sh
```

## Systemd Service

### Crear Servicio

Crear `/etc/systemd/system/flask-api.service`:

```ini
[Unit]
Description=Flask Facial Recognition API
After=network.target

[Service]
Type=forking
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/flask-api
Environment="PATH=/var/www/flask-api/venv/bin"
ExecStart=/var/www/flask-api/gunicorn_start.sh
ExecReload=/bin/kill -s HUP $MAINPID
PIDFile=/var/www/flask-api/gunicorn.pid
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Habilitar y Iniciar

```bash
# Recargar systemd
sudo systemctl daemon-reload

# Habilitar servicio
sudo systemctl enable flask-api

# Iniciar servicio
sudo systemctl start flask-api

# Verificar estado
sudo systemctl status flask-api

# Ver logs
sudo journalctl -u flask-api -f
```

## SSL/TLS con Let's Encrypt

### Instalar Certbot

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Verificar instalación
certbot --version
```

### Obtener Certificado

```bash
# Obtener certificado para dominio
sudo certbot --nginx -d api.tu-dominio.com

# O certificado para múltiples dominios
sudo certbot --nginx -d api.tu-dominio.com -d www.api.tu-dominio.com
```

Certbot automáticamente:
- Obtiene certificado
- Configura nginx
- Configura renovación automática

### Renovación Automática

Certbot configura automáticamente un cron job. Verificar:

```bash
# Ver tareas programadas
sudo certbot renew --dry-run

# Ver cron job
sudo systemctl status certbot.timer
```

### Renovación Manual

```bash
# Renovar certificado
sudo certbot renew

# Recargar nginx después de renovar
sudo certbot renew --nginx
```

## Optimización de Rendimiento

### Ajustes de nginx

```nginx
# En nginx.conf o configuración del sitio

# Worker processes
worker_processes auto;

# Worker connections
events {
    worker_connections 2048;
    use epoll;
}

# Buffer sizes
client_body_buffer_size 128k;
client_header_buffer_size 1k;
large_client_header_buffers 4 16k;

# Timeouts
client_body_timeout 12;
client_header_timeout 12;
send_timeout 10;

# Compression
gzip on;
gzip_min_length 1000;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### Ajustes de Gunicorn

```python
# En gunicorn_config.py

# Aumentar workers según CPU
workers = multiprocessing.cpu_count() * 2 + 1

# Usar gevent para I/O intensivo
worker_class = 'gevent'
worker_connections = 1000

# Preload app para compartir memoria
preload_app = True
```

### Cache de nginx (Opcional)

Para endpoints estáticos o respuestas cacheables:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

location /api/cacheable {
    proxy_cache api_cache;
    proxy_cache_valid 200 10m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    proxy_pass http://127.0.0.1:5000;
}
```

## Monitoreo y Logs

### Logs de nginx

```bash
# Acceso
sudo tail -f /var/log/nginx/flask-api-access.log

# Errores
sudo tail -f /var/log/nginx/flask-api-error.log

# Logs generales
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Logs de Gunicorn

```bash
# Acceso
sudo tail -f /var/www/flask-api/logs/gunicorn-access.log

# Errores
sudo tail -f /var/www/flask-api/logs/gunicorn-error.log

# Systemd logs
sudo journalctl -u flask-api -f
```

### Rotación de Logs

Crear `/etc/logrotate.d/flask-api`:

```
/var/www/flask-api/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        systemctl reload flask-api > /dev/null 2>&1 || true
    endscript
}
```

### Métricas de Rendimiento

```bash
# Ver workers de Gunicorn
ps aux | grep gunicorn

# Ver conexiones de nginx
sudo netstat -anp | grep :80
sudo netstat -anp | grep :443

# Ver uso de recursos
htop
```

## Troubleshooting

### Verificar Configuración

```bash
# nginx
sudo nginx -t

# Gunicorn
sudo systemctl status flask-api
```

### Problemas Comunes

#### 502 Bad Gateway

```bash
# Verificar que Gunicorn está corriendo
sudo systemctl status flask-api

# Verificar logs de error
sudo journalctl -u flask-api -n 50

# Verificar que el puerto está abierto
sudo netstat -tlnp | grep 5000
```

#### Timeouts

Aumentar timeouts en nginx:

```nginx
proxy_read_timeout 300s;
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
```

Y en Gunicorn:

```python
timeout = 300
keepalive = 10
```

#### Problemas de SSL

```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew --force-renewal

# Verificar configuración SSL
openssl s_client -connect api.tu-dominio.com:443
```

#### Problemas de Permisos

```bash
# Verificar permisos de archivos
ls -la /var/www/flask-api/

# Corregir permisos
sudo chown -R ubuntu:ubuntu /var/www/flask-api
sudo chmod +x /var/www/flask-api/gunicorn_start.sh
```

### Comandos Útiles

```bash
# Reiniciar servicios
sudo systemctl restart nginx
sudo systemctl restart flask-api

# Recargar configuración sin downtime
sudo nginx -s reload
sudo systemctl reload flask-api

# Ver conexiones activas
sudo netstat -anp | grep ESTABLISHED | grep :443

# Ver uso de memoria
free -h

# Ver uso de CPU
top
```

## Referencias

- [Documentación de Despliegue AWS](./DEPLOYMENT_AWS.md)
- [nginx Documentation](https://nginx.org/en/docs/)
- [Gunicorn Documentation](https://docs.gunicorn.org/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

