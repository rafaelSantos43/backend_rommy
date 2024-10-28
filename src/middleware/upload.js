import { dirname } from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "ddvg2h3xe",
  api_key: "996522658934612",
  api_secret: "jiEpgSRDW2PWs_gEsP5kfg3z3BQ",
});

export const upload = async (req, res) => {
  console.log('dedebakend', req, res);
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    const image = req.files.image
   
    
    const result = await cloudinary.uploader.upload(image.tempFilePath, {
      folder: "files_images",
    });

    return res.json({
      message: "subida de imagen con exito!",
      imageUrl: result.secure_url,
    })
  } catch (error) {
    console.error("Error al subir la imagen:", error);
    res.status(500).json({ error: "Error al subir la imagen." });
  }

  // const __filename = fileURLToPath(import.meta.url);
  // const __dirname = dirname(__filename);
  // const uploadedFile = req.files.sampleFile;
  // const uploadPath = path.join(__dirname, "uploads", uploadedFile.name);

  // uploadedFile.mv(uploadPath, function (err) {
  //   if (err) {
  //     return res.status(500).send(err);
  //   }

  //   const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
  //     uploadedFile.name
  //   }`
  //   res.json({ imageUrl })
  // })
};
