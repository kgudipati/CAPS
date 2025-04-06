import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import { FileData } from '@/types';

const templatesDir = path.join(process.cwd(), 'templates');

/**
 * Reads the content of a static template file.
 * @param relativePath Path relative to the templates directory (e.g., 'rules/general-best-practices.mdc').
 * @returns The file content as a string.
 */
export async function readTemplateFile(relativePath: string): Promise<string> {
  const filePath = path.join(templatesDir, relativePath);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Error reading template file ${filePath}:`, error);
    throw new Error(`Could not read template file: ${relativePath}`);
  }
}

/**
 * Creates a ZIP archive containing the provided files.
 * @param files An array of FileData objects ({ path: string, content: string }).
 * @returns A Buffer containing the ZIP archive data.
 */
export async function createZipArchive(files: FileData[]): Promise<Buffer> {
  const zip = new JSZip();

  files.forEach(file => {
    // Ensure path uses forward slashes and is relative
    const cleanPath = file.path.replace(/^\/+/, '').replace(/\\/g, '/');
    zip.file(cleanPath, file.content);
    console.log(`Added to zip: ${cleanPath}`);
  });

  try {
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: "DEFLATE" });
    console.log('ZIP buffer generated successfully.');
    return zipBuffer;
  } catch (error) {
    console.error("Error generating zip file:", error);
    throw new Error("Failed to create ZIP archive.");
  }
} 