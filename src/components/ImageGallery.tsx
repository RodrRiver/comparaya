"use client";

import { useState } from "react";

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (images.length <= 1) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 sm:p-8 aspect-square flex items-center justify-center">
        <img
          src={images[0]}
          alt={alt}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl border bg-muted/30 p-6 sm:p-8 aspect-square flex items-center justify-center mb-3">
        <img
          src={images[selected]}
          alt={alt}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`shrink-0 w-16 h-16 rounded-lg border-2 p-1 transition-colors ${
              i === selected
                ? "border-primary"
                : "border-transparent hover:border-muted-foreground/30"
            }`}
          >
            <img
              src={img}
              alt={`${alt} ${i + 1}`}
              className="w-full h-full object-contain"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
