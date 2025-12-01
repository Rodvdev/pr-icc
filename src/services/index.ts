/**
 * Services Index
 * 
 * Centralized export of all service modules for easy importing.
 */

export { clientService, ClientService } from './client.service'
export { branchService, BranchService } from './branch.service'
export { faqService, FAQService } from './faq.service'
export { cameraService, CameraService } from './camera.service'
export { visitService, VisitService } from './visit.service'
export { chatbotService, ChatbotService } from './chatbot.service'
export { facialRecognitionService, FacialRecognitionService } from './facial-recognition.service'
// Disabled for deployment:
// export { deviceIntegrationService, DeviceIntegrationService } from './device-integration.service'

// Re-export types for convenience
export type {
  CreateClientData,
  UpdateClientData,
  ClientSearchParams
} from './client.service'

export type {
  CreateBranchData,
  UpdateBranchData,
  CreateModuleData,
  UpdateModuleData
} from './branch.service'

export type {
  CreateFAQData,
  UpdateFAQData,
  CreateQAPairData,
  UpdateQAPairData,
  FAQSearchParams
} from './faq.service'

export type {
  CreateCameraData,
  UpdateCameraData,
  CameraSearchParams
} from './camera.service'

export type {
  CreateVisitData,
  UpdateVisitData,
  VisitSearchParams
} from './visit.service'

export type {
  FacialProfile,
  DetectionEvent,
  CreateFacialProfileData,
  RegisterUserToPythonAPI,
  DetectionEventData
} from './facial-recognition.service'

// export type {
//   DeviceConfig,
//   DeviceHealth,
//   DeviceMessage,
//   DeviceProtocol,
//   DeviceConnectionStatus
// } from './device-integration.service'

export type {
  RelevantContext,
  ChatResponse,
  ChatInteractionMetadata,
  ChatMetrics,
  SaveChatInteractionResult
} from './chatbot.service'

