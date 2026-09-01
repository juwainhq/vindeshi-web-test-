import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { uploadImage } from '../lib/upload';

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
};

export function ImageUploader({ value, onChange, label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label && <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-black/50">{label}</p>}
      <div className="flex items-start gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-[#e9e9e5]">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-black/30">
              <ImagePlus size={20} />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold transition hover:bg-black/5 disabled:opacity-50"
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
            {uploading ? 'Uploading…' : 'Upload image'}
          </button>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Image URL or path"
            className="w-full min-w-[200px] rounded-lg border border-black/15 px-3 py-1.5 text-xs outline-none focus:border-[#a05a39]"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
