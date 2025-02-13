import { Router } from 'express';
import SystemController from './system.controller';

const router = Router();

router.route('/cpu').get(SystemController.getCpuInfo);
router.route('/disk').get(SystemController.getDiskInfo);
router.route('/memory').get(SystemController.getMemoryInfo);
router.route('/version').get(SystemController.getVersion);

export default router;
