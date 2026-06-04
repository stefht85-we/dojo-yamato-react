var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/r2-presign.ts
var r2_presign_exports = {};
__export(r2_presign_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(r2_presign_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var import_s3_request_presigner = require("@aws-sdk/s3-request-presigner");
var allowedFolders = [
  "news",
  "galleria",
  "eventi",
  "teoria",
  "documenti",
  "difesa-personale",
  "insegnanti"
];
function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    },
    body: JSON.stringify(body)
  };
}
function normalizeFolder(folder) {
  return folder.replace(/^\/+|\/+$/g, "").replace(/\.\./g, "");
}
function normalizeFileName(fileName) {
  return fileName.replace(/^\/+|\/+$/g, "").replace(/\.\./g, "").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 140);
}
var handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Metodo non consentito" });
  }
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || "dojo-yamato";
  const publicUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/g, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return json(500, { error: "Variabili ambiente R2 mancanti" });
  }
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Body JSON non valido" });
  }
  const folder = normalizeFolder(payload.folder || "");
  const fileName = normalizeFileName(payload.fileName || "");
  const contentType = payload.contentType || "application/octet-stream";
  if (!folder || !fileName) {
    return json(400, { error: "Cartella o nome file mancante" });
  }
  const rootFolder = folder.split("/")[0];
  if (!allowedFolders.includes(rootFolder)) {
    return json(400, { error: `Cartella R2 non consentita: ${rootFolder}` });
  }
  const key = `${folder}/${fileName}`;
  const client = new import_client_s3.S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
  try {
    const command = new import_client_s3.PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType
    });
    const uploadUrl = await (0, import_s3_request_presigner.getSignedUrl)(client, command, { expiresIn: 60 * 10 });
    return json(200, {
      uploadUrl,
      publicUrl: `${publicUrl}/${key}`,
      key
    });
  } catch (error) {
    console.error(error);
    return json(500, { error: "Errore generazione presigned URL R2" });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=r2-presign.js.map
