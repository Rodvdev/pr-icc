-- CreateEnum
CREATE TYPE "DeviceProtocol" AS ENUM ('MQTT', 'HTTP', 'Serial');

-- CreateEnum
CREATE TYPE "DeviceConnectionStatus" AS ENUM ('CONNECTING', 'CONNECTED', 'DISCONNECTED', 'ERROR', 'RECONNECTING');

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "protocol" "DeviceProtocol" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "mqttBroker" TEXT,
    "mqttPort" INTEGER,
    "mqttTopic" TEXT,
    "mqttClientId" TEXT,
    "mqttUsername" TEXT,
    "mqttPassword" TEXT,
    "httpUrl" TEXT,
    "httpApiKey" TEXT,
    "serialPort" TEXT,
    "serialBaudRate" INTEGER,
    "reconnectInterval" INTEGER,
    "healthCheckInterval" INTEGER,
    "timeout" INTEGER,
    "maxRetries" INTEGER,
    "backoffMultiplier" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceMessage" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "success" BOOLEAN NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMetric" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "clientId" TEXT,
    "latency" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "intent" TEXT,
    "usedContext" BOOLEAN NOT NULL DEFAULT false,
    "contextItems" INTEGER DEFAULT 0,
    "errorMessage" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Device_protocol_idx" ON "Device"("protocol");

-- CreateIndex
CREATE INDEX "Device_enabled_idx" ON "Device"("enabled");

-- CreateIndex
CREATE INDEX "DeviceMessage_deviceId_timestamp_idx" ON "DeviceMessage"("deviceId", "timestamp");

-- CreateIndex
CREATE INDEX "DeviceMessage_success_idx" ON "DeviceMessage"("success");

-- CreateIndex
CREATE INDEX "DeviceMessage_type_timestamp_idx" ON "DeviceMessage"("type", "timestamp");

-- CreateIndex
CREATE INDEX "ChatMetric_sessionId_timestamp_idx" ON "ChatMetric"("sessionId", "timestamp");

-- CreateIndex
CREATE INDEX "ChatMetric_clientId_timestamp_idx" ON "ChatMetric"("clientId", "timestamp");

-- CreateIndex
CREATE INDEX "ChatMetric_success_timestamp_idx" ON "ChatMetric"("success", "timestamp");

-- CreateIndex
CREATE INDEX "ChatMetric_intent_idx" ON "ChatMetric"("intent");

-- CreateIndex
CREATE INDEX "ChatMetric_timestamp_idx" ON "ChatMetric"("timestamp");

-- CreateIndex
CREATE INDEX "Branch_code_idx" ON "Branch"("code");

-- CreateIndex
CREATE INDEX "Branch_country_city_idx" ON "Branch"("country", "city");

-- CreateIndex
CREATE INDEX "ChatMessage_actor_createdAt_idx" ON "ChatMessage"("actor", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_intent_idx" ON "ChatMessage"("intent");

-- CreateIndex
CREATE INDEX "ChatSession_tempVisitorId_idx" ON "ChatSession"("tempVisitorId");

-- CreateIndex
CREATE INDEX "ChatSession_startedAt_idx" ON "ChatSession"("startedAt");

-- CreateIndex
CREATE INDEX "Client_dni_idx" ON "Client"("dni");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "Client"("email");

-- CreateIndex
CREATE INDEX "Client_status_createdAt_idx" ON "Client"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Client_phone_idx" ON "Client"("phone");

-- CreateIndex
CREATE INDEX "DetectionEvent_status_occurredAt_idx" ON "DetectionEvent"("status", "occurredAt");

-- CreateIndex
CREATE INDEX "FAQ_status_createdAt_idx" ON "FAQ"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QAPair_isActive_createdAt_idx" ON "QAPair"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "RegistrationRequest_status_createdAt_idx" ON "RegistrationRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "RegistrationRequest_branchId_status_idx" ON "RegistrationRequest"("branchId", "status");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE INDEX "Visit_clientId_status_idx" ON "Visit"("clientId", "status");

-- AddForeignKey
ALTER TABLE "DeviceMessage" ADD CONSTRAINT "DeviceMessage_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMetric" ADD CONSTRAINT "ChatMetric_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMetric" ADD CONSTRAINT "ChatMetric_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
