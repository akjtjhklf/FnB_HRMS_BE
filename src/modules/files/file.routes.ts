import { Router } from "express";
import multer from "multer";
import { listFiles, getFile, uploadFile, deleteFile } from "./file.controller";

const router = Router();
const upload = multer({ dest: "uploads/" }); // tạm lưu local trước khi đẩy Cloudinary

router.get("/", listFiles);
router.get("/:id", getFile);
router.post("/upload", upload.single("file") as any, uploadFile);
router.delete("/:id", deleteFile);

export default router;
