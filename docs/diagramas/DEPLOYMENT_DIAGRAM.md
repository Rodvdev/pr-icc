# Diagrama de Despliegue - Descripción Textual

## Descripción General

Este diagrama muestra la arquitectura de despliegue completa del sistema Banking Agent ID en AWS, incluyendo la integración con hardware IoT y servicios externos.

## Componentes por Capa

### 1. Capa de Internet

**Usuarios**: 
- Clientes que acceden al portal del cliente
- Acceso mediante HTTPS desde cualquier ubicación
- Autenticación requerida para acceso seguro

**Administradores**:
- Personal administrativo que gestiona el sistema
- Acceso al panel de administración
- Permisos elevados para configuración

**Clientes**:
- Visitantes que usan los kioscos
- Acceso público a la interfaz de kiosco
- Opción de registro y autenticación

### 2. Capa AWS Cloud

#### VPC (Virtual Private Cloud)

**Public Subnet - Next.js Application**:
- **Application Load Balancer (ALB)**: 
  - Distribuye tráfico HTTPS (puerto 443)
  - Health checks para alta disponibilidad
  - Terminación SSL/TLS
  
- **Nginx (Reverse Proxy)**:
  - Recibe tráfico del ALB
  - Enrutamiento a instancias Next.js
  - Manejo de SSL/TLS si es necesario
  
- **Next.js Application (Instancias múltiples)**:
  - Aplicación Next.js 15 en Node.js 18+
  - Puerto interno: 3005
  - Múltiples instancias para escalabilidad
  - Auto-scaling basado en carga

**Public Subnet - Flask API**:
- **Nginx (Reverse Proxy)**:
  - Proxy reverso para Flask API
  - Balanceo de carga entre workers
  
- **Gunicorn (WSGI Server)**:
  - Múltiples workers (4 por instancia)
  - Manejo de procesos Python
  - Escalable horizontalmente
  
- **Flask API**:
  - Aplicación Python 3.11+
  - Librería face_recognition
  - Puerto interno: 5000
  - Procesamiento de reconocimiento facial

**Private Subnet**:
- **RDS PostgreSQL**:
  - Base de datos Multi-AZ para alta disponibilidad
  - Encriptación en reposo y en tránsito
  - Backups automáticos
  - Solo accesible desde subnets privadas
  
- **S3 Buckets**:
  - `facial-images`: Almacenamiento de imágenes de perfiles
  - `detection-snapshots`: Snapshots de detecciones
  - Políticas de acceso privadas
  - Versionado habilitado

- **CloudWatch**:
  - Recopilación de logs de todas las aplicaciones
  - Métricas de rendimiento
  - Alertas y notificaciones

### 3. Capa de Hardware

**ESP32 Cameras**:
- Cámaras IoT con módulo ESP32
- Direcciones IP locales (192.168.1.x)
- Stream HTTP en puerto 81
- Una cámara por sucursal/módulo
- Conectividad WiFi o Ethernet

**Raspberry Pi (Opcional)**:
- Gateway opcional para múltiples cámaras
- Agregación de streams
- Posible procesamiento local
- Conectividad MQTT opcional

**Arduino (Opcional)**:
- Sensores adicionales
- Integración IoT
- Protocolo MQTT o HTTP

### 4. Servicios Externos

**Route 53 (DNS)**:
- Resolución DNS para dominios
- Health checks
- Routing policies

**ACM (AWS Certificate Manager)**:
- Certificados SSL/TLS gratuitos
- Auto-renovación
- Integración con ALB

## Flujos de Conexión

### Flujo de Usuario (HTTPS)

1. Usuario accede mediante HTTPS
2. DNS (Route 53) resuelve dominio
3. Tráfico llega a ALB
4. ALB termina SSL usando certificado ACM
5. ALB distribuye a Nginx (Next.js)
6. Nginx enruta a instancia Next.js
7. Next.js procesa solicitud
8. Si requiere datos, consulta RDS
9. Si requiere imágenes, lee de S3
10. Respuesta devuelta al usuario

### Flujo de Reconocimiento Facial

1. ESP32 Camera transmite stream HTTP
2. Flask API se conecta al stream
3. Flask procesa frames de video
4. Detecta rostros usando face_recognition
5. Genera encodings de 128 dimensiones
6. Compara con encodings conocidos
7. Si hay match, genera evento
8. Envía webhook a Next.js API
9. Next.js guarda evento en RDS
10. Sube snapshot a S3 (opcional)
11. Frontend actualiza visualización

### Flujo de Chatbot

1. Usuario envía mensaje desde frontend
2. Next.js API recibe en `/api/chat`
3. Sistema busca contexto en FAQs/QA
4. Genera respuesta basada en contexto
5. Guarda interacción en RDS
6. Registra métricas en CloudWatch
7. Devuelve respuesta al usuario

## Consideraciones de Seguridad

### Network Security

- **VPC**: Aislamiento de red
- **Subnets**: Separación pública/privada
- **Security Groups**: Reglas de firewall por capa
- **NACLs**: Control de acceso a nivel de subnet

### Data Security

- **Encriptación en tránsito**: HTTPS/TLS
- **Encriptación en reposo**: RDS y S3 encriptados
- **Secrets Management**: AWS Secrets Manager o Parameter Store
- **Access Control**: IAM roles y políticas

### Application Security

- **Autenticación**: NextAuth.js con JWT
- **Autorización**: Roles y permisos
- **Rate Limiting**: Protección contra abuso
- **Input Validation**: Sanitización de datos
- **Audit Logs**: Registro de acciones sensibles

## Escalabilidad

### Horizontal Scaling

- **Next.js**: Auto-scaling basado en CPU/memoria
- **Flask API**: Múltiples instancias con load balancer
- **RDS**: Read replicas para queries de lectura
- **S3**: Infinitamente escalable

### Vertical Scaling

- **EC2 Instances**: Aumentar tamaño según necesidad
- **RDS**: Upgrade de instancia para más recursos
- **Load Balancers**: Distribución eficiente de carga

## Monitoreo y Observabilidad

### Logs (CloudWatch)

- **Application Logs**: Next.js y Flask API
- **Access Logs**: ALB y Nginx
- **Database Logs**: RDS PostgreSQL
- **Retention**: Configurable (típicamente 30 días)

### Métricas (CloudWatch)

- **CPU/Memory**: Uso de recursos EC2
- **Network**: Tráfico y latencia
- **Database**: Connections, queries, storage
- **Application**: Response times, error rates

### Alertas

- **High CPU/Memory**: Escalado automático
- **Error Rates**: Notificaciones inmediatas
- **Database Issues**: Alertas de RDS
- **Cost Alerts**: Control de costos

## Costos Estimados

### Mensual (USD)

- **EC2 Instances**: $50-200 (dependiendo de tamaño)
- **RDS PostgreSQL**: $100-300 (Multi-AZ)
- **S3 Storage**: $10-50 (dependiendo de uso)
- **CloudWatch**: $10-30
- **Data Transfer**: $20-100
- **Load Balancer**: $20-30

**Total Estimado**: $210-710/mes (sin considerar costos de desarrollo)

## Referencias

- [Documentación de Arquitectura](./../ARQUITECTURA.md)
- [Guía de Despliegue AWS](./../DEPLOYMENT_AWS.md)
- [Integración Hardware](./../HARDWARE_INTEGRATION.md)

