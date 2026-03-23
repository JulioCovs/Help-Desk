import { Router, type IRouter } from "express";
import healthRouter from "./health";
import departmentsRouter from "./departments";
import ticketsRouter from "./tickets";
import commentsRouter from "./comments";
import usersRouter from "./users";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(departmentsRouter);
router.use(ticketsRouter);
router.use(commentsRouter);
router.use(usersRouter);
router.use(statsRouter);

export default router;
