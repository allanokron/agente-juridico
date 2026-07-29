"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadProps {
  avatar?: string | null;
  initials: string;
  onUpload: (base64: string) => Promise<void>;
}

export function AvatarUpload({ avatar, initials, onUpload }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreview(base64);
      setUploading(true);
      try {
        await onUpload(base64);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const displaySrc = preview || avatar;

  return (
    <div className="relative group cursor-pointer" onClick={handleClick}>
      <Avatar className="h-20 w-20 ring-4 ring-primary/10">
        {displaySrc && <AvatarImage src={displaySrc} alt="Avatar" />}
        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {uploading ? (
          <Loader2 className="h-5 w-5 text-white animate-spin" />
        ) : (
          <Camera className="h-5 w-5 text-white" />
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
