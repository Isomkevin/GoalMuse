import * as FileSystem from 'expo-file-system';

const BOARD_COVERS_DIR = 'board-covers';

/**
 * Returns true if the URI is a local file path (file:// or path without scheme).
 * These need to be copied to app storage to survive app restarts.
 */
export function isLocalFileUri(uri: string): boolean {
  if (!uri || typeof uri !== 'string') return false;
  return uri.startsWith('file://') || (!uri.startsWith('http://') && !uri.startsWith('https://'));
}

/**
 * Copies a local image file (e.g. from ImagePicker) into the app's document directory
 * so the URI remains valid after app restart. Returns the new persistent URI.
 * If the URI is already under our document directory or is http(s), returns it as-is.
 */
export async function copyToPersistentStorage(sourceUri: string, filename?: string): Promise<string> {
  if (!sourceUri || typeof sourceUri !== 'string') return sourceUri;
  if (!isLocalFileUri(sourceUri)) return sourceUri;

  const dir = `${FileSystem.documentDirectory}${BOARD_COVERS_DIR}`;
  const exists = await FileSystem.getInfoAsync(dir);
  if (!exists.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const ext = sourceUri.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const name = filename || `board-${Date.now()}.${safeExt}`;
  const destUri = `${dir}/${name}`;

  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}
