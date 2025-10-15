Here’s a Software Requirements Specification (SRS) text for your project “Sistema de Identificación para Agente Bancario”, written in a concise, professional format suitable for documentation or presentation.

⸻

Software Requirements Specification (SRS)

Sistema de Identificación para Agente Bancario

1. Introducción

1.1 Propósito

El propósito de este documento es definir los requerimientos funcionales y no funcionales del Sistema de Identificación para Agente Bancario, una plataforma que automatiza la identificación de clientes en módulos de atención mediante reconocimiento facial e integra un asistente virtual para mejorar la experiencia del usuario.

1.2 Alcance

El sistema optimiza la atención al cliente en agentes bancarios mediante:
	•	Identificación automática por cámara.
	•	Registro asistido por chatbot.
	•	Gestión y aprobación de clientes por parte de administradores.
	•	Visualización de métricas y logs de interacción.

El sistema está destinado a operar en módulos físicos de agentes bancarios y se integrará con cámaras IP, un backend en Prisma + PostgreSQL, y un frontend en Next.js 15 con TypeScript y ShadCN UI.

⸻

2. Descripción General

2.1 Perspectiva del sistema

El sistema se compone de tres módulos principales:
	1.	Módulo de Cliente: identificación facial, registro, autenticación, y chatbot.
	2.	Módulo de Administrador: panel de control, gestión de clientes, cámaras y métricas.
	3.	Módulo de Chatbot: respuestas automatizadas y base de conocimiento editable.

2.2 Usuarios del sistema
	•	Cliente: personas que acuden al agente bancario para realizar operaciones básicas.
	•	Administrador/Agente: empleado encargado de validar registros, supervisar cámaras y gestionar la base de clientes.

2.3 Suposiciones y dependencias
	•	Requiere conexión a Internet estable.
	•	Cámaras compatibles con protocolo RTSP o similar.
	•	Base de datos PostgreSQL alojada en Railway o AWS.
	•	Autenticación basada en NextAuth o JWT.

⸻

3. Requerimientos Funcionales

3.1 Módulo de Cliente
	1.	El sistema debe detectar el rostro del cliente mediante la cámara y compararlo con perfiles registrados.
	2.	Si el cliente es reconocido, se mostrará un mensaje de bienvenida y un acceso al chatbot.
	3.	Si el cliente no está registrado, el sistema ofrecerá registro guiado (nombre, DNI, correo, teléfono, contraseña).
	4.	El cliente podrá restablecer su contraseña mediante un token temporal.
	5.	El chatbot debe permitir consultas sobre productos, servicios y trámites frecuentes.

3.2 Módulo de Administrador
	1.	El administrador podrá visualizar la lista de clientes detectados en tiempo real.
	2.	El administrador podrá aprobar o rechazar registros nuevos.
	3.	El sistema permitirá CRUD completo de clientes (crear, editar, eliminar, bloquear, resetear contraseña).
	4.	Se mostrará el estado de las cámaras (en línea, desconectadas, error).
	5.	Se generarán logs de detecciones con fecha, cámara y resultado.
	6.	Se presentarán métricas: visitantes diarios, nuevos vs. recurrentes, registros completados.

3.3 Módulo de Chatbot
	1.	El sistema permitirá agregar, editar o eliminar FAQs.
	2.	El administrador podrá actualizar un dataset de preguntas y respuestas.
	3.	Las conversaciones se almacenarán para análisis y mejora del servicio.
	4.	El chatbot debe soportar lenguaje natural en español.

⸻

4. Requerimientos No Funcionales

4.1 Rendimiento
	•	La identificación facial no debe exceder 2 segundos por intento.
	•	El sistema debe soportar al menos 5 cámaras concurrentes por sucursal.

4.2 Seguridad
	•	Las contraseñas se almacenarán con hashing (bcrypt).
	•	Accesos restringidos por roles (ADMIN, AGENT, CLIENT).
	•	Tokens de autenticación con expiración y registro de actividad (AuditLog).

4.3 Usabilidad
	•	Interfaz moderna y accesible en pantallas táctiles.
	•	Chatbot con lenguaje claro y amigable.
	•	Dashboard con visualizaciones intuitivas (ShadCN + Tailwind).

4.4 Escalabilidad
	•	Arquitectura modular y multi-sucursal (Branch / AgentModule).
	•	Capacidad de integrar reconocimiento facial de terceros (Azure, AWS, OpenCV).

4.5 Mantenibilidad
	•	Código modular (Next.js 15 + Prisma ORM).
	•	Documentación en formato Markdown para cada módulo.
	•	Logs centralizados para debugging.

⸻

5. Base de Datos

La base de datos PostgreSQL sigue el esquema definido en Prisma, incluyendo las entidades:
	•	Client, User, Branch, AgentModule, Camera, DetectionEvent, FacialProfile, Visit, RegistrationRequest, ChatSession, ChatMessage, FAQ, QAPair, AuditLog.

Relaciones clave:
	•	Client ↔ FacialProfile (1:N)
	•	Camera ↔ DetectionEvent (1:N)
	•	Client ↔ ChatSession (1:N)
	•	User ↔ Branch (N:M)
	•	Branch ↔ Camera / AgentModule (1:N)

⸻

6. Requerimientos del Sistema
	•	Frontend: Next.js 15, TypeScript, TailwindCSS, ShadCN UI.
	•	Backend: Node.js 20+, GraphQL o REST API, Prisma ORM.
	•	Base de datos: PostgreSQL.
	•	Infraestructura: Railway, Vercel, o AWS.
	•	IA: Reconocimiento facial (Azure Face API / AWS Rekognition / OpenCV).

⸻

7. Métricas de Éxito
	•	Reducción del tiempo de registro en un 60%.
	•	Identificación facial con precisión superior al 95%.
	•	Satisfacción del usuario > 8/10 en encuestas.
	•	Mínimo downtime < 0.5% mensual.

⸻