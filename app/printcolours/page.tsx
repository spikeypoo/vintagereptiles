// app/printcolours/page.tsx
import Image from "next/image";
import "../globals.css";
import connect from "@/app/utils/startMongo";

type ProductColour = {
  id: string;
  name: string;
  imageUrl: string;
};

async function getProductColours(): Promise<ProductColour[]> {
  try {
    const client = await connect;
    const colours = await client
      .db("Products")
      .collection("ProductColours")
      .find({})
      .sort({ sortOrder: 1, createdAt: 1 })
      .toArray();

    return colours.map((colour: any) => ({
      id: colour._id?.toString() ?? "",
      name: colour.name ?? "",
      imageUrl: colour.imageUrl ?? "",
    }));
  } catch (error) {
    console.error("Failed to load product colours", error);
    return [];
  }
}

export default async function Home() {
  const colours = await getProductColours();

  return (
    <div>
      <div className="flex font-bold text-white text-4xl text-center pt-[50px] justify-center">
        3D Print Colours
      </div>

      <div className="flex flex-wrap justify-center gap-10 pt-[49px] px-4">
        {colours.length > 0 ? (
          colours.map((colour) => (
            <div key={colour.id} className="flex flex-col items-center gap-4">
              <img
                src={colour.imageUrl}
                width={500}
                height={500}
                alt={colour.name || "3D Print Colour"}
                className="w-[80%] max-w-[500px] outline rounded-lg outline-white"
              />
              {colour.name && (
                <p className="text-white text-lg text-center font-semibold">
                  {colour.name}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-white text-xl">No colours available right now.</p>
        )}
      </div>

      <br /><br /><br /><br /><br />
    </div>
  );
}
