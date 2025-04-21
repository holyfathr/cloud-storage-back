import { diskStorage } from 'multer';

const generateId = () =>
  Array(18)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');

const normalizeFileName = (req, file, callback) => {
  const fileExtName = file.originalname.split('.').pop();
  file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  callback(null, `${generateId()}.${fileExtName}`);
};

export const fileStorage = diskStorage({
  destination: './upload',
  filename: normalizeFileName,
});
