declare module "expo-camera" {
  import React from "react";
  import { ViewStyle } from "react-native";
  export type CameraType = "front" | "back";
  export interface CameraPermissionResponse {
    granted: boolean;
    status: string;
  }
  export function useCameraPermissions(): [CameraPermissionResponse | null, () => Promise<CameraPermissionResponse>];
  export interface CameraViewProps {
    facing?: CameraType;
    style?: ViewStyle | ViewStyle[] | null;
    children?: React.ReactNode;
  }
  export interface PictureOptions {
    quality?: number;
    base64?: boolean;
    skipProcessing?: boolean;
  }
  export interface CapturedPicture {
    uri: string;
    width: number;
    height: number;
    base64?: string;
  }
  export interface CameraViewRef {
    takePictureAsync(options?: PictureOptions): Promise<CapturedPicture>;
  }
  export const CameraView: React.ForwardRefExoticComponent<CameraViewProps & React.RefAttributes<CameraViewRef>>;
}
