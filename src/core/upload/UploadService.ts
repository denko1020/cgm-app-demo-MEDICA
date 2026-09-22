import type { GlucoseReading } from '../types';

export interface UploadService {
  upload(readings: GlucoseReading[]): Promise<{ uploadedIds: string[] }>;
}

/**
 * Stand-in for the clinical data server. Resolves after a short delay and
 * can be switched to fail so that the "not uploaded" path can be tested.
 */
export class MockUploadService implements UploadService {
  failNext = false;

  async upload(readings: GlucoseReading[]): Promise<{ uploadedIds: string[] }> {
    await new Promise((r) => setTimeout(r, 800));
    if (this.failNext) {
      this.failNext = false;
      throw new Error('Upload rejected by server (simulated)');
    }
    return { uploadedIds: readings.map((r) => r.id) };
  }
}
