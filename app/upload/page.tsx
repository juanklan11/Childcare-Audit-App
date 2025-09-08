"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";

type UploadedFile = {
  name: string;
  size: number;
  type: string;
  url: string;
};

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...f]);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = Array.from(e.dataTransfer.files || []);
    setFiles((prev) => [...prev, ...f]);
  }, []);

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalSize = useMemo(
    () => files.reduce((a, f) => a + f.size, 0),
    [files]
  );

  const startUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }

      const data = (await res.json()) as { items: UploadedFile[] };
      setUploaded((prev) => [...data.items, ...prev]);
      setFiles([]);
    } catch (err: any) {
      alert(err?.message || "Upload error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
              <span className="text-sm font-bold text-emerald-700">LID</span>
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                Auditor Upload
              </div>
              <div className="text-xs text-slate-500">
                Bills • Photos • Drawings • Evidence
              </div>
            </div>
          </div>
          <a
            className="text-xs text-blue-600 underline"
            href="/dashboard"
            title="Back to Dashboard"
          >
            Back to Dashboard
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Upload audit evidence
        </h1>
        <p className="mt-2 text-slate-600">
          Drag & drop or pick multiple files. Works with images (JPG/PNG/WEBP),
          PDFs, spreadsheets, and more. Files are stored in Vercel Blob and the
          API returns permanent URLs you can feed into your dashboard.
        </p>

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center"
        >
          <div className="text-slate-600">
            <div className="text-sm">Drag & drop files here</div>
            <div className="mt-2 text-xs text-slate-500">or</div>
            <button
              className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              onClick={() => inputRef.current?.click()}
            >
              Choose files
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              multiple
              onChange={onPick}
            />
          </div>
        </div>

        {/* Selected files */}
        {files.length > 0 && (
          <div className="mt-6 rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Selected files</h2>
              <div className="text-xs text-slate-500">
                {files.length} file(s) • {(totalSize / 1_000_000).toFixed(2)} MB
              </div>
            </div>
            <ul className="mt-3 divide-y">
              {files.map((f, i) => (
                <li
                  key={f.name + i}
                  className="flex items-center justify-between py-2"
                >
                  <div className="truncate">
                    <div className="truncate text-sm font-medium">{f.name}</div>
                    <div className="text-xs text-slate-500">
                      {(f.size / 1_000).toFixed(0)} KB • {f.type || "unknown"}
                    </div>
                  </div>
                  <button
                    className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                    onClick={() => removeFile(i)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end">
              <button
                disabled={uploading}
                onClick={startUpload}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mt-6 rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-medium">Recently uploaded</h2>
          {uploaded.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No files yet.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {uploaded.map((u, i) => (
                <li key={u.url + i} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{u.name}</div>
                    <div className="truncate text-xs text-slate-500">
                      {u.type} • {(u.size / 1_000).toFixed(0)} KB
                    </div>
                  </div>
                  <a
                    href={u.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate pl-3 text-xs text-blue-600 underline"
                    title={u.url}
                  >
                    {u.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
