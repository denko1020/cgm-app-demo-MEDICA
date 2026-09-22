import { Platform, Share } from 'react-native';

/**
 * Hands a text file to the user. On web this triggers a browser download; on
 * iOS/Android it opens the share sheet with the text (no extra native module
 * needed for the prototype — swap in expo-file-system + expo-sharing later).
 */
export async function exportTextFile(filename: string, content: string, mime = 'text/csv'): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob(['﻿', content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  await Share.share({ title: filename, message: content });
}
