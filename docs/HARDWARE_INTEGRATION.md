# Integración de Hardware - IoT Devices

Esta documentación describe la integración de dispositivos hardware (ESP32, Raspberry Pi, Arduino) con el sistema Banking Agent ID.

## Tabla de Contenidos

1. [Dispositivos Soportados](#dispositivos-soportados)
2. [ESP32 Camera Module](#esp32-camera-module)
3. [Raspberry Pi Gateway](#raspberry-pi-gateway)
4. [Protocolos de Comunicación](#protocolos-de-comunicación)
5. [MQTT Integration](#mqtt-integration)
6. [HTTP Streaming](#http-streaming)
7. [Configuración de Dispositivos](#configuración-de-dispositivos)
8. [Diagramas de Conexión](#diagramas-de-conexión)
9. [Troubleshooting](#troubleshooting)

## Dispositivos Soportados

### ESP32 Camera Module

- **Modelo Recomendado**: ESP32-CAM
- **Características**:
  - WiFi integrado
  - OV2640 camera module
  - MicroSD card slot
  - GPIO pins para sensores adicionales
- **Uso**: Cámaras principales para reconocimiento facial

### Raspberry Pi

- **Modelo Recomendado**: Raspberry Pi 4 Model B (4GB+)
- **Características**:
  - Potente CPU para procesamiento local
  - GPIO pins
  - Ethernet y WiFi
  - Múltiples USB ports
- **Uso**: Gateway, procesamiento local opcional, agregación de múltiples cámaras

### Arduino

- **Modelo Recomendado**: Arduino Uno/Nano/ESP8266
- **Características**:
  - Microcontrolador simple
  - GPIO pins
  - Módulos adicionales (sensores, actuadores)
- **Uso**: Sensores adicionales, dispositivos IoT simples

## ESP32 Camera Module

### Hardware Setup

**Componentes Necesarios**:
- ESP32-CAM module
- USB to TTL adapter (para programación)
- Resistencias pull-up (10kΩ)
- Fuente de alimentación 5V
- Antena WiFi (opcional, si no integrada)

**Conexiones**:
```
ESP32-CAM    USB-TTL
---------    -------
5V      ->   5V
GND     ->   GND
U0R     ->   TX
U0T     ->   RX
IO0     ->   GND (solo para programación)
```

### Software Setup

#### Instalación de Arduino IDE

1. Descargar Arduino IDE desde [arduino.cc](https://www.arduino.cc/en/software)
2. Instalar ESP32 Board Support:
   - File > Preferences
   - Agregar a "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
3. Tools > Board > Boards Manager > Buscar "esp32" > Instalar
4. Seleccionar board: Tools > Board > ESP32 Arduino > ESP32 Wrover Module

#### Librerías Necesarias

```cpp
#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
```

#### Código Base ESP32-CAM

Crear `esp32_camera_stream.ino`:

```cpp
#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>

// Configuración WiFi
const char* ssid = "TU_SSID";
const char* password = "TU_PASSWORD";

// Configuración de la cámara
#define CAMERA_MODEL_AI_THINKER
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

WebServer server(80);

void setup() {
  Serial.begin(115200);
  
  // Inicializar WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  // Configurar cámara
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Resolución (ajustar según necesidad)
  config.frame_size = FRAMESIZE_VGA; // 640x480
  config.jpeg_quality = 12; // 0-63, menor = mejor calidad
  config.fb_count = 1;
  
  // Inicializar cámara
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Error inicializando cámara: 0x%x\n", err);
    return;
  }
  
  // Configurar rutas
  server.on("/stream", handleStream);
  server.on("/capture", handleCapture);
  server.on("/status", handleStatus);
  
  server.begin();
  Serial.println("Servidor HTTP iniciado");
}

void loop() {
  server.handleClient();
}

// Stream MJPEG
void handleStream() {
  String response = "HTTP/1.1 200 OK\r\n";
  response += "Content-Type: multipart/x-mixed-replace; boundary=frame\r\n\r\n";
  server.sendContent(response);
  
  while (true) {
    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Error capturando frame");
      break;
    }
    
    response = "--frame\r\n";
    response += "Content-Type: image/jpeg\r\n\r\n";
    server.sendContent(response);
    server.sendContent_P((const char *)fb->buf, fb->len);
    response = "\r\n";
    server.sendContent(response);
    
    esp_camera_fb_return(fb);
    delay(100); // ~10 FPS
  }
}

// Captura única
void handleCapture() {
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    server.send(500, "text/plain", "Error capturando imagen");
    return;
  }
  
  server.send_P(200, "image/jpeg", (const char *)fb->buf, fb->len);
  esp_camera_fb_return(fb);
}

// Status
void handleStatus() {
  String status = "{";
  status += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  status += "\"rssi\":" + String(WiFi.RSSI()) + ",";
  status += "\"status\":\"ok\"";
  status += "}";
  
  server.send(200, "application/json", status);
}
```

### Configuración de Red

#### IP Estática (Opcional)

```cpp
// En setup(), antes de WiFi.begin()
IPAddress local_IP(192, 168, 1, 100);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress dns(8, 8, 8, 8);

WiFi.config(local_IP, gateway, subnet, dns);
```

#### URL del Stream

Una vez configurado, el stream estará disponible en:
```
http://192.168.1.100/stream
http://192.168.1.100/capture  # Captura única
http://192.168.1.100/status   # Estado del dispositivo
```

## Raspberry Pi Gateway

### Configuración como Gateway

El Raspberry Pi puede actuar como:
1. **Gateway MQTT**: Conecta dispositivos MQTT a la nube
2. **Procesador Local**: Procesamiento de video local antes de enviar
3. **Agregador**: Agrega múltiples cámaras ESP32

### Instalación Base

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y python3 python3-pip python3-venv git

# Instalar Mosquitto (MQTT Broker)
sudo apt install -y mosquitto mosquitto-clients

# Instalar dependencias para procesamiento de video
sudo apt install -y python3-opencv libopencv-dev
```

### MQTT Gateway Script

Crear `/home/pi/mqtt_gateway.py`:

```python
#!/usr/bin/env python3
import paho.mqtt.client as mqtt
import requests
import json
from datetime import datetime

# Configuración
FLASK_API_URL = "https://api.tu-dominio.com/api/webhook"
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC_CAMERA = "camera/+/detection"

def on_connect(client, userdata, flags, rc):
    print(f"Conectado al broker MQTT: {rc}")
    client.subscribe(MQTT_TOPIC_CAMERA)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        
        # Procesar detección
        detection = {
            "result": payload.get("result"),
            "camera_id": payload.get("camera_id"),
            "camera_stream_url": payload.get("stream_url"),
            "timestamp": datetime.now().isoformat()
        }
        
        # Enviar a Flask API
        response = requests.post(
            FLASK_API_URL,
            json=detection,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        
        if response.status_code == 200:
            print(f"Detección enviada: {detection['camera_id']}")
        else:
            print(f"Error enviando detección: {response.status_code}")
            
    except Exception as e:
        print(f"Error procesando mensaje: {e}")

def main():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_forever()

if __name__ == "__main__":
    main()
```

### Servicio Systemd para Gateway

Crear `/etc/systemd/system/mqtt-gateway.service`:

```ini
[Unit]
Description=MQTT Gateway Service
After=network.target mosquitto.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi
ExecStart=/usr/bin/python3 /home/pi/mqtt_gateway.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Habilitar y iniciar:

```bash
sudo systemctl enable mqtt-gateway
sudo systemctl start mqtt-gateway
```

## Protocolos de Comunicación

### HTTP Streaming

**Ventajas**:
- Simple de implementar
- Compatible con estándares web
- Fácil debugging
- No requiere broker adicional

**Desventajas**:
- Requiere conexión directa
- Mayor consumo de ancho de banda
- No escalable para muchos dispositivos

**Uso**: Cámaras ESP32 directamente al Flask API

### MQTT

**Ventajas**:
- Bajo consumo de recursos
- Escalable
- QoS levels para garantizar entrega
- Pub/Sub pattern flexible

**Desventajas**:
- Requiere broker MQTT
- Configuración más compleja
- Latencia adicional

**Uso**: Múltiples dispositivos, sensores, dispositivos con batería limitada

### HTTP REST

**Ventajas**:
- Estándar web
- Fácil integración
- Buen soporte de librerías

**Desventajas**:
- Overhead de HTTP headers
- No ideal para datos en tiempo real

**Uso**: APIs, configuración, comandos

## MQTT Integration

### AWS IoT Core (Opcional)

Para escalar a múltiples ubicaciones, considerar AWS IoT Core:

```python
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient

client = AWSIoTMQTTClient("raspberry-pi-gateway")
client.configureEndpoint("tu-endpoint.iot.us-east-1.amazonaws.com", 8883)
client.configureCredentials("path/to/rootCA.pem", "path/to/privateKey.pem", "path/to/certificate.pem")
client.connect()

# Publicar detección
client.publish("banking-agent/camera/detection", json.dumps(detection), 1)
```

### Broker MQTT Local (Mosquitto)

```bash
# Instalar Mosquitto
sudo apt install -y mosquitto mosquitto-clients

# Configurar
sudo nano /etc/mosquitto/mosquitto.conf

# Configuración básica:
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd

# Crear usuario
sudo mosquitto_passwd -c /etc/mosquitto/passwd usuario
```

## HTTP Streaming

### Configuración en Flask API

El Flask API se conecta a streams HTTP directamente:

```python
# En Flask API
stream_url = "http://192.168.1.100:81/stream"

cap = cv2.VideoCapture(stream_url)
```

### Configuración de Seguridad

Para producción, considerar:
- VPN para dispositivos
- Autenticación HTTP Basic
- HTTPS con certificados autofirmados

## Configuración de Dispositivos

### Modelo Device en Prisma

El schema Prisma ya incluye el modelo `Device`:

```prisma
model Device {
  id                  String         @id
  name                String
  protocol            DeviceProtocol // MQTT | HTTP | Serial
  enabled             Boolean        @default(true)
  mqttBroker          String?
  mqttPort            Int?
  mqttTopic           String?
  httpUrl             String?
  // ...
}
```

### Registrar Dispositivo

```typescript
// API: POST /api/devices
{
  "name": "ESP32 Camera - Sucursal 1",
  "protocol": "HTTP",
  "httpUrl": "http://192.168.1.100:81/stream",
  "enabled": true
}
```

## Diagramas de Conexión

### Configuración Simple (HTTP Directo)

```
ESP32 Camera
    │
    │ HTTP Stream
    │ (http://192.168.1.100:81/stream)
    ▼
Flask API (EC2)
    │
    │ Webhook
    ▼
Next.js API
    │
    │ SQL
    ▼
PostgreSQL (RDS)
```

### Configuración con Gateway MQTT

```
ESP32 Camera 1 ─┐
ESP32 Camera 2 ─┤
Arduino Sensor ─┼──► MQTT ──► Raspberry Pi Gateway ──► Flask API
ESP32 Camera 3 ─┤              (Mosquitto Broker)
Raspberry Pi ───┘
```

### Configuración con AWS IoT Core

```
Dispositivos ──► AWS IoT Core ──► Lambda/EC2 ──► Flask API
    │                │
    │                │ Rules
    │                ▼
    │           S3 / DynamoDB
    │
    └──► Device Shadow ──► Next.js Dashboard
```

## Troubleshooting

### Problemas de Conexión WiFi (ESP32)

```cpp
// Agregar retry logic
int attempts = 0;
while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
}

if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Error conectando a WiFi");
    // Intentar AP mode como fallback
    WiFi.mode(WIFI_AP);
    WiFi.softAP("ESP32-CAM", "password123");
}
```

### Problemas de Stream

- Verificar resolución de cámara (reducir si es necesario)
- Ajustar calidad JPEG (aumentar compresión)
- Verificar ancho de banda de red
- Reducir FPS si es necesario

### Problemas de MQTT

```bash
# Verificar conexión al broker
mosquitto_sub -h localhost -t "test" -v

# Publicar mensaje de prueba
mosquitto_pub -h localhost -t "test" -m "Hello"

# Ver logs de Mosquitto
sudo tail -f /var/log/mosquitto/mosquitto.log
```

## Referencias

- [ESP32 Camera Documentation](https://github.com/espressif/esp32-camera)
- [MQTT Protocol Specification](https://mqtt.org/mqtt-specification/)
- [AWS IoT Core Documentation](https://docs.aws.amazon.com/iot/)
- [Raspberry Pi Documentation](https://www.raspberrypi.org/documentation/)

