import type React from "react";
import { useState } from "react";

type UseImageUploadResult = {
  uploadedImage: string | null;
  uploadedImageFile: File | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearImage: () => void;
};

export function useImageUpload(): UseImageUploadResult {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadedImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setUploadedImage(null);
    setUploadedImageFile(null);
  };

  return {
    uploadedImage,
    uploadedImageFile,
    handleImageUpload,
    clearImage,
  };
}
