import multer, { diskStorage } from "multer";
import allowedExtensions from "./allowedExtention.js";


export const uploadFileCloud = ({
  extensions = allowedExtensions.image,
}) => {
  const storage = multer.diskStorage({})

  function fileFilter(req, file, cb) {
    if (extensions.includes(file.mimetype.split('/')[1])) {
      cb(null, true)
    } else {
      cb(new Error('Not Allowed File Type !'), false)
    }
  }

  const file = multer({ fileFilter, storage })

  return file
}

export default uploadFileCloud
