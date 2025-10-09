// app/printcolours/page.tsx
import fs from "fs";
import path from "path";
import Image from "next/image";
import "../globals.css";

export default function Home() {
  const POSTS_DIRECTORY = path.join(process.cwd(), "public", "images", "3dprintcolours");
  const files = fs
  .readdirSync(POSTS_DIRECTORY)
  .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
  .sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    return numA - numB;
  });
  const images = files.filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

  return (
    <div>
      <div className="flex font-bold text-white text-4xl text-center pt-[50px] justify-center">
        3D Print Colours
      </div>

      <div className="flex flex-wrap justify-center gap-10 pt-[49px] px-4">
        {images.map((file, index) => (
          <Image
            key={index}
            src={`/images/3dprintcolours/${file}`}
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
