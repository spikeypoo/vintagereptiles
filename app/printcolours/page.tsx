"use client";

import '../globals.css';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function Home() {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const imageList = [];
    for (let i = 1; i <= 28; i++) {
      imageList.push(`/images/3dprintcolours/${i}.jpg`);
    }
    setImages(imageList);
  }, []);

  return (
    <div>
      <div className="flex font-bold text-white text-4xl text-center pt-[50px] justify-center">
        3D Print Colours
      </div>

      <div className="flex flex-wrap justify-center gap-10 pt-[49px] px-4">
        {images.map((src, index) => (
          <img
            key={index}
            src={src}
            width={500}
            height={500}
            alt={`3D Print Colour ${index + 1}`}
            className="w-[80%] max-w-[500px] outline rounded-lg outline-white"
          />
        ))}
      </div>

      <br /><br /><br /><br /><br />
    </div>
  );
}