import { Router } from 'express';
import {
  generateImageController,
  getImageByIdController,
  listImagesController,
} from '../controllers/image.controller';

const imageRouter = Router();

imageRouter.post('/generate', generateImageController);
imageRouter.get('/:id', getImageByIdController);
imageRouter.get('/', listImagesController);

export default imageRouter;
