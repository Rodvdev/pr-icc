# Guía de Despliegue AWS - Ruta Simple

Esta guía describe el despliegue del sistema Banking Agent ID en AWS usando la ruta simple recomendada:
- **EC2**: nginx + gunicorn para Flask API
- **RDS**: PostgreSQL para base de datos
- **S3**: Almacenamiento de imágenes y snapshots
- **CloudWatch**: Logs y monitoreo

## Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Configuración de VPC](#configuración-de-vpc)
3. [Configuración de RDS PostgreSQL](#configuración-de-rds-postgresql)
4. [Configuración de S3](#configuración-de-s3)
5. [Despliegue de Next.js en Vercel/AWS](#despliegue-de-nextjs)
6. [Configuración de EC2 para Flask API](#configuración-de-ec2-para-flask-api)
7. [Configuración de nginx](#configuración-de-nginx)
8. [Configuración de gunicorn](#configuración-de-gunicorn)
9. [Configuración de CloudWatch](#configuración-de-cloudwatch)
10. [Variables de Entorno](#variables-de-entorno)
11. [Seguridad](#seguridad)
12. [Monitoreo y Alertas](#monitoreo-y-alertas)
13. [Backup y Recuperación](#backup-y-recuperación)

## Prerequisitos

### Cuenta AWS

- Cuenta AWS activa
- Permisos IAM con acceso a:
  - EC2 (crear instancias, security groups)
  - RDS (crear bases de datos)
  - S3 (crear buckets)
  - CloudWatch (logs y métricas)
  - IAM (crear roles y políticas)

### Herramientas Locales

```bash
# AWS CLI
aws --version

# Terraform (opcional, para IaC)
terraform --version

# Git
git --version

# Node.js 18+
node --version

# Python 3.11+
python --version
```

### Configuración Inicial AWS CLI

```bash
aws configure
# AWS Access Key ID: [tu-access-key]
# AWS Secret Access Key: [tu-secret-key]
# Default region name: us-east-1 (o tu región preferida)
# Default output format: json
```

## Configuración de VPC

### Crear VPC

```bash
# Crear VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=banking-agent-vpc}]'

# Guardar VPC ID
export VPC_ID=vpc-xxxxxxxx
```

### Crear Subnets

```bash
# Public Subnet 1 (para EC2)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-subnet-1}]'

# Public Subnet 2 (para alta disponibilidad)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-subnet-2}]'

# Private Subnet 1 (para RDS)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.3.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-subnet-1}]'

# Private Subnet 2 (para RDS Multi-AZ)
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.4.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-subnet-2}]'
```

### Internet Gateway

```bash
# Crear Internet Gateway
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=banking-agent-igw}]'

# Adjuntar a VPC
aws ec2 attach-internet-gateway \
  --internet-gateway-id igw-xxxxxxxx \
  --vpc-id $VPC_ID
```

### Route Tables

```bash
# Route table para subnets públicas
aws ec2 create-route-table \
  --vpc-id $VPC_ID \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=public-rt}]'

# Agregar ruta a Internet Gateway
aws ec2 create-route \
  --route-table-id rtb-xxxxxxxx \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id igw-xxxxxxxx

# Asociar subnets públicas
aws ec2 associate-route-table --subnet-id subnet-xxxxxxxx --route-table-id rtb-xxxxxxxx
```

## Configuración de RDS PostgreSQL

### Crear Subnet Group

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name banking-agent-db-subnet \
  --db-subnet-group-description "Subnet group for Banking Agent DB" \
  --subnet-ids subnet-private-1 subnet-private-2 \
  --vpc-id $VPC_ID
```

### Crear Security Group para RDS

```bash
# Security group para RDS
aws ec2 create-security-group \
  --group-name banking-agent-rds-sg \
  --description "Security group for RDS PostgreSQL" \
  --vpc-id $VPC_ID

# Permitir acceso desde EC2 (puerto 5432)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-xxxxxxxx  # Security group de EC2
```

### Crear Instancia RDS

```bash
aws rds create-db-instance \
  --db-instance-identifier banking-agent-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username admin \
  --master-user-password 'TuPasswordSeguro123!' \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --multi-az \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name banking-agent-db-subnet \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --publicly-accessible false \
  --tag-specifications 'ResourceType=db-instance,Tags=[{Key=Name,Value=banking-agent-db}]'
```

**Nota**: El proceso de creación puede tardar 10-15 minutos.

### Obtener Endpoint de RDS

```bash
aws rds describe-db-instances \
  --db-instance-identifier banking-agent-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# Ejemplo: banking-agent-db.xxxxx.us-east-1.rds.amazonaws.com
```

### Connection String

```bash
DATABASE_URL="postgresql://admin:TuPasswordSeguro123!@banking-agent-db.xxxxx.us-east-1.rds.amazonaws.com:5432/banking_agent_db?schema=public"
```

## Configuración de S3

### Crear Buckets

```bash
# Bucket para imágenes faciales
aws s3 mb s3://banking-agent-facial-images \
  --region us-east-1

# Bucket para snapshots de detección
aws s3 mb s3://banking-agent-detection-snapshots \
  --region us-east-1
```

### Configurar Políticas de Acceso

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:role/banking-agent-app-role"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::banking-agent-facial-images/*"
    }
  ]
}
```

### Habilitar Versionado

```bash
aws s3api put-bucket-versioning \
  --bucket banking-agent-facial-images \
  --versioning-configuration Status=Enabled
```

### Configurar Lifecycle Policies

```bash
# Política para mover objetos antiguos a Glacier
aws s3api put-bucket-lifecycle-configuration \
  --bucket banking-agent-detection-snapshots \
  --lifecycle-configuration file://lifecycle-policy.json
```

**lifecycle-policy.json**:
```json
{
  "Rules": [
    {
      "Id": "MoveOldSnapshotsToGlacier",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

## Despliegue de Next.js

### Opción 1: Vercel (Recomendado)

1. **Conectar repositorio a Vercel**
   ```bash
   npm i -g vercel
   vercel login
   vercel link
   ```

2. **Configurar variables de entorno en Vercel Dashboard**:
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_URL=https://tu-dominio.vercel.app
   NEXTAUTH_SECRET=tu-secret-generado
   NEXT_PUBLIC_FACIAL_API_URL=https://api.tu-dominio.com
   AWS_ACCESS_KEY_ID=tu-access-key
   AWS_SECRET_ACCESS_KEY=tu-secret-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_IMAGES=banking-agent-facial-images
   AWS_S3_BUCKET_SNAPSHOTS=banking-agent-detection-snapshots
   ```

3. **Desplegar**:
   ```bash
   vercel --prod
   ```

### Opción 2: EC2 (Alternativa)

Ver sección [Configuración de EC2 para Flask API](#configuración-de-ec2-para-flask-api) para instalar Node.js y desplegar Next.js.

## Configuración de EC2 para Flask API

### Crear Security Group

```bash
aws ec2 create-security-group \
  --group-name banking-agent-flask-sg \
  --description "Security group for Flask API" \
  --vpc-id $VPC_ID

# Permitir HTTP
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Permitir HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Permitir SSH (solo desde tu IP)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxx \
  --protocol tcp \
  --port 22 \
  --cidr TU_IP/32
```

### Crear Instancia EC2

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name tu-key-pair \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx \
  --associate-public-ip-address \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=banking-agent-flask-api}]'
```

### Conectar por SSH

```bash
ssh -i tu-key-pair.pem ubuntu@EC2_PUBLIC_IP
```

### Instalar Dependencias

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python y herramientas
sudo apt install -y python3.11 python3.11-venv python3-pip nginx git

# Instalar dependencias del sistema para OpenCV y face_recognition
sudo apt install -y \
  build-essential \
  cmake \
  libopenblas-dev \
  liblapack-dev \
  libx11-dev \
  libgtk-3-dev \
  python3-dev \
  python3-numpy \
  libjpeg-dev \
  libpng-dev \
  libtiff-dev \
  libavcodec-dev \
  libavformat-dev \
  libswscale-dev \
  libv4l-dev \
  libxvidcore-dev \
  libx264-dev \
  libfontconfig1-dev \
  libcairo2-dev \
  libgdk-pixbuf2.0-dev \
  libpango1.0-dev \
  libgtk2.0-dev \
  libgtk-3-dev \
  libatlas-base-dev \
  gfortran \
  libhdf5-dev \
  libhdf5-serial-dev \
  libhdf5-103 \
  libqtgui4 \
  libqtwebkit4 \
  libqt4-test \
  python3-pyqt5 \
  default-libmysqlclient-dev \
  libssl-dev
```

### Clonar y Configurar Aplicación Flask

```bash
# Crear directorio
sudo mkdir -p /var/www/flask-api
sudo chown ubuntu:ubuntu /var/www/flask-api
cd /var/www/flask-api

# Clonar repositorio (o subir código)
git clone https://github.com/tu-repo/flask-facial-recognition.git .

# Crear entorno virtual
python3.11 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install --upgrade pip
pip install flask gunicorn face_recognition opencv-python numpy requests
```

Ver documento [DEPLOYMENT_EC2_NGINX.md](./DEPLOYMENT_EC2_NGINX.md) para configuración detallada de nginx y gunicorn.

## Configuración de CloudWatch

### Crear Log Group

```bash
aws logs create-log-group --log-group-name /aws/ec2/flask-api
aws logs create-log-group --log-group-name /aws/ec2/nextjs
```

### Instalar CloudWatch Agent (EC2)

```bash
# Descargar agente
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb

# Instalar
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb

# Configurar
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### Configuración Manual del Agente

Crear `/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json`:

```json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/www/flask-api/logs/app.log",
            "log_group_name": "/aws/ec2/flask-api",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "BankingAgent/FlaskAPI",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait"],
        "totalcpu": false
      },
      "disk": {
        "measurement": ["used_percent"],
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"]
      }
    }
  }
}
```

### Iniciar Agente

```bash
sudo systemctl start amazon-cloudwatch-agent
sudo systemctl enable amazon-cloudwatch-agent
```

## Variables de Entorno

### Next.js (Vercel/EC2)

```env
# Database
DATABASE_URL=postgresql://admin:password@banking-agent-db.xxxxx.us-east-1.rds.amazonaws.com:5432/banking_agent_db?schema=public

# Auth
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=generar-con-openssl-rand-base64-32

# Facial Recognition API
NEXT_PUBLIC_FACIAL_API_URL=https://api.tu-dominio.com
FACIAL_RECOGNITION_WEBHOOK_SECRET=generar-secret-seguro

# AWS
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_IMAGES=banking-agent-facial-images
AWS_S3_BUCKET_SNAPSHOTS=banking-agent-detection-snapshots

# Environment
NODE_ENV=production
```

### Flask API (EC2)

Crear `/var/www/flask-api/.env`:

```env
# Flask
FLASK_APP=app.py
FLASK_ENV=production
SECRET_KEY=generar-secret-key-seguro

# Stream URL (configurable por cámara)
DEFAULT_STREAM_URL=http://192.168.1.100:81/stream

# Next.js Webhook
NEXTJS_WEBHOOK_URL=https://tu-dominio.vercel.app/api/facial-recognition/webhook
FACIAL_RECOGNITION_WEBHOOK_SECRET=mismo-secret-que-nextjs

# Threshold
FACE_RECOGNITION_THRESHOLD=0.6

# Paths
ENCODINGS_FILE=/var/www/flask-api/data/encodings.npy
LABELS_FILE=/var/www/flask-api/data/labels.json
FRAMES_DIR=/var/www/flask-api/frames
RESULTS_DIR=/var/www/flask-api/results
```

## Seguridad

### IAM Roles

Crear rol IAM para EC2 con permisos a S3:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::banking-agent-facial-images/*",
        "arn:aws:s3:::banking-agent-detection-snapshots/*"
      ]
    }
  ]
}
```

### SSL/TLS con Let's Encrypt

Ver [DEPLOYMENT_EC2_NGINX.md](./DEPLOYMENT_EC2_NGINX.md) para configuración de SSL.

### Security Groups

- **RDS**: Solo acceso desde EC2 security group
- **EC2**: Solo puertos necesarios (80, 443, 22)
- **S3**: Políticas de bucket restrictivas

## Monitoreo y Alertas

### CloudWatch Alarms

```bash
# Alarm para CPU alta
aws cloudwatch put-metric-alarm \
  --alarm-name flask-api-high-cpu \
  --alarm-description "Alarm when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Alarm para memoria
aws cloudwatch put-metric-alarm \
  --alarm-name flask-api-high-memory \
  --alarm-description "Alarm when memory exceeds 80%" \
  --metric-name MemoryUtilization \
  --namespace BankingAgent/FlaskAPI \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

### SNS para Notificaciones

```bash
# Crear topic
aws sns create-topic --name banking-agent-alerts

# Suscribirse (email)
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:banking-agent-alerts \
  --protocol email \
  --notification-endpoint tu-email@example.com
```

## Backup y Recuperación

### RDS Backups Automáticos

- **Retention**: 7 días (configurado en creación)
- **Window**: 03:00-04:00 UTC
- **Multi-AZ**: Snapshots automáticos

### Backup Manual de RDS

```bash
aws rds create-db-snapshot \
  --db-instance-identifier banking-agent-db \
  --db-snapshot-identifier banking-agent-db-manual-$(date +%Y%m%d)
```

### Backup de Datos Flask API

```bash
# Backup de encodings
aws s3 cp /var/www/flask-api/data/encodings.npy s3://banking-agent-backups/encodings.npy
aws s3 cp /var/www/flask-api/data/labels.json s3://banking-agent-backups/labels.json
```

### Restauración de RDS

```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier banking-agent-db-restored \
  --db-snapshot-identifier banking-agent-db-manual-20240115
```

## Costos Estimados (Mensual)

- **EC2 t3.medium**: ~$30/mes
- **RDS db.t3.medium Multi-AZ**: ~$150/mes
- **S3 Storage (100GB)**: ~$2.30/mes
- **CloudWatch Logs**: ~$5/mes
- **Data Transfer**: ~$20/mes

**Total**: ~$207/mes (sin Next.js en Vercel)

## Referencias

- [Documentación EC2 nginx](./DEPLOYMENT_EC2_NGINX.md)
- [Documentación de Arquitectura](./ARQUITECTURA.md)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)

