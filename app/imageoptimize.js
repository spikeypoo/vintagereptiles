const sharp = require("sharp")

export async function GetImage(data)
{
    resized = await sharp(data).resize(400, 400)

    return resized
}