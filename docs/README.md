# Documentación Técnica - Banking Agent ID System

Bienvenido a la documentación técnica completa del sistema Banking Agent ID. Esta documentación proporciona información detallada sobre la arquitectura, despliegue, integración de hardware y base de datos del sistema.

## Índice de Documentación

### Arquitectura

- **[ARQUITECTURA.md](./ARQUITECTURA.md)** - Documentación completa de la arquitectura del sistema
  - Descripción general
  - Componentes principales
  - Flujo de datos
  - Patrones arquitectónicos
  - Decisiones técnicas

- **[ARQUITECTURA_IA.md](./ARQUITECTURA_IA.md)** - Arquitectura de Inteligencia Artificial
  - Reconocimiento facial (Python API + face_recognition)
  - Arquitectura del chatbot
  - Pipeline de procesamiento
  - Modelos y algoritmos

### Despliegue

- **[DEPLOYMENT_AWS.md](./DEPLOYMENT_AWS.md)** - Guía completa de despliegue en AWS
  - Configuración de VPC
  - RDS PostgreSQL
  - S3 Buckets
  - EC2 para Flask API
  - CloudWatch
  - Variables de entorno
  - Seguridad y monitoreo

- **[DEPLOYMENT_EC2_NGINX.md](./DEPLOYMENT_EC2_NGINX.md)** - Configuración detallada de nginx y Gunicorn
  - Instalación de nginx
  - Configuración como reverse proxy
  - Gunicorn WSGI server
  - SSL/TLS con Let's Encrypt
  - Optimización de rendimiento

### Integración

- **[HARDWARE_INTEGRATION.md](./HARDWARE_INTEGRATION.md)** - Integración de dispositivos hardware
  - ESP32 Camera Module
  - Raspberry Pi Gateway
  - Protocolos (HTTP, MQTT)
  - Configuración de dispositivos
  - Diagramas de conexión

- **[DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md)** - Arquitectura de base de datos
  - Modelo de datos completo
  - Relaciones entre entidades
  - Índices y optimizaciones
  - Estrategias de backup
  - Escalabilidad

### Diagramas

Todos los diagramas están disponibles en múltiples formatos en el directorio [diagramas/](./diagramas/):

- **[DEPLOYMENT_DIAGRAM.mmd](./diagramas/DEPLOYMENT_DIAGRAM.mmd)** - Diagrama de despliegue en Mermaid
- **[DEPLOYMENT_DIAGRAM.drawio.xml](./diagramas/DEPLOYMENT_DIAGRAM.drawio.xml)** - Diagrama de despliegue en Draw.io
- **[DEPLOYMENT_DIAGRAM.md](./diagramas/DEPLOYMENT_DIAGRAM.md)** - Descripción textual del diagrama de despliegue
- **[ARQUITECTURA_COMPONENTES.mmd](./diagramas/ARQUITECTURA_COMPONENTES.mmd)** - Diagrama de componentes del sistema
- **[FLUJO_DATOS.mmd](./diagramas/FLUJO_DATOS.mmd)** - Diagrama de flujo de datos

## Arquitectura Mínima Sugerida

El sistema está diseñado con la siguiente arquitectura mínima:

### Componentes

1. **Backend**
   - Next.js API Routes
   - Flask API (Python) para reconocimiento facial

2. **Base de Datos**
   - PostgreSQL 14+ con Prisma ORM

3. **Frontend**
   - Next.js 15 con TypeScript

4. **Inteligencia Artificial**
   - Reconocimiento Facial: Python API con face_recognition
   - Chatbot: Rule-based con matching semántico de FAQs

5. **Hardware**
   - Microcontroladores (ESP32/Raspberry Pi/Arduino)
   - Protocolos: MQTT (IoT Core) o HTTP

6. **Infraestructura AWS (Ruta Simple)**
   - EC2: nginx + gunicorn (Flask API)
   - RDS: PostgreSQL
   - S3: Almacenamiento de imágenes
   - CloudWatch: Logs y monitoreo

## Flujo de Datos Principal

```
Cliente → Kiosk UI → Next.js API → PostgreSQL
                                    ↓
Hardware (ESP32) → Flask API → Next.js API (Webhook)
                                    ↓
                               PostgreSQL
```

## Guía Rápida de Inicio

1. **Desarrollo Local**
   - Ver [ARQUITECTURA.md](./ARQUITECTURA.md) para setup local
   - Ver [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md) para base de datos

2. **Despliegue AWS**
   - Seguir [DEPLOYMENT_AWS.md](./DEPLOYMENT_AWS.md) paso a paso
   - Configurar nginx según [DEPLOYMENT_EC2_NGINX.md](./DEPLOYMENT_EC2_NGINX.md)

3. **Integración Hardware**
   - Configurar ESP32 según [HARDWARE_INTEGRATION.md](./HARDWARE_INTEGRATION.md)
   - Configurar protocolos de comunicación

4. **Arquitectura IA**
   - Revisar [ARQUITECTURA_IA.md](./ARQUITECTURA_IA.md) para entender el sistema de IA
   - Configurar Flask API para reconocimiento facial

## Referencias Externas

- [README Principal](../README.md) - Documentación general del proyecto
- [FACIAL_RECOGNITION_INTEGRATION.md](../FACIAL_RECOGNITION_INTEGRATION.md) - Integración de reconocimiento facial
- [EC2_FLASK_API_SETUP.md](../EC2_FLASK_API_SETUP.md) - Setup de Flask API en EC2

## Estructura del Proyecto

```
pr-icc/
├── docs/                    # Esta documentación
│   ├── ARQUITECTURA.md
│   ├── ARQUITECTURA_IA.md
│   ├── DEPLOYMENT_AWS.md
│   ├── DEPLOYMENT_EC2_NGINX.md
│   ├── HARDWARE_INTEGRATION.md
│   ├── DATABASE_ARCHITECTURE.md
│   └── diagramas/
├── prisma/
│   └── schema.prisma        # Esquema de base de datos
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # Componentes React
│   ├── services/            # Lógica de negocio
│   └── lib/                 # Utilidades
└── README.md                # Documentación principal
```

## Contribuir

Si encuentras errores o quieres mejorar la documentación, por favor:

1. Revisa la documentación existente
2. Haz los cambios necesarios
3. Mantén el formato y estilo consistente
4. Actualiza este README si agregas nuevas secciones

## Licencia

Ver el archivo LICENSE en el directorio raíz del proyecto.

