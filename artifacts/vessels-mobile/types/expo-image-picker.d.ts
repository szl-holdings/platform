declare module "expo-image-picker" {
  export interface ImagePickerAsset {
    uri: string;
    width: number;
    height: number;
    base64?: string;
    type?: string;
    fileName?: string;
  }
  export interface ImagePickerResult {
    canceled: boolean;
    assets: ImagePickerAsset[];
  }
  export interface ImagePickerOptions {
    mediaTypes?: string[];
    allowsEditing?: boolean;
    quality?: number;
    base64?: boolean;
  }
  export function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
  export function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
  export function requestMediaLibraryPermissionsAsync(): Promise<{ granted: boolean }>;
}
