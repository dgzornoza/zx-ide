/**
 * Tests if the current shell application runs in development mode
 */
export const __DEV__ = process.env.NODE_ENV === 'development';

/**
 * Tests if the current shell application runs on Windows
 */
export const __WIN32__ = process.platform === 'win32';

/**
 * Tests if the current shell application runs on Mac OS
 */
export const __DARWIN__ = process.platform === 'darwin';

/**
 * Tests if the current shell application runs on Linux
 */
export const __LINUX__ = process.platform === 'linux';

/**
 * Gets the current home folder
 */
export function getHomeFolder(): string | undefined {
  return process.env[__WIN32__ ? 'USERPROFILE' : 'HOME'];
}
