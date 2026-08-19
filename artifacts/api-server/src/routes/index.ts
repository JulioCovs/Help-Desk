import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import departmentsRouter from "./departments";
import ticketsRouter from "./tickets";
import commentsRouter from "./comments";
import usersRouter from "./users";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(departmentsRouter);
router.use(ticketsRouter);
router.use(commentsRouter);
router.use(statsRouter);
router.use(usersRouter);

export default router;
