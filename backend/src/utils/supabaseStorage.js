const fs = require("fs");
const supabase = require("../../config/supabase");

/**
 * Upload a local file to Supabase Storage
 * @param {string} localFilePath - Path to the file on local disk
 * @param {string} destinationFileName - Name of the file in the bucket
 * @returns {Promise<string|null>} - Public URL of the uploaded file, or null if failed/disabled
 */
async function uploadToSupabase(localFilePath, destinationFileName) {
  if (!supabase) {
    console.log("Supabase not configured, skipping cloud storage upload.");
    return null;
  }

  const bucketName = process.env.SUPABASE_BUCKET || "models";
  const fileBuffer = fs.readFileSync(localFilePath);

  console.log(`Uploading ${destinationFileName} to Supabase bucket '${bucketName}'...`);
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(destinationFileName, fileBuffer, {
      contentType: "application/octet-stream",
      upsert: true,
    });

  if (error) {
    console.error("Supabase upload failed:", error.message);
    throw new Error(`Gagal mengunggah file ke Supabase Storage: ${error.message}`);
  }

  console.log(`Uploaded successfully to Supabase! Path: ${data.path}`);
  
  // Return the public URL
  const supabaseUrl = process.env.SUPABASE_URL.replace(/\/$/, "");
  return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${destinationFileName}`;
}

module.exports = { uploadToSupabase };
