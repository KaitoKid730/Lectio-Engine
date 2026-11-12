import { Router } from 'express';
import { processBookController, getBookByIdController, listBooksController } from '../controllers/book.controller';

const bookRouter = Router();

bookRouter.post('/process', processBookController);
bookRouter.get('/:id', getBookByIdController);
bookRouter.get('/', listBooksController);

export default bookRouter;
