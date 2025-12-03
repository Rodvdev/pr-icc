#!/usr/bin/env node

/**
 * Script para descargar los modelos de face-api.js necesarios para el reconocimiento facial.
 * Los modelos se descargan en public/models/ para que el cliente pueda cargarlos.
 * 
 * Fuente: GitHub rawgit de face-api.js (repositorio oficial)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');
// Usar CDN de rawgit que apunta al repositorio oficial de face-api.js en GitHub
const BASE_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/';

// Modelos disponibles en el repositorio oficial
const MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-weights_shard1.bin',
  'tiny_face_detector_model-weights_shard2.bin',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-weights_shard1.bin',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-weights_shard1.bin',
];

// Crear directorio si no existe
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log(`✅ Directorio creado: ${MODELS_DIR}`);
}

let completed = 0;
let failed = 0;
let failedModels = [];

MODELS.forEach((model) => {
  const url = BASE_URL + model;
  const filePath = path.join(MODELS_DIR, model);

  // Skip si ya existe
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  Ya existe: ${model}`);
    completed++;
    if (completed + failed === MODELS.length) {
      if (failedModels.length === 0) {
        console.log(`\n✅ Modelos listos en: ${MODELS_DIR}`);
      } else {
        console.log(`\n⚠️  Algunos modelos faltaron. Intenta descargar manualmente.`);
        process.exit(1);
      }
    }
    return;
  }

  console.log(`⬇️  Descargando: ${model}...`);

  https
    .get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(filePath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Descargado: ${model}`);
          completed++;
          if (completed + failed === MODELS.length) {
            if (failedModels.length === 0) {
              console.log(`\n✅ Todos los modelos descargados en: ${MODELS_DIR}`);
              process.exit(0);
            } else {
              console.log(`\n⚠️  Se completó con errores. Modelos faltantes:`, failedModels);
              process.exit(1);
            }
          }
        });
      } else {
        console.error(`❌ Error descargando ${model}: HTTP ${response.statusCode}`);
        failedModels.push(model);
        failed++;
        if (completed + failed === MODELS.length) {
          if (failedModels.length === 0) {
            console.log(`\n✅ Modelos listos en: ${MODELS_DIR}`);
            process.exit(0);
          } else {
            console.log(`\n⚠️  Se completó con errores.`);
            process.exit(1);
          }
        }
      }
    })
    .on('error', (err) => {
      console.error(`❌ Error al descargar ${model}:`, err.message);
      failedModels.push(model);
      failed++;
      if (completed + failed === MODELS.length) {
        if (failedModels.length === 0) {
          console.log(`\n✅ Modelos listos en: ${MODELS_DIR}`);
          process.exit(0);
        } else {
          console.log(`\n⚠️  Se completó con errores.`);
          process.exit(1);
        }
      }
    });
});

console.log(`\n⏳ Descargando ${MODELS.length} modelos desde ${BASE_URL}...`);
