/**
 * Helper to upload image files to Supabase Storage.
 * If the credentials are not provided or if the upload fails, 
 * it falls back to returning the base64 data URL to store in the DB.
 */
export async function uploadToBucket(base64DataUrl: string, fileName: string): Promise<string> {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl) {
    // Strip trailing slashes and /rest/v1 if included
    supabaseUrl = supabaseUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
  }

  // Fallback to storing base64 directly in DB if keys are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('[Storage] Supabase keys missing, falling back to base64 database storage.');
    return base64DataUrl;
  }

  try {
    // Parse the base64 data URL
    const commaIndex = base64DataUrl.indexOf(',');
    if (commaIndex === -1) {
      throw new Error('Invalid base64 data URL format');
    }

    const header = base64DataUrl.slice(0, commaIndex);
    const base64Content = base64DataUrl.slice(commaIndex + 1);
    const buffer = Buffer.from(base64Content, 'base64');
    
    // Extract mime type
    const mimeMatch = header.match(/data:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/webp';

    // Call Supabase Storage REST API directly (no dependency needed)
    // Uploads to bucket named "presensi"
    const uploadUrl = `${supabaseUrl}/storage/v1/object/presensi/${fileName}`;

    console.log(`[Storage] Uploading to Supabase Storage: ${uploadUrl}`);
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': mimeType,
        // x-upsert is true so it overwrites existing files if needed
        'x-upsert': 'true',
      },
      body: buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase Storage upload failed with status ${response.status}: ${errorText}`);
    }

    // Return the public URL for the uploaded object
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/presensi/${fileName}`;
    console.log(`[Storage] Successfully uploaded to ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.error('[Storage] Error during Supabase upload, using base64 fallback:', error.message || error);
    // Return original base64 as fallback
    return base64DataUrl;
  }
}
