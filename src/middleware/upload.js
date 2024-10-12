import { dirname } from "path"
import { fileURLToPath } from "url"


export const upload = (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const uploadedFile = req.files.sampleFile;
  const uploadPath = path.join(__dirname, "uploads", uploadedFile.name);

  uploadedFile.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).send(err);
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      uploadedFile.name
    }`
    res.json({ imageUrl })
  })
}

